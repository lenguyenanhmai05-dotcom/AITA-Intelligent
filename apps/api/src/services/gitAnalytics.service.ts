import { prisma } from '@aita/database';
import { FREE_RIDING_THRESHOLD_DEFAULT } from '@aita/shared';

export interface GitAnalysisCommit {
  hash: string;
  authorEmail: string;
  authorName: string;
  date: string;
  linesAdded: number;
  linesDeleted: number;
  isSuspicious: boolean;
  suspiciousReason: string | null;
}

export interface GitPullRequestCount {
  authorLogin: string;
  count: number;
}

export interface ScoredTeamMember {
  userId: number;
  name: string;
  email: string;
  loc: number;
  commits: number;
  prs: number;
  pct: number;
  isFreeRiding: boolean;
  thresholdApplied: number;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeIdentity = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export interface GitMemberIdentity {
  id: number;
  fullName: string;
  email: string;
  githubUsername: string | null;
  gitEmails: { gitEmail: string }[];
}

export function matchGitAuthor(
  authorEmail: string,
  authorName: string,
  members: GitMemberIdentity[],
): GitMemberIdentity | undefined {
  const email = normalizeEmail(authorEmail);
  const exactEmailMatch = members.find((member) =>
    member.gitEmails.some((gitEmail) => normalizeEmail(gitEmail.gitEmail) === email),
  );
  if (exactEmailMatch) return exactEmailMatch;

  const emailUsername = normalizeIdentity(email.split('@')[0]);
  const usernameMatch = members.find((member) =>
    member.githubUsername && normalizeIdentity(member.githubUsername) === emailUsername,
  );
  if (usernameMatch) return usernameMatch;

  const normalizedName = normalizeIdentity(authorName);
  return members.find((member) => normalizeIdentity(member.fullName) === normalizedName);
}

export function calculateContributionScores(
  members: GitMemberIdentity[],
  memberStats: Map<number, { loc: number; commits: number; prs: number }>,
  threshold: number,
): ScoredTeamMember[] {
  const totals = [...memberStats.values()].reduce(
    (sum, stats) => ({ loc: sum.loc + stats.loc, commits: sum.commits + stats.commits, prs: sum.prs + stats.prs }),
    { loc: 0, commits: 0, prs: 0 },
  );

  return members.map((member) => {
    const stats = memberStats.get(member.id) ?? { loc: 0, commits: 0, prs: 0 };
    const percentage =
      (totals.loc ? 0.4 * (stats.loc / totals.loc) : 0) +
      (totals.commits ? 0.4 * (stats.commits / totals.commits) : 0) +
      (totals.prs ? 0.2 * (stats.prs / totals.prs) : 0);
    const pct = Number((percentage * 100).toFixed(2));

    return {
      userId: member.id,
      name: member.fullName,
      email: member.email,
      ...stats,
      pct,
      isFreeRiding: pct < threshold,
      thresholdApplied: threshold,
    };
  });
}

export async function persistGitAnalysis(
  repoId: number,
  commits: GitAnalysisCommit[],
  pullRequests: GitPullRequestCount[],
): Promise<ScoredTeamMember[]> {
  const repo = await prisma.gitRepo.findUnique({
    where: { id: repoId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: { include: { gitEmails: true } },
            },
          },
        },
      },
    },
  });

  if (!repo) throw new Error(`Git repository ${repoId} was not found`);

  const members = repo.team.members.map(({ user }) => user);
  const memberStats = new Map<number, { loc: number; commits: number; prs: number }>();
  for (const member of members) {
    memberStats.set(member.id, { loc: 0, commits: 0, prs: 0 });
  }

  const matchedCommits = commits.map((commit) => ({
    commit,
    user: matchGitAuthor(commit.authorEmail, commit.authorName, members),
  }));
  for (const { commit, user } of matchedCommits) {
    if (!user || commit.isSuspicious) continue;
    const stats = memberStats.get(user.id)!;
    stats.loc += Math.max(0, commit.linesAdded);
    stats.commits += 1;
  }

  const membersByUsername = new Map(
    members
      .filter((member) => member.githubUsername)
      .map((member) => [normalizeIdentity(member.githubUsername!), member]),
  );
  for (const pullRequest of pullRequests) {
    const member = membersByUsername.get(normalizeIdentity(pullRequest.authorLogin));
    if (member) memberStats.get(member.id)!.prs += pullRequest.count;
  }

  const thresholdSetting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'free_riding_threshold' },
  });
  const configuredThreshold = Number(thresholdSetting?.settingValue ?? FREE_RIDING_THRESHOLD_DEFAULT);
  const threshold = Number.isFinite(configuredThreshold)
    ? Math.min(20, Math.max(1, configuredThreshold))
    : FREE_RIDING_THRESHOLD_DEFAULT;

  const scoredMembers = calculateContributionScores(members, memberStats, threshold);

  await prisma.$transaction(async (transaction) => {
    await transaction.gitCommit.deleteMany({ where: { repoId } });
    if (matchedCommits.length) {
      await transaction.gitCommit.createMany({
        data: matchedCommits.map(({ commit, user }) => ({
          repoId,
          userId: user?.id ?? null,
          commitHash: commit.hash,
          authorEmail: normalizeEmail(commit.authorEmail),
          authorName: commit.authorName,
          commitDate: new Date(commit.date),
          linesAdded: commit.linesAdded,
          linesDeleted: commit.linesDeleted,
          isSuspicious: commit.isSuspicious,
          suspiciousReason: commit.suspiciousReason,
        })),
      });
    }

    for (const member of scoredMembers) {
      await transaction.memberContribution.upsert({
        where: { repoId_userId: { repoId, userId: member.userId } },
        update: {
          locCount: member.loc,
          commitCount: member.commits,
          prCount: member.prs,
          contributionPercentage: member.pct,
          isFreeRiding: member.isFreeRiding,
          thresholdApplied: member.thresholdApplied,
        },
        create: {
          repoId,
          userId: member.userId,
          locCount: member.loc,
          commitCount: member.commits,
          prCount: member.prs,
          contributionPercentage: member.pct,
          isFreeRiding: member.isFreeRiding,
          thresholdApplied: member.thresholdApplied,
        },
      });
    }

    await transaction.gitRepo.update({
      where: { id: repoId },
      data: { cloneStatus: 'success', analysisStep: 'completed', errorMessage: null },
    });
  });

  return scoredMembers;
}