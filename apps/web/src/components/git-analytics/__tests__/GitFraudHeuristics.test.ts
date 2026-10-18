import { describe, it, expect } from 'vitest';
import { SUSPICIOUS_REASONS } from '@aita/shared';

export interface CommitAuditItem {
  hash: string;
  authorEmail: string;
  authorName: string;
  date: string;
  linesAdded: number;
  linesDeleted: number;
  isSuspicious?: boolean;
  suspiciousReason?: string | null;
}

/**
 * Thuật toán Heuristic 1: Whitespace-only (BR-10)
 * Phát hiện commit chỉ thay đổi dấu cách, tab hoặc xuống dòng trống để tăng LOC giả
 */
export function detectWhitespaceOnly(diffText: string): boolean {
  const lines = diffText.split('\n');
  const changedLines = lines
    .filter(l => l.startsWith('+') || l.startsWith('-'))
    .filter(l => !l.startsWith('+++') && !l.startsWith('---'));

  if (changedLines.length === 0) return false;

  // Lấy nội dung sau ký tự +/- và trim
  const emptyOrWhitespaceLines = changedLines.filter(l => l.slice(1).trim() === '');
  return emptyOrWhitespaceLines.length === changedLines.length;
}

/**
 * Thuật toán Heuristic 2: Self-revert (BR-10)
 * Phát hiện commit đảo ngược hoàn toàn commit vừa tạo trước đó của cùng một tác giả
 */
export function detectSelfRevert(commits: CommitAuditItem[], currentIdx: number): boolean {
  if (currentIdx === 0 || currentIdx >= commits.length) return false;

  const curr = commits[currentIdx];
  const prev = commits[currentIdx - 1];

  // Phải cùng tác giả
  if (curr.authorEmail.toLowerCase().trim() !== prev.authorEmail.toLowerCase().trim()) {
    return false;
  }

  // Phải có sự đảo ngược số dòng thêm và xóa (sai số cho phép <= 2 dòng)
  const isOppositeAddDel = Math.abs(curr.linesAdded - prev.linesDeleted) <= 2;
  const isOppositeDelAdd = Math.abs(curr.linesDeleted - prev.linesAdded) <= 2;
  const hasSubstantialChanges = (curr.linesAdded + curr.linesDeleted) >= 10;

  return isOppositeAddDel && isOppositeDelAdd && hasSubstantialChanges;
}

/**
 * Chạy bộ lọc Heuristic kiểm toán toàn diện danh sách commits
 */
export function auditCommitsWithHeuristics(commits: CommitAuditItem[], diffMap: Record<string, string>) {
  return commits.map((c, idx) => {
    const diff = diffMap[c.hash] || '';
    if (diff && detectWhitespaceOnly(diff)) {
      return {
        ...c,
        isSuspicious: true,
        suspiciousReason: SUSPICIOUS_REASONS.WHITESPACE_ONLY,
      };
    }

    if (detectSelfRevert(commits, idx)) {
      return {
        ...c,
        isSuspicious: true,
        suspiciousReason: SUSPICIOUS_REASONS.SELF_REVERT,
      };
    }

    return {
      ...c,
      isSuspicious: false,
      suspiciousReason: null,
    };
  });
}

describe('Task 21: Regex Heuristic Fraud Detection Engine (BR-10)', () => {
  it('định nghĩa các loại gian lận chuẩn theo SUSPICIOUS_REASONS (BR-10)', () => {
    expect(SUSPICIOUS_REASONS.WHITESPACE_ONLY).toBe('whitespace-only');
    expect(SUSPICIOUS_REASONS.SELF_REVERT).toBe('self-revert');
  });

  describe('Heuristic 1: Whitespace-only detection', () => {
    it('bắt cờ đỏ commit khi diff chỉ chứa các dòng trống hoặc khoảng trắng', () => {
      const fakeDiff = `
@@ -10,0 +11,6 @@
+   
+	
+ 
+
+          
+ 
`;
      expect(detectWhitespaceOnly(fakeDiff)).toBe(true);
    });

    it('không gắn cờ khi diff chứa mã nguồn thực tế có thụt lề đầu dòng', () => {
      const validCodeDiff = `
@@ -15,2 +15,6 @@
-const oldVal = 1;
+const newVal = 2;
+  if (newVal > 1) {
+    console.log("Valid code with indentation");
+  }
`;
      expect(detectWhitespaceOnly(validCodeDiff)).toBe(false);
    });

    it('trả về false khi diff rỗng hoặc không có dòng thêm/xóa', () => {
      expect(detectWhitespaceOnly('')).toBe(false);
      expect(detectWhitespaceOnly('--- a/file.ts\n+++ b/file.ts')).toBe(false);
    });
  });

  describe('Heuristic 2: Self-revert detection', () => {
    it('bắt cờ đỏ khi cùng một tác giả thêm 350 dòng rồi ngay sau đó xóa 350 dòng', () => {
      const commits: CommitAuditItem[] = [
        {
          hash: 'c1',
          authorEmail: 'freerider@fpt.edu.vn',
          authorName: 'Võ Minh Trí',
          date: '2026-10-10T10:00:00Z',
          linesAdded: 350,
          linesDeleted: 0,
        },
        {
          hash: 'c2',
          authorEmail: 'freerider@fpt.edu.vn',
          authorName: 'Võ Minh Trí',
          date: '2026-10-10T10:05:00Z',
          linesAdded: 0,
          linesDeleted: 350,
        },
      ];

      expect(detectSelfRevert(commits, 1)).toBe(true);
    });

    it('không gắn cờ self-revert khi hai commit thuộc về hai tác giả khác nhau', () => {
      const commits: CommitAuditItem[] = [
        {
          hash: 'c1',
          authorEmail: 'authorA@fpt.edu.vn',
          authorName: 'Author A',
          date: '2026-10-10T10:00:00Z',
          linesAdded: 200,
          linesDeleted: 0,
        },
        {
          hash: 'c2',
          authorEmail: 'authorB@fpt.edu.vn',
          authorName: 'Author B', // Bạn cùng nhóm rollback mã lỗi
          date: '2026-10-10T10:15:00Z',
          linesAdded: 0,
          linesDeleted: 200,
        },
      ];

      expect(detectSelfRevert(commits, 1)).toBe(false);
    });

    it('không gắn cờ các commit tinh chỉnh nhỏ hoặc commit đầu tiên trong lịch sử', () => {
      const commits: CommitAuditItem[] = [
        {
          hash: 'c1',
          authorEmail: 'linh@fpt.edu.vn',
          authorName: 'Khánh Linh',
          date: '2026-10-10T10:00:00Z',
          linesAdded: 15,
          linesDeleted: 3,
        },
        {
          hash: 'c2',
          authorEmail: 'linh@fpt.edu.vn',
          authorName: 'Khánh Linh',
          date: '2026-10-10T11:00:00Z',
          linesAdded: 4,
          linesDeleted: 1,
        },
      ];

      expect(detectSelfRevert(commits, 0)).toBe(false);
      expect(detectSelfRevert(commits, 1)).toBe(false);
    });
  });

  describe('Tích hợp kiểm toán toàn diện danh sách commits', () => {
    it('phân loại chính xác các commit hợp lệ và gắn cờ các commit gian lận', () => {
      const testCommits: CommitAuditItem[] = [
        {
          hash: 'h1_valid',
          authorEmail: 'linh.nck@fpt.edu.vn',
          authorName: 'Khánh Linh',
          date: '2026-10-01T10:00:00Z',
          linesAdded: 250,
          linesDeleted: 15,
        },
        {
          hash: 'h2_whitespace',
          authorEmail: 'tri.vm@fpt.edu.vn',
          authorName: 'Minh Trí',
          date: '2026-10-02T11:00:00Z',
          linesAdded: 120,
          linesDeleted: 0,
        },
        {
          hash: 'h3_self_add',
          authorEmail: 'tri.vm@fpt.edu.vn',
          authorName: 'Minh Trí',
          date: '2026-10-03T14:00:00Z',
          linesAdded: 400,
          linesDeleted: 0,
        },
        {
          hash: 'h4_self_del',
          authorEmail: 'tri.vm@fpt.edu.vn',
          authorName: 'Minh Trí',
          date: '2026-10-03T14:05:00Z',
          linesAdded: 0,
          linesDeleted: 400,
        },
      ];

      const diffs: Record<string, string> = {
        h1_valid: '+export function calculate() { return 42; }',
        h2_whitespace: '+\n+   \n+\t\n+  ',
        h3_self_add: '+// dummy 400 lines',
        h4_self_del: '-// delete 400 lines',
      };

      const audited = auditCommitsWithHeuristics(testCommits, diffs);

      // Commit 1: Hợp lệ
      expect(audited[0].isSuspicious).toBe(false);

      // Commit 2: Whitespace-only
      expect(audited[1].isSuspicious).toBe(true);
      expect(audited[1].suspiciousReason).toBe('whitespace-only');

      // Commit 3: Hợp lệ ở bước add
      expect(audited[2].isSuspicious).toBe(false);

      // Commit 4: Bị bắt Self-revert đảo ngược của commit 3
      expect(audited[3].isSuspicious).toBe(true);
      expect(audited[3].suspiciousReason).toBe('self-revert');
    });
  });
});
