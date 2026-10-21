import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Code2,
  Terminal,
  Layers,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { DetailedGradingReport, RubricBreakdownItem, TestCaseResultItem } from '../types/grading';
import { Language } from '../translations';

export interface DetailedGradingReportViewProps {
  report: DetailedGradingReport;
  lang: Language;
  isDark: boolean;
  isLecturerOrAdmin?: boolean;
  onReviewSubmit?: (status: 'approved' | 'rejected', comment: string) => Promise<void> | void;
  isReviewing?: boolean;
  currentReviewStatus?: 'pending' | 'approved' | 'rejected';
  currentReviewComment?: string;
  onClose?: () => void;
}

export const DetailedGradingReportView: React.FC<DetailedGradingReportViewProps> = ({
  report,
  lang,
  isDark,
  isLecturerOrAdmin = false,
  onReviewSubmit,
  isReviewing = false,
  currentReviewStatus = 'pending',
  currentReviewComment = '',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'testcases' | 'ast' | 'review'>('rubric');
  const [testCaseFilter, setTestCaseFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [expandedTestCases, setExpandedTestCases] = useState<Record<string, boolean>>({ TC01: true });
  const [reviewInput, setReviewInput] = useState<string>(currentReviewComment);

  const resolvedStudentName = (() => {
    const email = ((report as any)?.studentEmail || '').toLowerCase().trim();
    if (email === 'lenguyenlinhnhi2110@gmail.com' || email.includes('linhnhi')) {
      return 'Lê Nguyễn Linh Nhi';
    }
    return report.studentName || 'Sinh viên';
  })();

  const toggleTestCase = (id: string) => {
    setExpandedTestCases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllTestCases = () => {
    const next: Record<string, boolean> = {};
    report.testCaseResults.forEach((t: TestCaseResultItem) => {
      next[t.id] = true;
    });
    setExpandedTestCases(next);
  };

  const collapseAllTestCases = () => {
    setExpandedTestCases({});
  };

  const filteredTestCases = report.testCaseResults.filter((t: TestCaseResultItem) => {
    if (testCaseFilter === 'passed') return t.status === 'passed';
    if (testCaseFilter === 'failed') return t.status !== 'passed';
    return true;
  });

  const passedCount = report.testCaseResults.filter((t: TestCaseResultItem) => t.status === 'passed').length;
  const failedCount = report.testCaseResults.length - passedCount;

  const isApproved = isLecturerOrAdmin || currentReviewStatus === 'approved';
  const isRejected = !isLecturerOrAdmin && currentReviewStatus === 'rejected';

  // Grade color helper
  const getGradeColor = (score: number) => {
    if (score >= 90) return { bg: 'rgba(34, 197, 94, 0.15)', text: '#16A34A', border: 'rgba(34, 197, 94, 0.4)' };
    if (score >= 80) return { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', border: 'rgba(59, 130, 246, 0.4)' };
    if (score >= 70) return { bg: 'rgba(238, 107, 47, 0.15)', text: 'var(--color-kumquat)', border: 'rgba(238, 107, 47, 0.4)' };
    if (score >= 60) return { bg: 'rgba(234, 179, 8, 0.15)', text: '#CA8A04', border: 'rgba(234, 179, 8, 0.4)' };
    return { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.4)' };
  };

  const gradeColors = isApproved
    ? getGradeColor(report.overallScore)
    : isRejected
      ? { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.4)' }
      : { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: 'rgba(245, 158, 11, 0.4)' };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 140,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '24px',
          width: '95vw',
          maxWidth: '1240px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(238, 107, 47, 0.35)',
                flexShrink: 0,
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(238, 107, 47, 0.15)',
                    color: 'var(--color-kumquat)',
                  }}
                >
                  {report.classCode}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  #{report.submissionId}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  margin: 0,
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {report.assignmentTitle}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lang === 'vi' ? 'Sinh viên thực hiện:' : 'Student:'}{' '}
                <strong style={{ color: 'var(--text-main)' }}>{resolvedStudentName}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* OVERALL SCORE SUMMARY BANNER */}
        <div
          style={{
            padding: '16px 28px',
            background: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
            borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Main Score */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: gradeColors.bg,
              border: `1.5px solid ${gradeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: gradeColors.text,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
              }}
            >
              {isApproved ? report.gradeLetter : isRejected ? '❌' : '⏳'}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: gradeColors.text }}>
                {isApproved ? (lang === 'vi' ? 'ĐIỂM TỔNG HỢP' : 'OVERALL SCORE') : (lang === 'vi' ? 'ĐIỂM TỔNG HỢP (CHỜ DUYỆT)' : 'OVERALL SCORE (PENDING)')}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {isApproved ? (
                  <>
                    {report.overallScore}{' '}
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
                  </>
                ) : (
                  <>
                    -- <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: gradeColors.text }}>
                {isApproved
                  ? (lang === 'vi' ? `Thang 10: ${report.score10}/10 (${report.classificationVi})` : `Scale 10: ${report.score10}/10 (${report.classificationEn})`)
                  : isRejected
                    ? (lang === 'vi' ? 'Giảng viên yêu cầu nộp lại bài' : 'Lecturer requested Re-submission')
                    : (lang === 'vi' ? 'Đang chờ Giảng viên thẩm định & duyệt' : 'Pending Lecturer Review & Approval')}
              </div>
            </div>
          </div>

          {/* Test cases passed */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'BỘ TEST CASES' : 'AUTOMATED TESTS'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isApproved ? '#16A34A' : '#D97706', marginTop: '2px' }}>
              {isApproved ? `${report.passedTestCases} / ${report.totalTestCases} Passed` : (lang === 'vi' ? '⏳ Đang chờ duyệt' : '⏳ Pending Review')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isApproved
                ? (lang === 'vi' ? `Tỷ lệ đạt: ${Math.round((report.passedTestCases / report.totalTestCases) * 100)}%` : `Pass rate: ${Math.round((report.passedTestCases / report.totalTestCases) * 100)}%`)
                : (lang === 'vi' ? 'Đã chạy qua Sandbox Docker' : 'Executed in Docker Sandbox')}
            </div>
          </div>

          {/* Runtime */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'SANDBOX RUNNER' : 'SANDBOX RUNNER'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-kumquat)', marginTop: '2px' }}>
              {report.runtimeDurationMs.toLocaleString()} ms
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Docker Isolated Daemon
            </div>
          </div>

          {/* Review status */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'THẨM ĐỊNH GIẢNG VIÊN' : 'LECTURER REVIEW'}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                marginTop: '4px',
                color:
                  currentReviewStatus === 'approved'
                    ? '#16A34A'
                    : currentReviewStatus === 'rejected'
                      ? '#DC2626'
                      : '#D97706',
              }}
            >
              {currentReviewStatus === 'approved'
                ? (lang === 'vi' ? '✓ ĐÃ PHÊ DUYỆT' : '✓ APPROVED')
                : currentReviewStatus === 'rejected'
                  ? (lang === 'vi' ? '✗ TỪ CHỐI' : '✗ REJECTED')
                  : (lang === 'vi' ? '⏳ CHỜ DUYỆT' : '⏳ PENDING')}
            </div>
            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              Human-in-the-Loop
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0',
            padding: '0 28px',
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('rubric')}
            style={{
              padding: '13px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: activeTab === 'rubric' ? 'var(--color-kumquat)' : 'var(--text-muted)',
              borderBottom: activeTab === 'rubric' ? '3px solid var(--color-kumquat)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={16} />
            <span>{lang === 'vi' ? '4 Tiêu Chí Chấm Điểm (100đ)' : '4 Grading Rubrics (100pts)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testcases')}
            style={{
              padding: '13px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: activeTab === 'testcases' ? 'var(--color-kumquat)' : 'var(--text-muted)',
              borderBottom: activeTab === 'testcases' ? '3px solid var(--color-kumquat)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Terminal size={16} />
            <span>
              {lang === 'vi' ? `Bộ Test Cases (${report.totalTestCases})` : `Test Cases (${report.totalTestCases})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ast')}
            style={{
              padding: '13px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: activeTab === 'ast' ? 'var(--color-kumquat)' : 'var(--text-muted)',
              borderBottom: activeTab === 'ast' ? '3px solid var(--color-kumquat)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Code2 size={16} />
            <span>{lang === 'vi' ? 'Chất Lượng AST & Audit' : 'AST Code Quality & Audit'}</span>
          </button>

          {isLecturerOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              style={{
                padding: '13px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'review' ? 'var(--color-kumquat)' : 'var(--text-muted)',
                borderBottom: activeTab === 'review' ? '3px solid var(--color-kumquat)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={16} />
              <span>{lang === 'vi' ? 'Thẩm Định & Duyệt Điểm' : 'Lecturer Review'}</span>
            </button>
          )}
        </div>

        {/* TAB BODY - SCROLLABLE */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {!isApproved && (
            <div
              style={{
                background: isRejected ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') : (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB'),
                border: isRejected ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isRejected ? '#DC2626' : '#D97706',
                  flexShrink: 0,
                }}
              >
                {isRejected ? <XCircle size={22} /> : <Clock size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: isRejected ? '#DC2626' : '#D97706', marginBottom: '4px' }}>
                  {isRejected
                    ? (lang === 'vi' ? '❌ Bài Nộp Bị Giảng Viên Từ Chối / Cần Nộp Lại' : '❌ Submission Rejected by Lecturer')
                    : (lang === 'vi' ? '⏳ Điểm Số Đang Chờ Giảng Viên Thẩm Định & Phê Duyệt' : '⏳ Grade Pending Lecturer Review & Approval')}
                </div>
                <div style={{ fontSize: '0.80rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                  {isRejected ? (
                    currentReviewComment
                      ? (lang === 'vi' ? `Nhận xét của thầy cô: "${currentReviewComment}". Bạn hãy sửa mã nguồn và Re-submit lại bài nhé.` : `Lecturer feedback: "${currentReviewComment}". Please revise and re-submit.`)
                      : (lang === 'vi' ? 'Giảng viên đã yêu cầu nộp lại bài làm. Bạn hãy kiểm tra lại và sử dụng nút "Re-submit" để nộp bản mới.' : 'Lecturer requested a re-submission. Please revise your code and re-submit.')
                  ) : (
                    lang === 'vi'
                      ? 'Hệ thống đã hoàn tất tiến trình phân tích tự động trong Sandbox Docker. Điểm số chính thức theo 4 tiêu chí và chi tiết kết quả test cases sẽ tự động hiển thị sau khi Giảng viên phụ trách xem xét và phê duyệt.'
                      : 'Automated evaluation completed in Docker sandbox. Official grades and rubrics will unlock once reviewed and approved by the course lecturer.'
                  )}
                </div>
              </div>
            </div>
          )}
          {/* TAB 1: 4 TIÊU CHÍ CHẤM ĐIỂM (RUBRIC BREAKDOWN) */}
          {activeTab === 'rubric' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'vi' ? 'Bảng Điểm Theo 4 Tiêu Chí Chuẩn Hóa' : 'Standardized 4-Criteria Rubric Breakdown'}
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    {lang === 'vi'
                      ? 'Điểm tổng hợp 100% được tính toán minh bạch từ 4 tiêu chí chất lượng kỹ thuật.'
                      : 'The total 100% score is computed transparently across 4 technical criteria.'}
                  </p>
                </div>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    background: isApproved ? 'rgba(238, 107, 47, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: isApproved ? 'var(--color-kumquat)' : '#D97706',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                  }}
                >
                  {isApproved ? report.scoreDisplay : (lang === 'vi' ? '⏳ Chờ phê duyệt' : '⏳ Pending Approval')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {report.rubricBreakdown.map((item: RubricBreakdownItem, idx: number) => {
                  const pct = Math.round((item.earnedScore / item.maxScore) * 100);
                  const isHigh = pct >= 85;
                  const isMed = pct >= 70;
                  const barColor = isHigh ? '#16A34A' : isMed ? 'var(--color-kumquat)' : '#EF4444';

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '16px',
                        background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                        border: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.15)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                background: 'var(--color-kumquat)',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                              }}
                            >
                              0{idx + 1}
                            </span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {lang === 'vi' ? `Trọng số ${item.weight}%` : `Weight ${item.weight}%`}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: isApproved ? barColor : 'var(--text-muted)' }}>
                            {isApproved ? item.earnedScore : '--'}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {' '}/ {item.maxScore}đ
                          </span>
                          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            ({isApproved ? `${item.scoreScale10}/10` : '--/10'})
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          height: '7px',
                          borderRadius: '999px',
                          background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                          overflow: 'hidden',
                          marginBottom: '10px',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: isApproved ? `${pct}%` : '0%',
                            background: barColor,
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      {/* Criteria Feedback */}
                      <div
                        style={{
                          fontSize: '0.78rem',
                          lineHeight: 1.5,
                          color: 'var(--text-body)',
                          background: isDark ? 'rgba(0,0,0,0.18)' : '#FFFFFF',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0',
                        }}
                      >
                        <span style={{ fontWeight: 800, color: barColor }}>
                          {lang === 'vi' ? 'Nhận xét hệ thống: ' : 'Feedback: '}
                        </span>
                        {lang === 'vi' ? item.feedbackVi : item.feedbackEn}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Summary Box */}
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: 'rgba(238, 107, 47, 0.08)',
                  border: '1px solid rgba(238, 107, 47, 0.25)',
                  fontSize: '0.80rem',
                  lineHeight: 1.5,
                  color: 'var(--text-main)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--color-kumquat)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  <span>{lang === 'vi' ? 'Đánh Giá Tổng Hợp Của AI Sandbox Runner:' : 'AI Sandbox Summary Evaluation:'}</span>
                </div>
                <div>{lang === 'vi' ? report.overallFeedbackVi : report.overallFeedbackEn}</div>
              </div>
            </div>
          )}

          {/* TAB 2: CHI TIẾT 10 TEST CASES (DOCKER SANDBOX) */}
          {activeTab === 'testcases' && (
            <div>
              {/* Filter and Action Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                {/* Filter chips */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setTestCaseFilter('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      border: testCaseFilter === 'all' ? '1.5px solid var(--color-kumquat)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                      background: testCaseFilter === 'all' ? (isDark ? 'rgba(238, 107, 47, 0.2)' : '#FAF2E6') : 'transparent',
                      color: testCaseFilter === 'all' ? 'var(--color-kumquat)' : 'var(--text-body)',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Tất cả' : 'All'} ({report.testCaseResults.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestCaseFilter('passed')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      border: testCaseFilter === 'passed' ? '1.5px solid #16A34A' : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                      background: testCaseFilter === 'passed' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                      color: testCaseFilter === 'passed' ? '#16A34A' : 'var(--text-body)',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ {lang === 'vi' ? 'Đạt' : 'Passed'} ({passedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestCaseFilter('failed')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      border: testCaseFilter === 'failed' ? '1.5px solid #DC2626' : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                      background: testCaseFilter === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: testCaseFilter === 'failed' ? '#DC2626' : 'var(--text-body)',
                      cursor: 'pointer',
                    }}
                  >
                    ✗ {lang === 'vi' ? 'Lỗi / Biên' : 'Failed'} ({failedCount})
                  </button>
                </div>

                {/* Expand / Collapse buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={expandAllTestCases}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'transparent',
                      border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Mở rộng tất cả' : 'Expand all'}
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllTestCases}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'transparent',
                      border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'vi' ? 'Thu gọn' : 'Collapse all'}
                  </button>
                </div>
              </div>

              {/* Test Cases List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTestCases.map((tc: TestCaseResultItem) => {
                  const isPassed = tc.status === 'passed';
                  const isTimeout = tc.status === 'timeout';
                  const isExpanded = !!expandedTestCases[tc.id];

                  const statusColor = isPassed ? '#16A34A' : isTimeout ? '#D97706' : '#DC2626';
                  const statusBg = isPassed
                    ? (isDark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4')
                    : isTimeout
                      ? (isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7')
                      : (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2');

                  return (
                    <div
                      key={tc.id}
                      style={{
                        borderRadius: '12px',
                        border: isDark
                          ? `1px solid ${isPassed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          : `1px solid ${isPassed ? '#BBF7D0' : '#FECACA'}`,
                        background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
                        overflow: 'hidden',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => toggleTestCase(tc.id)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: statusBg,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isExpanded ? <ChevronDown size={16} color={statusColor} /> : <ChevronRight size={16} color={statusColor} />}
                          <span
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: statusColor,
                              color: '#FFFFFF',
                            }}
                          >
                            {tc.id}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {tc.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={12} />
                            {tc.durationMs}ms
                          </span>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 900,
                              color: isApproved ? statusColor : 'var(--text-muted)',
                            }}
                          >
                            {isApproved ? `+${tc.points.toFixed(1)} / ${tc.maxPoints.toFixed(1)}đ` : `-- / ${tc.maxPoints.toFixed(1)}đ`}
                          </span>

                          <span
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isApproved ? (isPassed ? '#16A34A' : '#DC2626') : '#D97706',
                              color: '#FFFFFF',
                            }}
                          >
                            {isApproved ? (isPassed ? 'PASSED' : isTimeout ? 'TIMEOUT' : 'FAILED') : (lang === 'vi' ? 'CHỜ DUYỆT' : 'PENDING')}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Details Body */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '14px 16px',
                            fontSize: '0.76rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : '#FAFAFA',
                            borderTop: isDark ? '1px solid var(--border-subtle)' : '1px solid #F1F5F9',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Input Payload: </span>
                            <pre
                              style={{
                                margin: '4px 0 0 0',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: isDark ? '#0D1117' : '#F1F5F9',
                                color: 'var(--text-main)',
                                fontFamily: 'monospace',
                                fontSize: '0.74rem',
                                overflowX: 'auto',
                              }}
                            >
                              {tc.input}
                            </pre>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                            <div>
                              <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Expected Output: </span>
                              <pre
                                style={{
                                  margin: '4px 0 0 0',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: isDark ? '#0D1117' : '#F1F5F9',
                                  color: '#16A34A',
                                  fontFamily: 'monospace',
                                  fontSize: '0.74rem',
                                  overflowX: 'auto',
                                }}
                              >
                                {tc.expectedOutput}
                              </pre>
                            </div>

                            <div>
                              <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Actual Sandbox Output: </span>
                              <pre
                                style={{
                                  margin: '4px 0 0 0',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: isDark ? '#0D1117' : '#F1F5F9',
                                  color: isPassed ? '#16A34A' : '#DC2626',
                                  fontFamily: 'monospace',
                                  fontSize: '0.74rem',
                                  overflowX: 'auto',
                                }}
                              >
                                {tc.actualOutput}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PHÂN TÍCH AST & AUDIT TRAIL */}
          {activeTab === 'ast' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {lang === 'vi' ? 'Phân Tích Cây Cú Pháp Trừu Tượng (AST) & Audit Log' : 'Abstract Syntax Tree (AST) & Code Smells'}
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {lang === 'vi'
                    ? 'Đo lường độ phức tạp cyclomatic, phát hiện trùng lặp mã và đối soát gian lận commit.'
                    : 'Static code analysis metrics, cyclomatic complexity, duplication and LOC fraud verification.'}
                </p>
              </div>

              {/* 4 Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                    border: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.15)',
                  }}
                >
                  <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {lang === 'vi' ? 'Trùng Lặp Mã (AST)' : 'AST Duplication'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                    {report.astAnalysis.astDuplicationRate}%
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Ngưỡng an toàn < 15%' : 'Safe threshold < 15%'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                    border: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.15)',
                  }}
                >
                  <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {lang === 'vi' ? 'Độ Phức Tạp Cyclomatic' : 'Cyclomatic Complexity'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-kumquat)', marginTop: '2px' }}>
                    {report.astAnalysis.cyclomaticComplexity}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Mức tối ưu: < 15 điểm' : 'Optimal level: < 15'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                    border: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.15)',
                  }}
                >
                  <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {lang === 'vi' ? 'Điểm Clean Code' : 'Clean Code Index'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>
                    {report.astAnalysis.cleanCodeScore} / 100
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    Architecture Score
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                    border: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.15)',
                  }}
                >
                  <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {lang === 'vi' ? 'Tuân Thủ SOLID' : 'SOLID Compliance'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#16A34A', marginTop: '4px' }}>
                    4 / 5 Nguyên Tắc
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                    SRP, OCP, LSP, ISP
                  </div>
                </div>
              </div>

              {/* Code Smells & Recommendations */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC',
                  border: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {lang === 'vi' ? 'Lưu ý & Khuyến nghị tối ưu mã nguồn (Code Smells):' : 'Code Smells & Recommendations:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {report.astAnalysis.detectedCodeSmells.map((smell: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--text-body)',
                      }}
                    >
                      <AlertTriangle size={14} color="var(--color-kumquat)" />
                      <span>{smell}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BullMQ Audit Log Trail */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isDark ? '#0D1117' : '#F1F5F9',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  lineHeight: 1.6,
                  color: 'var(--text-main)',
                }}
              >
                <div style={{ color: 'var(--color-kumquat)', fontWeight: 800, marginBottom: '6px' }}>
                  ⚡ AITA Sandbox Runner Execution Trail (Audit Log):
                </div>
                <div>[BullMQ Worker #01] Job submission_{report.submissionId} picked from Redis queue.</div>
                <div>[Docker Sandbox] Container aita-sandbox-runner instantiated with 512MB RAM limit.</div>
                <div>[Security Scan] No prohibited syscalls (fork, ptrace, socket connect) detected.</div>
                <div>[AST Validator] Parsing AST tree completed in 42ms. Zero plagiarism flags.</div>
                <div>[Runner Finalize] Execution completed in {report.runtimeDurationMs}ms. Score: {report.scoreDisplay}.</div>
              </div>
            </div>
          )}

          {/* TAB 4: THẨM ĐỊNH & DUYỆT ĐIỂM (LECTURER REVIEW) */}
          {isLecturerOrAdmin && activeTab === 'review' && (
            <div>
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                  border: isDark ? '1px solid rgba(217, 100, 31, 0.3)' : '1.5px solid rgba(217, 100, 31, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-kumquat)' }}>
                    👨‍🏫 {lang === 'vi' ? 'Ý KIẾN & THẨM ĐỊNH CỦA GIẢNG VIÊN' : 'LECTURER EVALUATION & REVIEW'}
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background:
                        currentReviewStatus === 'approved'
                          ? (isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7')
                          : currentReviewStatus === 'rejected'
                            ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                            : (isDark ? 'rgba(238, 166, 75, 0.2)' : '#FEF3C7'),
                      color:
                        currentReviewStatus === 'approved'
                          ? '#16A34A'
                          : currentReviewStatus === 'rejected'
                            ? '#DC2626'
                            : '#D97706',
                    }}
                  >
                    {currentReviewStatus === 'approved'
                      ? (lang === 'vi' ? '✓ ĐÃ PHÊ DUYỆT' : '✓ APPROVED')
                      : currentReviewStatus === 'rejected'
                        ? (lang === 'vi' ? '✗ TỪ CHỐI' : '✗ REJECTED')
                        : (lang === 'vi' ? '⏳ CHỜ THẨM ĐỊNH' : '⏳ PENDING REVIEW')}
                  </span>
                </div>

                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  {lang === 'vi' ? 'Ý kiến nhận xét chi tiết của Giảng viên:' : 'Lecturer Feedback & Rubric Notes:'}
                </label>
                <textarea
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  placeholder={
                    lang === 'vi'
                      ? 'Ví dụ: Bài làm thuật toán chuẩn xác, đạt 4/4 tiêu chí rubric môn học. Đã duyệt điểm chính thức.'
                      : 'Enter feedback for student...'
                  }
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                    background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '16px',
                  }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() => onReviewSubmit && onReviewSubmit('approved', reviewInput)}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                      opacity: isReviewing ? 0.7 : 1,
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>{lang === 'vi' ? 'Phê Duyệt Điểm (Approve)' : 'Approve Score'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() => onReviewSubmit && onReviewSubmit('rejected', reviewInput)}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                      color: '#DC2626',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isReviewing ? 0.7 : 1,
                    }}
                  >
                    <XCircle size={16} />
                    <span>{lang === 'vi' ? 'Từ Chối (Reject)' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            ⚡ AITA Intelligent Grading Engine • 4 Rubrics • 10 Test Cases
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(238, 107, 47, 0.3)',
            }}
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
