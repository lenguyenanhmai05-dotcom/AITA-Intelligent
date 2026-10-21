/**
 * Mock Execution Dispatcher (SRS Section 2.4 - Item 2)
 * Autonomous simulation engine that executes synthetic grading logic,
 * calculates execution duration, and generates test case results without
 * invoking external sandbox containers.
 */

export interface ExecutionResult {
  success: boolean;
  runtimeDurationMs: number;
  score: number;
  testCasesPassed: number;
  totalTestCases: number;
  errorClassification?: string;
  stackTrace?: string;
}

export class MockDispatcher {
  public static async run(submissionTitle?: string, isSimulatedFailure?: boolean): Promise<ExecutionResult> {
    const isFail = isSimulatedFailure || 
      submissionTitle?.toLowerCase().includes('fail') || 
      submissionTitle?.toLowerCase().includes('error') || 
      submissionTitle?.toLowerCase().includes('lỗi');

    const startTime = Date.now();

    // Giả lập thời gian chạy: nếu là bài lỗi thì chạy 1.5s để retry 3 lần nhanh chóng vào DLQ
    const simulatedDuration = isFail ? 1500 : 8000;
    await new Promise((resolve) => setTimeout(resolve, simulatedDuration));

    const totalDuration = Date.now() - startTime;

    // Giả lập lỗi timeout hoặc runtime error nếu bài nộp có cờ lỗi
    if (isFail) {
      return {
        success: false,
        runtimeDurationMs: 30124,
        score: 0,
        testCasesPassed: 0,
        totalTestCases: 10,
        errorClassification: 'timeout: sandbox execution exceeded 30s',
        stackTrace: 'TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)\n    at SandboxContainer.executeTests (sandbox.ts:88)',
      };
    }

    // Kết quả chấm thực tế theo tiêu chí (Realistic criteria-based score, not 100/100)
    let hash = 0;
    const str = submissionTitle || 'Assignment';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const testCasesPassed = 8 + (seed % 2); // 8 hoặc 9 test cases passed
    const score = 82 + (seed % 13); // 82 - 94 điểm (điểm thực tế theo tiêu chí)

    return {
      success: true,
      runtimeDurationMs: totalDuration,
      score,
      testCasesPassed,
      totalTestCases: 10,
    };
  }
}
