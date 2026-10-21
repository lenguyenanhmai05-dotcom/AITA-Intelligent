export interface RubricBreakdownItem {
  id: string;
  name: string;
  weight: number; // e.g. 40, 20, 20, 20
  earnedScore: number;
  maxScore: number;
  scoreScale10: number;
  feedbackVi: string;
  feedbackEn: string;
}

export interface TestCaseResultItem {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'timeout';
  durationMs: number;
  points: number;
  maxPoints: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  category: 'functional' | 'boundary' | 'exception' | 'security' | 'performance';
}

export interface AstAnalysisResult {
  astDuplicationRate: number; // e.g. 3.8%
  cyclomaticComplexity: number; // e.g. 13
  cleanCodeScore: number; // e.g. 90
  solidPrinciplesPassed: number; // e.g. 4
  detectedCodeSmells: string[];
}

export interface DetailedGradingReport {
  submissionId: string;
  assignmentTitle: string;
  classCode: string;
  studentName: string;
  overallScore: number; // 0 - 100
  score10: number; // 0 - 10
  scoreDisplay: string; // e.g. "86 / 100"
  gradeLetter: string; // A+, A, B+, B, C, D, F
  classificationVi: string; // Xuất sắc, Giỏi, Khá, Trung bình, Yếu
  classificationEn: string; // Excellent, Good, Fair, Poor
  passedTestCases: number;
  totalTestCases: number;
  runtimeDurationMs: number;
  rubricBreakdown: RubricBreakdownItem[];
  testCaseResults: TestCaseResultItem[];
  astAnalysis: AstAnalysisResult;
  overallFeedbackVi: string;
  overallFeedbackEn: string;
}
