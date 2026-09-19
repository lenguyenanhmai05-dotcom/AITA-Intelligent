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
    const startTime = Date.now();

    // Giả lập thời gian chạy test cases (500ms - 2500ms)
    const simulatedDuration = Math.floor(Math.random() * 1500) + 800;
    await new Promise((resolve) => setTimeout(resolve, simulatedDuration));

    const totalDuration = Date.now() - startTime;

    // Giả lập lỗi timeout hoặc runtime error nếu bài nộp có cờ lỗi
    if (isSimulatedFailure || submissionTitle?.toLowerCase().includes('fail')) {
      return {
        success: false,
        runtimeDurationMs: 30124,
        score: 0,
        testCasesPassed: 0,
        totalTestCases: 10,
        errorClassification: 'timeout: sandbox execution exceeded 30s',
        stackTrace: 'TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)',
      };
    }

    // Kết quả chấm thành công
    return {
      success: true,
      runtimeDurationMs: totalDuration,
      score: 100,
      testCasesPassed: 10,
      totalTestCases: 10,
    };
  }
}
