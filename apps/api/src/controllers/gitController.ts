// @ts-nocheck
import { Request, Response } from 'express';
import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

// ENCRYPTION_KEY phải là 64 hex chars = 32 bytes (AES-256)
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '0'.repeat(64)).slice(0, 64);
const IV_LENGTH = 16;

// File/folder rác cần bỏ qua khi tính LOC (BR-13)
const NOISE_PATTERNS = [
  'node_modules/', 'dist/', 'build/', '.next/', 'out/',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.env', '.DS_Store', '*.min.js', '*.min.css'
];

// =====================================================================
// UTILITIES
// =====================================================================

/**
 * Mã hóa PAT bằng AES-256-CBC (BR-08)
 */
function encryptPAT(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Kiểm tra một filepath có phải là file rác không (BR-13)
 */
function isNoisePath(filePath: string): boolean {
  return NOISE_PATTERNS.some(p => filePath.includes(p.replace('*', '')));
}

// =====================================================================
// GIT PARSER (Milestone 3 - BR-10, BR-13)
// =====================================================================

interface CommitInfo {
  hash: string;
  authorEmail: string;
  authorName: string;
  date: string;
  linesAdded: number;
  linesDeleted: number;
  isSuspicious: boolean;
  suspiciousReason: string | null;
}

/**
 * Heuristic 1: Whitespace-only (BR-10)
 * Phát hiện commit chỉ thay đổi dấu cách/tab để tăng LOC giả
 */
function detectWhitespaceOnly(diffText: string): boolean {
  const changedLines = diffText
    .split('\n')
    .filter(l => l.startsWith('+') || l.startsWith('-'))
    .filter(l => !l.startsWith('+++') && !l.startsWith('---'));

  if (changedLines.length === 0) return false;
  const meaningless = changedLines.filter(l => l.slice(1).trim() === '');
  return meaningless.length === changedLines.length;
}

/**
 * Heuristic 2: Self-revert (BR-10)
 * Phát hiện commit đảo ngược hoàn toàn commit trước của cùng tác giả
 */
function detectSelfRevert(commits: CommitInfo[], currentIdx: number): boolean {
  if (currentIdx === 0) return false;
  const curr = commits[currentIdx];
  const prev = commits[currentIdx - 1];
  // Nếu cùng tác giả và số dòng thêm/xóa đảo ngược nhau
  if (curr.authorEmail === prev.authorEmail &&
      Math.abs(curr.linesAdded - prev.linesDeleted) <= 2 &&
      Math.abs(curr.linesDeleted - prev.linesAdded) <= 2 &&
      (curr.linesAdded + curr.linesDeleted) > 0) {
    return true;
  }
  return false;
}

/**
 * Parse git log --numstat để lấy danh sách commit và LOC
 */
async function parseGitLog(repoDir: string): Promise<CommitInfo[]> {
  // Format: hash | email | name | date
  const logCmd = `git -C "${repoDir}" log --format="COMMIT|%H|%ae|%an|%aI" --numstat`;
  const { stdout } = await execAsync(logCmd, { maxBuffer: 50 * 1024 * 1024 });

  const commits: CommitInfo[] = [];
  let current: CommitInfo | null = null;

  for (const line of stdout.split('\n')) {
    if (line.startsWith('COMMIT|')) {
      if (current) commits.push(current);
      const [, hash, email, name, date] = line.split('|');
      current = { hash, authorEmail: email, authorName: name, date, linesAdded: 0, linesDeleted: 0, isSuspicious: false, suspiciousReason: null };
    } else if (current && line.match(/^\d+\s+\d+\s+/)) {
      // numstat line: added  deleted  filepath
      const parts = line.split('\t');
      const filePath = parts[2] || '';
      if (!isNoisePath(filePath)) {
        current.linesAdded += parseInt(parts[0]) || 0;
        current.linesDeleted += parseInt(parts[1]) || 0;
      }
    }
  }
  if (current) commits.push(current);

  // Áp dụng Heuristic (BR-10) - cần diff để kiểm tra whitespace
  for (let i = 0; i < commits.length; i++) {
    // Lấy diff của commit để kiểm tra whitespace-only
    try {
      const diffCmd = `git -C "${repoDir}" show ${commits[i].hash} --unified=0`;
      const { stdout: diffOut } = await execAsync(diffCmd, { maxBuffer: 10 * 1024 * 1024 });
      if (detectWhitespaceOnly(diffOut)) {
        commits[i].isSuspicious = true;
        commits[i].suspiciousReason = 'Whitespace-only (adding spaces to farm LOC)';
        continue;
      }
    } catch (_) { /* skip if diff fails */ }

    if (detectSelfRevert(commits, i)) {
      commits[i].isSuspicious = true;
      commits[i].suspiciousReason = 'Self-revert (reverting own previous commit)';
    }
  }

  return commits;
}

/**
 * Tính điểm đóng góp theo công thức 40% LOC + 40% Commits + 20% PRs (BR-11)
 */
function calcContribution(members: { name: string; email: string; loc: number; commits: number; prs: number }[]) {
  const totalLoc = members.reduce((s, m) => s + m.loc, 0) || 1;
  const totalCommits = members.reduce((s, m) => s + m.commits, 0) || 1;
  const totalPrs = members.reduce((s, m) => s + m.prs, 0) || 1;

  return members.map(m => ({
    ...m,
    pct: parseFloat((
      0.4 * (m.loc / totalLoc) +
      0.4 * (m.commits / totalCommits) +
      0.2 * (m.prs / totalPrs)
    ).toFixed(4)) * 100
  }));
}

// =====================================================================
// IN-MEMORY STORE (thay thế DB khi Prisma chưa ready)
// =====================================================================
const analysisStore: Record<string, { status: string; commits?: CommitInfo[]; error?: string; groupId?: string }> = {};

// =====================================================================
// GITHUB PR API (Milestone 3 - UC-09)
// =====================================================================

interface PRInfo {
  authorLogin: string;
  count: number;
}

/**
 * Gọi GitHub REST API lấy số PR của từng thành viên (UC-09)
 * Endpoint: GET /repos/{owner}/{repo}/pulls?state=all&per_page=100
 */
async function fetchGitHubPRs(repoUrl: string, patToken?: string): Promise<PRInfo[]> {
  try {
    // Trích xuất owner/repo từ URL
    // VD: https://github.com/lenguyenanhmai05/AITA-Intelligent.git → owner=lenguyenanhmai05, repo=AITA-Intelligent
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) return [];
    const [, owner, repo] = match;

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AITA-Git-Engine'
    };
    if (patToken) headers['Authorization'] = `Bearer ${patToken}`;

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.warn(`[Git Engine] GitHub PR API returned ${response.status}`);
      return [];
    }

    const prs: any[] = await response.json();

    // Đếm số PR theo từng tác giả
    const prMap: Record<string, number> = {};
    for (const pr of prs) {
      const login = pr.user?.login || 'unknown';
      prMap[login] = (prMap[login] || 0) + 1;
    }

    return Object.entries(prMap).map(([authorLogin, count]) => ({ authorLogin, count }));
  } catch (err) {
    console.warn('[Git Engine] GitHub PR API failed, skipping PRs:', err);
    return [];
  }
}

// =====================================================================
// API HANDLERS
// =====================================================================

/**
 * POST /api/git/analyze
 * 1. Mã hóa PAT (BR-08)
 * 2. Tạo Sandbox Bare Clone (UC-07)
 * 3. Parse commits & bắt gian lận (BR-10, BR-13)
 */
export const analyzeGitRepo = async (req: Request, res: Response) => {
  try {
    const { url, branch = 'main', groupId, patToken } = req.body;

    if (!url) return res.status(400).json({ success: false, message: 'Thiếu Git URL' });

    // BR-09: Mỗi nhóm chỉ được có tối đa 1 phân tích đang chạy cùng lúc
    if (groupId) {
      const activeJob = Object.values(analysisStore).find(
        j => j.groupId === String(groupId) && (j.status === 'cloning' || j.status === 'parsing')
      );
      if (activeJob) {
        return res.status(409).json({
          success: false,
          message: 'Nhóm này đang có một phân tích đang chạy. Vui lòng chờ kết thúc trước khi bắt đầu mới (BR-09).'
        });
      }
    }

    // Mã hóa PAT (BR-08)
    let encryptedPat: string | null = null;
    let cloneUrl = url;
    if (patToken) {
      encryptedPat = encryptPAT(patToken);
      cloneUrl = url.replace('https://', `https://${patToken}@`);
    }

    // Tạo thư mục sandbox (UC-07)
    const jobId = `repo_${Date.now()}`;
    const sandboxDir = path.join(process.cwd(), 'scratch', 'clones', jobId);
    fs.mkdirSync(sandboxDir, { recursive: true });

    // Lưu trạng thái + groupId để kiểm tra BR-09
    analysisStore[jobId] = { status: 'cloning', groupId: String(groupId || '') };

    // Phản hồi ngay để không block UI
    res.json({
      success: true,
      message: 'Đang tiến hành phân tích Git Repo...',
      data: { jobId, url, branch, encryptedPat: encryptedPat ? '***AES-256***' : null, status: 'cloning' }
    });

    // === BACKGROUND JOB ===
    (async () => {
      try {
        // Bước 1: Clone bare repo
        let targetDir = sandboxDir;
        if (url.includes('AITA-Intelligent')) {
          console.log('[Git Engine] Demo Mode: Using local repository instead of cloning!');
          targetDir = require('path').resolve(__dirname, '../../../../');
          analysisStore[jobId].status = 'parsing';
        } else {
          console.log(`[Git Engine] Cloning ${url} -> ${sandboxDir}`);
          await execAsync(`git clone --bare --branch ${branch} "${cloneUrl}" "${sandboxDir}"`, { timeout: 120000 });
          analysisStore[jobId].status = 'parsing';
        }

        // Bước 2: Parse commit history
        console.log('[Git Engine] Parsing commit log from ' + targetDir);
        const commits = await parseGitLog(targetDir);

        // Bước 3: Gọi GitHub PR API
        console.log('[Git Engine] Fetching GitHub PRs...');
        const prList = await fetchGitHubPRs(url, patToken);
        
        (analysisStore[jobId] as any).prList = prList;
        analysisStore[jobId] = { ...analysisStore[jobId], status: 'done', commits };
        
        analysisStore['latest'] = analysisStore[jobId] as any;
        (analysisStore['latest'] as any).prList = prList;
        (analysisStore['latest'] as any).repoUrl = url;

        console.log(`[Git Engine] Done! ${commits.length} commits parsed.`);

        // Bước 4: Dọn sandbox
        if (targetDir === sandboxDir) {
          fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
        console.log('[Git Engine] Sandbox cleaned.');
      } catch (err: any) {
        analysisStore[jobId] = { status: 'error', error: err.message };
        console.error('[Git Engine] Background job failed:', err.message);
      }
    })();

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/git/report?jobId=xxx
 * Trả về báo cáo đóng góp và danh sách commit gian lận
 */
export const getGitReport = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.query;

    // Nếu có jobId thực tế → trả dữ liệu thật từ store
    if (jobId && analysisStore[jobId as string]) {
      const job = analysisStore[jobId as string];
      if (job.status !== 'done') {
        return res.json({ success: true, data: { status: job.status, error: job.error || null } });
      }

      const commits = job.commits!;
      const prList: PRInfo[] = (job as any).prList || [];

      const flaggedCommits = commits
        .filter(c => c.isSuspicious)
        .map((c, idx) => ({ id: idx + 1, name: c.authorName, email: c.authorEmail, date: c.date.slice(0, 10), behavior: c.suspiciousReason }));

      // Gom LOC + Commits theo từng tác giả (dùng name thay vì email để tránh bị tách đôi do 2 email)
      const authorMap: Record<string, { name: string; email: string; loc: number; commits: number; prs: number }> = {};
      for (const c of commits) {
        const authorKey = c.authorName.toLowerCase().trim();
        if (!authorMap[authorKey]) {
          authorMap[authorKey] = { name: c.authorName, email: c.authorEmail, loc: 0, commits: 0, prs: 0 };
        }
        authorMap[authorKey].loc += c.linesAdded;
        authorMap[authorKey].commits += 1;
      }

      // Ghép số PR từ GitHub API vào (khớp theo githubUsername ↔ email prefix)
      for (const pr of prList) {
        const matched = Object.values(authorMap).find(a =>
          a.email.split('@')[0].toLowerCase() === pr.authorLogin.toLowerCase() ||
          a.name.toLowerCase().replace(/\s/g, '') === pr.authorLogin.toLowerCase()
        );
        if (matched) matched.prs += pr.count;
      }

              // Demo SWP391: Đảm bảo hiện đủ 5 thành viên (dù chưa commit)
        if (job.groupId !== '5') {
          const swp391Members = ['lenguyenanhmai05-dotcom', 'ngosuvietanhqn05-cpu', 'Nghiad04052k5', 'khanhlinhz2k4-max', 'gi098'];
          for (const m of swp391Members) {
            const found = Object.values(authorMap).some(a => a.name.toLowerCase().includes(m.toLowerCase().split(' ').pop()!));
            if (!found) {
              authorMap[m] = { name: m, email: 'unknown@fpt.edu.vn', loc: 0, commits: 0, prs: 0 };
            }
          }
        }

        const COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];
      const contributions = calcContribution(Object.values(authorMap))
        .sort((a, b) => b.pct - a.pct)
        .map((m, i) => ({ ...m, color: COLORS[i % COLORS.length], codeLines: `+${m.loc}` }));

      return res.json({ success: true, data: { status: 'done', teamContributions: contributions, flaggedCommits } });
    }

    // Fallback: dùng 'latest' nếu có, ngược lại dùng Mock data
    const latestJob = (req.query.jobId && analysisStore[req.query.jobId as string]) ? null : analysisStore['latest'] as any;
    if (latestJob && latestJob.status === 'done' && latestJob.commits) {
      const commits = latestJob.commits;
      const prList: PRInfo[] = latestJob.prList || [];

      const flaggedCommits = commits
        .filter((c: any) => c.isSuspicious)
        .map((c: any, idx: number) => ({ id: idx + 1, name: c.authorName, email: c.authorEmail, date: c.date.slice(0, 10), behavior: c.suspiciousReason }));

      const authorMap: Record<string, { name: string; email: string; loc: number; commits: number; prs: number }> = {};
      for (const c of commits) {
        const authorKey = c.authorName.toLowerCase().trim();
        if (!authorMap[authorKey]) {
          authorMap[authorKey] = { name: c.authorName, email: c.authorEmail, loc: 0, commits: 0, prs: 0 };
        }
        authorMap[authorKey].loc += c.linesAdded;
        authorMap[authorKey].commits += 1;
      }

      for (const pr of prList) {
        const matched = Object.values(authorMap).find((a: any) =>
          a.email.split('@')[0].toLowerCase() === pr.authorLogin.toLowerCase() ||
          a.name.toLowerCase().replace(/\s/g, '') === pr.authorLogin.toLowerCase()
        );
        if (matched) matched.prs += pr.count;
      }

              // Demo SWP391: Đảm bảo hiện đủ 5 thành viên (dù chưa commit)
        if (latestJob.groupId !== '5') {
          const swp391Members = ['lenguyenanhmai05-dotcom', 'ngosuvietanhqn05-cpu', 'Nghiad04052k5', 'khanhlinhz2k4-max', 'gi098'];
          for (const m of swp391Members) {
            const found = Object.values(authorMap).some(a => a.name.toLowerCase().includes(m.toLowerCase().split(' ').pop()!));
            if (!found) {
              authorMap[m] = { name: m, email: 'unknown@fpt.edu.vn', loc: 0, commits: 0, prs: 0 };
            }
          }
        }

        const COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];
      const contributions = calcContribution(Object.values(authorMap))
        .sort((a, b) => b.pct - a.pct)
        .map((m, i) => ({ ...m, color: COLORS[i % COLORS.length], codeLines: `+${m.loc}` }));

      return res.json({ success: true, data: { status: 'done', teamContributions: contributions, flaggedCommits, repoUrl: latestJob.repoUrl } });
    }
    const mockData = {
      status: 'done',
      teamContributions: [
        { name: 'Lê Nguyễn Anh Mai', pct: 38.5, color: '#2563EB', commits: 42, prs: 6, codeLines: '+3,420 / -850' },
        { name: 'Trần Quốc Bảo',     pct: 31.0, color: '#0EA5E9', commits: 35, prs: 4, codeLines: '+2,850 / -420' },
        { name: 'Phạm Hoàng Long',   pct: 26.5, color: '#10B981', commits: 24, prs: 4, codeLines: '+1,840 / -300' },
        { name: 'Võ Minh Trí',       pct: 4.0,  color: '#EF4444', commits: 3,  prs: 0, codeLines: '+250  / -210' },
      ],
      flaggedCommits: [
        { id: 1, name: 'Võ Minh Trí', email: 'tri.vm@fpt.edu.vn', date: '2026-09-09', behavior: 'Whitespace-only (adding spaces to farm LOC)' },
        { id: 2, name: 'Võ Minh Trí', email: 'tri.vm@fpt.edu.vn', date: '2026-09-08', behavior: 'Self-revert (reverting own previous commit)' }
      ]
    };

    res.json({ success: true, data: mockData });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
