import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateContributionScores, GitMemberIdentity, matchGitAuthor } from './gitAnalytics.service';

const members: GitMemberIdentity[] = [
  {
    id: 1,
    fullName: 'Ngô Sử Việt Anh',
    email: 'vietanh.student@fpt.edu.vn',
    githubUsername: 'vietanh-dev',
    gitEmails: [{ gitEmail: 'vietanh.student@fpt.edu.vn' }, { gitEmail: 'vietanh.personal@gmail.com' }],
  },
  {
    id: 2,
    fullName: 'Đào Minh Nghĩa',
    email: 'nghia.student@fpt.edu.vn',
    githubUsername: 'nghia-dev',
    gitEmails: [{ gitEmail: 'nghia.student@fpt.edu.vn' }],
  },
];

describe('Git author matching', () => {
  it('matches a personal Gmail address registered for a student', () => {
    assert.equal(matchGitAuthor('VIETANH.PERSONAL@gmail.com', 'Unknown', members)?.id, 1);
  });

  it('falls back to the registered GitHub username derived from the email prefix', () => {
    assert.equal(matchGitAuthor('nghia-dev@users.noreply.github.com', 'Unknown', members)?.id, 2);
  });
});

describe('40/40/20 contribution scoring', () => {
  it('combines LOC, commits, and PR shares and applies the configured threshold', () => {
    const scores = calculateContributionScores(members, new Map([
      [1, { loc: 80, commits: 8, prs: 2 }],
      [2, { loc: 20, commits: 2, prs: 0 }],
    ]), 20);

    assert.equal(scores[0].pct, 84);
    assert.equal(scores[0].isFreeRiding, false);
    assert.equal(scores[1].pct, 16);
    assert.equal(scores[1].isFreeRiding, true);
  });

  it('returns finite zero scores when the team has no activity', () => {
    const scores = calculateContributionScores(members, new Map(), 5);

    assert.deepEqual(scores.map(({ pct }) => pct), [0, 0]);
    assert.ok(scores.every(({ isFreeRiding }) => isFreeRiding));
  });
});