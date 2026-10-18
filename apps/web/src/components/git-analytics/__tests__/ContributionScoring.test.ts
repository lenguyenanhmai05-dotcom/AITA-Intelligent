import { describe, it, expect } from 'vitest';
import {
  CONTRIBUTION_WEIGHTS,
  FREE_RIDING_THRESHOLD_DEFAULT,
  FREE_RIDING_THRESHOLD_MIN,
  FREE_RIDING_THRESHOLD_MAX,
} from '@aita/shared';

export interface RawMemberStat {
  name: string;
  email: string;
  loc: number;
  commits: number;
  prs: number;
}

export interface CalculatedContribution extends RawMemberStat {
  pct: number;
  isFreeRider: boolean;
}

/**
 * Công thức tính điểm đóng góp 40/40/20 (BR-11)
 * contributionPercentage = 40% LOC share + 40% Commits share + 20% PRs share
 * Xử lý triệt để các trường hợp chia cho 0 khi repo mới khởi tạo hoặc không có PR
 */
export function calculateTeamContributions(
  members: RawMemberStat[],
  threshold = FREE_RIDING_THRESHOLD_DEFAULT
): CalculatedContribution[] {
  if (!members || members.length === 0) return [];

  const totalLoc = members.reduce((sum, m) => sum + Math.max(0, m.loc), 0);
  const totalCommits = members.reduce((sum, m) => sum + Math.max(0, m.commits), 0);
  const totalPrs = members.reduce((sum, m) => sum + Math.max(0, m.prs), 0);

  // Trường hợp biên: Nhóm rỗng không có bất kỳ đóng góp nào (0 LOC, 0 commits, 0 PRs)
  if (totalLoc === 0 && totalCommits === 0 && totalPrs === 0) {
    const equalShare = parseFloat((100 / members.length).toFixed(1));
    return members.map(m => ({
      ...m,
      pct: equalShare,
      isFreeRider: false,
    }));
  }

  return members.map(m => {
    const locShare = totalLoc > 0 ? (m.loc / totalLoc) : 0;
    const commitShare = totalCommits > 0 ? (m.commits / totalCommits) : 0;
    const prShare = totalPrs > 0 ? (m.prs / totalPrs) : 0;

    // Nếu không có PR nào trong cả repo, tái phân bổ trọng số 50% LOC + 50% Commits
    let rawPct: number;
    if (totalPrs === 0) {
      rawPct = (0.5 * locShare + 0.5 * commitShare) * 100;
    } else {
      rawPct = (
        CONTRIBUTION_WEIGHTS.LOC * locShare +
        CONTRIBUTION_WEIGHTS.COMMITS * commitShare +
        CONTRIBUTION_WEIGHTS.PRS * prShare
      ) * 100;
    }

    const pct = parseFloat(rawPct.toFixed(1));
    return {
      ...m,
      pct,
      isFreeRider: pct < threshold,
    };
  });
}

describe('Task 22: 40/40/20 Contribution Scoring & Edge Cases Engine (BR-11, BR-12)', () => {
  it('định nghĩa chính xác tỷ lệ trọng số 40% LOC, 40% Commits, 20% PRs (BR-11)', () => {
    expect(CONTRIBUTION_WEIGHTS.LOC).toBe(0.4);
    expect(CONTRIBUTION_WEIGHTS.COMMITS).toBe(0.4);
    expect(CONTRIBUTION_WEIGHTS.PRS).toBe(0.2);
    expect(CONTRIBUTION_WEIGHTS.LOC + CONTRIBUTION_WEIGHTS.COMMITS + CONTRIBUTION_WEIGHTS.PRS).toBe(1.0);
  });

  it('định nghĩa phạm vi ngưỡng Free-Riding chuẩn theo BR-12 (1% đến 20%, mặc định 5%)', () => {
    expect(FREE_RIDING_THRESHOLD_DEFAULT).toBe(5);
    expect(FREE_RIDING_THRESHOLD_MIN).toBe(1);
    expect(FREE_RIDING_THRESHOLD_MAX).toBe(20);
  });

  it('tính toán chính xác phần trăm đóng góp tiêu chuẩn của nhóm 4 thành viên', () => {
    const team: RawMemberStat[] = [
      { name: 'Nguyễn Văn A', email: 'a@fpt.edu.vn', loc: 1000, commits: 20, prs: 5 },
      { name: 'Trần Thị B',   email: 'b@fpt.edu.vn', loc: 500,  commits: 10, prs: 3 },
      { name: 'Lê Văn C',     email: 'c@fpt.edu.vn', loc: 400,  commits: 8,  prs: 2 },
      { name: 'Phạm Thị D',   email: 'd@fpt.edu.vn', loc: 100,  commits: 2,  prs: 0 },
    ];

    const results = calculateTeamContributions(team, 5);

    // Thành viên A đóng góp nhiều nhất
    expect(results[0].pct).toBeGreaterThan(40);
    expect(results[0].isFreeRider).toBe(false);

    // Thành viên D đóng góp rất ít (< 5%) -> Bị gắn cờ Free-Rider
    expect(results[3].pct).toBeLessThan(5);
    expect(results[3].isFreeRider).toBe(true);

    // Tổng tỷ lệ phần trăm xấp xỉ 100%
    const sumPct = results.reduce((s, r) => s + r.pct, 0);
    expect(Math.round(sumPct)).toBe(100);
  });

  it('xử lý trường hợp biên chia cho 0: repo hoàn toàn rỗng không gây crash hay trả về NaN', () => {
    const emptyTeam: RawMemberStat[] = [
      { name: 'Member 1', email: 'm1@fpt.edu.vn', loc: 0, commits: 0, prs: 0 },
      { name: 'Member 2', email: 'm2@fpt.edu.vn', loc: 0, commits: 0, prs: 0 },
    ];

    const results = calculateTeamContributions(emptyTeam);

    expect(results).toHaveLength(2);
    expect(Number.isNaN(results[0].pct)).toBe(false);
    expect(Number.isNaN(results[1].pct)).toBe(false);
    expect(results[0].pct).toBe(50);
    expect(results[1].pct).toBe(50);
    expect(results[0].isFreeRider).toBe(false);
  });

  it('xử lý trường hợp repo không có PR nào (totalPrs = 0): tái phân bổ 50/50 giữa LOC và Commits', () => {
    const noPrTeam: RawMemberStat[] = [
      { name: 'Dev 1', email: 'dev1@fpt.edu.vn', loc: 300, commits: 30, prs: 0 },
      { name: 'Dev 2', email: 'dev2@fpt.edu.vn', loc: 100, commits: 10, prs: 0 },
    ];

    const results = calculateTeamContributions(noPrTeam);

    // Dev 1 có 75% LOC và 75% commits -> 75%
    expect(results[0].pct).toBe(75);
    // Dev 2 có 25% LOC và 25% commits -> 25%
    expect(results[1].pct).toBe(25);
    expect(Number.isNaN(results[0].pct)).toBe(false);
  });

  it('xử lý trường hợp dự án chỉ có 1 tác giả duy nhất làm hết (Single Contributor)', () => {
    const soloTeam: RawMemberStat[] = [
      { name: 'Solo Dev', email: 'solo@fpt.edu.vn', loc: 1500, commits: 45, prs: 8 },
    ];

    const results = calculateTeamContributions(soloTeam);

    expect(results[0].pct).toBe(100);
    expect(results[0].isFreeRider).toBe(false);
  });

  it('cập nhật động cờ Free-Rider khi thay đổi ngưỡng từ 5% lên 10%', () => {
    const team: RawMemberStat[] = [
      { name: 'Dev Lead', email: 'lead@fpt.edu.vn', loc: 800, commits: 18, prs: 4 },
      { name: 'Dev Member', email: 'mem@fpt.edu.vn', loc: 200, commits: 4, prs: 1 }, // ~16%
      { name: 'Low Contributor', email: 'low@fpt.edu.vn', loc: 80, commits: 2, prs: 0 }, // ~7%
    ];

    // Với ngưỡng mặc định 5%: Low Contributor (7%) KHÔNG bị cờ
    const defaultResults = calculateTeamContributions(team, 5);
    const lowMemberDefault = defaultResults.find(m => m.name === 'Low Contributor')!;
    expect(lowMemberDefault.isFreeRider).toBe(false);

    // Khi giảng viên nâng ngưỡng lên 10%: Low Contributor (7% < 10%) BỊ GẮN CỜ Free-Rider
    const strictResults = calculateTeamContributions(team, 10);
    const lowMemberStrict = strictResults.find(m => m.name === 'Low Contributor')!;
    expect(lowMemberStrict.isFreeRider).toBe(true);
  });
});
