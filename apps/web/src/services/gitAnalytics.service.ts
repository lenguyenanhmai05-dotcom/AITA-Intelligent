import { apiClient } from './apiClient';
import { MemberContribution } from '../components/git-analytics/TeamContributionReport';
import { FlaggedCommit } from '../components/git-analytics/FraudDetectionModals';

// Định nghĩa kiểu dữ liệu trả về từ API Backend
interface ReportResponse {
  success: boolean;
  data: {
    members: MemberContribution[];
  };
}

interface FlaggedCommitsResponse {
  success: boolean;
  data: {
    flaggedCommits: FlaggedCommit[];
  };
}

export const gitAnalyticsService = {
  /**
   * UC-13: Lấy báo cáo đóng góp của toàn bộ thành viên trong nhóm
   * @param repoId ID của repository (hoặc mã đồ án)
   */
  getTeamContributions: async (repoId: string): Promise<MemberContribution[]> => {
    const response: any = await apiClient.get(`/git-analytics/${repoId}/contributions`);
    // Vì apiClient interceptor đã tự unwrap trả về response.data, nên kết quả nằm ngay trong response
    return response.data?.members || [];
  },

  /**
   * BR-10: Lấy danh sách các commit bị cắm cờ (Gian lận - Fraud Detection)
   * @param repoId ID của repository
   */
  getFlaggedCommits: async (repoId: string): Promise<FlaggedCommit[]> => {
    const response: any = await apiClient.get(`/git-analytics/${repoId}/flagged-commits`);
    return response.data?.flaggedCommits || [];
  },

  /**
   * UC-06 & UC-07: Submit Repository để bắt đầu phân tích (Cloning -> Parsing -> Scoring)
   * @param url Link GitHub Repository
   * @param branch Nhánh (Branch) cần clone
   */
  submitRepoForAnalysis: async (url: string, branch: string): Promise<{ jobId: string, message: string }> => {
    const response: any = await apiClient.post('/git-analytics/submit', { url, branch });
    return response.data;
  },
  
  /**
   * Lấy trạng thái của Job (Tiến độ của Stepper)
   * @param jobId ID của Background Job (BullMQ)
   */
  getAnalysisStatus: async (jobId: string): Promise<{ step: number, status: string }> => {
    const response: any = await apiClient.get(`/queue/jobs/${jobId}/status`);
    return response.data;
  }
};
