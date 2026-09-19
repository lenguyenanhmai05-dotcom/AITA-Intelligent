import React, { useState, useEffect } from 'react';
import { AitaLogo } from './AitaLogo';
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  AlertOctagon,
  GitBranch,
  Users,
  Sliders,
  LogOut,
  Play,
  X,
  GraduationCap,
  Box,
  Award,
  Database,
  ChevronRight,
  Sparkles,
  Plus,
  UploadCloud,
  FileCode,
  CheckCircle,
  Trash2,
  FolderGit2
} from 'lucide-react';

import { Language, translations } from '../translations';
import { isAdminEmail } from '../App';
import { LanguageFlagToggle } from './FlagIcons';

export type ActiveTab =
  | 'student_upload'
  | 'dashboard'
  | 'submissions'
  | 'queue'
  | 'dlq'
  | 'git'
  | 'report'
  | 'subsystem1'
  | 'subsystem2'
  | 'subsystem3'
  | 'subsystem4'
  | 'settings';

interface DashboardPortalProps {
  role: 'lecturer' | 'student' | 'admin';
  userEmail: string;
  userFullName?: string;
  lang?: Language;
  onToggleLang?: (newLang: Language) => void;
  onLogout: () => void;
}

export const DashboardPortal: React.FC<DashboardPortalProps> = ({
  role: initialRole,
  userEmail,
  userFullName = 'Lê Nguyễn Anh Mai',
  lang = 'vi',
  onToggleLang,
  onLogout,
}) => {
  const t = translations[lang];
  const isUserAdmin = isAdminEmail(userEmail) || initialRole === 'admin';
  const [currentRole, setCurrentRole] = useState<'lecturer' | 'student' | 'admin'>(() => {
    if (initialRole === 'admin' && !isUserAdmin) return 'student';
    return initialRole;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialRole === 'student' ? 'student_upload' : initialRole === 'lecturer' ? 'submissions' : 'dashboard');

  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState<number | null>(null);
  const [showDlqModal, setShowDlqModal] = useState<number | null>(null);
  const [showPatModal, setShowPatModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState<string | null>(null);
  const [showFlaggedModal, setShowFlaggedModal] = useState(false);

  // Submissions selection state (Lecturer view)
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([1, 3]);

  // Student Upload state
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([
    {
      id: 'SUB-01',
      assignment: 'Assignment 3 — Spring Boot REST Service',
      method: 'Tệp ZIP: lenguyenanhmai05_Assignment3.zip (2.4 MB)',
      submittedAt: '2026-09-19 14:20',
      status: 'completed',
      score: '100 / 100',
      testCases: '10/10 Passed',
    },
    {
      id: 'SUB-02',
      assignment: 'Lab 5 — Sorting Algorithms & Benchmark',
      method: 'GitHub: main @ commit #7a4f91c',
      submittedAt: '2026-09-15 09:40',
      status: 'completed',
      score: '95 / 100',
      testCases: '9/10 Passed',
    },
  ]);

  const [submitAssignmentTitle, setSubmitAssignmentTitle] = useState('Assignment 3 — Spring Boot REST Service');
  const [submitMethod, setSubmitMethod] = useState<'file' | 'git'>('file');
  const [selectedFileName, setSelectedFileName] = useState<string | null>('lenguyenanhmai05_Assignment3_SpringBoot.zip');
  const [gitRepoUrl, setGitRepoUrl] = useState('https://github.com/lenguyenanhmai05/AITA-Intelligent.git');
  const [gitBranch, setGitBranch] = useState('main');
  const [submissionNotes, setSubmissionNotes] = useState('Em đã nộp bài giải Assignment 3 hoàn tất 10 test cases.');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Queue Live Telemetry simulation state (2s auto-refresh per BR-03)
  const [telemetry, setTelemetry] = useState({
    waiting: 12,
    active: 3,
    completed: 28,
    failed: 2,
  });
  const [heartbeat, setHeartbeat] = useState(false);

  // Settings state
  const [workerConcurrency, setWorkerConcurrency] = useState(5);
  const [freeRidingThreshold, setFreeRidingThreshold] = useState(5);

  // Stepper state for Git Analysis
  const [gitStep, setGitStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeartbeat((prev) => !prev);
      setTelemetry((prev) => ({
        ...prev,
        active: Math.floor(Math.random() * 2) + 2,
        completed: prev.completed + (Math.random() > 0.6 ? 1 : 0),
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleRoleSwitch = (newRole: 'lecturer' | 'student' | 'admin') => {
    if (newRole === 'admin' && !isUserAdmin) {
      alert(t.adminOnlyNotice);
      return;
    }
    if (initialRole === 'student' && newRole !== 'student') {
      alert(lang === 'vi' ? 'Sinh viên chỉ có quyền truy cập Cổng Sinh Viên (Nộp bài & Xem điểm).' : 'Students only have access to Student Portal.');
      return;
    }
    setCurrentRole(newRole);
    if (newRole === 'student') {
      setActiveTab('student_upload');
    } else if (newRole === 'lecturer') {
      setActiveTab('submissions');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub = {
      id: `SUB-0${uploadedFiles.length + 1}`,
      assignment: submitAssignmentTitle,
      method: submitMethod === 'file' ? `Tệp ZIP: ${selectedFileName || 'submission_code.zip'}` : `GitHub: ${gitRepoUrl} (${gitBranch})`,
      submittedAt: 'Vừa xong (Hôm nay 15:35)',
      status: 'waiting',
      score: 'Chờ chấm...',
      testCases: 'Đang xếp hàng (BullMQ)',
    };
    setUploadedFiles([newSub, ...uploadedFiles]);
    setSubmitSuccessMsg(`🎉 Nộp bài thành công! Bài làm "${submitAssignmentTitle}" đã được lưu lên MongoDB Atlas và sẵn sàng cho đợt chấm của Giảng viên.`);
    setTimeout(() => setSubmitSuccessMsg(null), 6000);
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setGitStep(1);
    const steps = [
      setTimeout(() => setGitStep(2), 1200),
      setTimeout(() => setGitStep(3), 2400),
      setTimeout(() => setGitStep(4), 3600),
      setTimeout(() => {
        setIsAnalyzing(false);
        setActiveTab('report');
      }, 4800),
    ];
    return () => steps.forEach(clearTimeout);
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'student_upload': return 'Góc Sinh Viên / 📤 Nộp Bài Làm (Upload Assignment Submission)';
      case 'dashboard': return 'Bảng Điều Khiển Trung Tâm / Tổng Quan Điều Hành';
      case 'submissions': return 'Phân Hệ 5 / 1. Danh Sách Bài Nộp Cả Lớp (Tạo Đợt Chấm)';
      case 'queue': return 'Phân Hệ 5 / 2. Giám Sát Hàng Đợi (BullMQ Live 2s)';
      case 'dlq': return 'Phân Hệ 5 / 3. Hàng Đợi Chết (Dead-Letter Queue)';
      case 'git': return 'Phân Hệ 5 / 4. Nộp & Bóc Tách Kho Git Repo';
      case 'report': return 'Phân Hệ 5 / 5. Báo Cáo Đóng Góp & Phát Hiện Free-Rider';
      case 'subsystem1': return 'Phân Hệ 1 / Quản Lý Khóa Học & Lớp Học (Courses & Enrollment)';
      case 'subsystem2': return 'Phân Hệ 2 / Đề Thi & Ngân Hàng Câu Hỏi (Exam Bank)';
      case 'subsystem3': return 'Phân Hệ 3 / Sandbox Chấm Code Tự Động (Docker Isolation)';
      case 'subsystem4': return 'Phân Hệ 4 / Bảng Điểm & Phúc Khảo Bài Làm (Gradebook & Appeals)';
      case 'settings': return 'Cài Đặt Hệ Thống / Tham Số Runtime (BR-07 & BR-12)';
      default: return 'Cổng Thông Tin Đồ Án';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: currentRole === 'admin' ? 'row' : 'column',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      color: 'var(--text-main)',
    }}>
      
      {/* =================================================================== */}
      {/* 1. LEFT ENTERPRISE SIDEBAR (ONLY RENDERED FOR ADMIN)                */}
      {/* =================================================================== */}
      {currentRole === 'admin' && (
        <aside style={{
          width: '280px',
          background: '#FFFFFF',
          borderRight: '1px solid rgba(120, 132, 23, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: '2px 0 16px rgba(0, 0, 0, 0.02)',
        }}>
          {/* Brand Header */}
          <div style={{
            padding: '20px 22px',
            borderBottom: '1px solid rgba(120, 132, 23, 0.10)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AitaLogo size={36} showContainer={true} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.12rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                  {t.appName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: '#FAF2E6',
                  color: 'var(--color-orange-zest)',
                  border: '1px solid var(--color-cantaloupe)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}>
                  {t.groupName}
                </span>
                <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                  {t.appSub}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Navigation */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <div style={{ padding: '0 10px 8px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t.adminNavTitle}
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: activeTab === 'dashboard' ? 'linear-gradient(90deg, #FAF2E6 0%, #FFFDF8 100%)' : 'transparent',
                borderLeft: activeTab === 'dashboard' ? '3.5px solid var(--color-orange-zest)' : '3.5px solid transparent',
                color: activeTab === 'dashboard' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                fontWeight: activeTab === 'dashboard' ? 800 : 500,
                fontSize: '0.83rem',
                textAlign: 'left',
                marginBottom: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <LayoutDashboard size={16} color="var(--color-orange-zest)" />
              <span>{t.navAdminDashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: activeTab === 'settings' ? 'linear-gradient(90deg, #FAF2E6 0%, #FFFDF8 100%)' : 'transparent',
                borderLeft: activeTab === 'settings' ? '3.5px solid var(--color-orange-zest)' : '3.5px solid transparent',
                color: activeTab === 'settings' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                fontWeight: activeTab === 'settings' ? 800 : 500,
                fontSize: '0.83rem',
                textAlign: 'left',
                marginBottom: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Sliders size={16} color="var(--color-orange-zest)" />
              <span>{t.navRuntimeSettings}</span>
            </button>

            <button
              onClick={() => setActiveTab('subsystem3')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: activeTab === 'subsystem3' ? 'linear-gradient(90deg, #FAF2E6 0%, #FFFDF8 100%)' : 'transparent',
                borderLeft: activeTab === 'subsystem3' ? '3.5px solid #0284C7' : '3.5px solid transparent',
                color: activeTab === 'subsystem3' ? '#0284C7' : 'var(--text-body)',
                fontWeight: activeTab === 'subsystem3' ? 800 : 500,
                fontSize: '0.83rem',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Box size={16} color="#0284C7" />
              <span>{t.navDockerSandbox}</span>
            </button>
          </nav>

          {/* Admin Sidebar Footer */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(120, 132, 23, 0.12)',
            background: '#FCFBF7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  boxShadow: '0 2px 8px rgba(217, 100, 31, 0.25)',
                }}>
                  {userFullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {userFullName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {userEmail} • {t.adminRole}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title={t.logout}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E8D6',
                  padding: '7px',
                  borderRadius: '8px',
                  color: 'var(--color-orange-zest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '0.60rem', fontWeight: 700, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #C4DCB5' }}>
                JWT Active ✓
              </span>
              <span style={{ fontSize: '0.60rem', fontWeight: 700, background: '#E0F2FE', color: '#0284C7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                Atlas Cloud ✓
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* =================================================================== */}
      {/* 2. MAIN CONTENT AREA (HEADER + CONTENT)                             */}
      {/* =================================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        
        {/* ================================================================= */}
        {/* TOP HEADER: HORIZONTAL TABS (STUDENT & LECTURER) OR BREADCRUMB (ADMIN) */}
        {/* ================================================================= */}
        {currentRole !== 'admin' ? (
          /* FULL-WIDTH HORIZONTAL NAVBAR FOR STUDENT & LECTURER (NO SIDEBAR) */
          <header style={{
            background: '#FFFFFF',
            borderBottom: '1.5px solid rgba(120, 132, 23, 0.12)',
            padding: '12px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 35,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* Left: Brand Logo + Subtitle + Role Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              <AitaLogo size={36} showContainer={true} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.10rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                    {t.appName}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    background: '#FAF2E6',
                    color: 'var(--color-orange-zest)',
                    border: '1px solid var(--color-cantaloupe)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}>
                    {t.groupName}
                  </span>
                </div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                  {currentRole === 'student' ? (
                    <span style={{ color: 'var(--color-exocarp)', fontWeight: 700 }}>👨‍💻 {t.studentNavTitle}</span>
                  ) : (
                    <span style={{ color: 'var(--color-orange-zest)', fontWeight: 700 }}>🎓 {t.lecturerNavTitle}</span>
                  )} • {t.appSub}
                </div>
              </div>
            </div>

            {/* Center: Horizontal Navigation Tab Pills */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F6F5ED',
              padding: '4px',
              borderRadius: '12px',
              gap: '4px',
              overflowX: 'auto',
            }}>
              {currentRole === 'student' ? (
                <>
                  <button
                    onClick={() => setActiveTab('student_upload')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'student_upload' ? 800 : 600,
                      background: activeTab === 'student_upload' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'student_upload' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'student_upload' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <UploadCloud size={15} />
                    <span>{t.navSubmit}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('git')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'git' ? 800 : 600,
                      background: activeTab === 'git' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'git' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'git' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <FolderGit2 size={15} />
                    <span>{t.navTeamGit}</span>
                    <span style={{ fontSize: '0.62rem', background: 'rgba(170, 176, 38, 0.2)', color: 'var(--color-exocarp)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>38.5%</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('submissions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'submissions' ? 800 : 600,
                      background: activeTab === 'submissions' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'submissions' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'submissions' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Award size={15} />
                    <span>{t.navGrades}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('subsystem1')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'subsystem1' ? 800 : 600,
                      background: activeTab === 'subsystem1' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'subsystem1' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'subsystem1' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <GraduationCap size={15} />
                    <span>{t.navClassroom}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'submissions' ? 800 : 600,
                      background: activeTab === 'submissions' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'submissions' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'submissions' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckSquare size={15} />
                    <span>{t.navClassSubmissions}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('queue')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'queue' ? 800 : 600,
                      background: activeTab === 'queue' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'queue' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'queue' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Activity size={15} />
                    <span>{t.navQueueMonitor}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: heartbeat ? '#10B981' : '#CBD5E1' }} />
                  </button>

                  <button
                    onClick={() => setActiveTab('dlq')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'dlq' ? 800 : 600,
                      background: activeTab === 'dlq' ? '#EF4444' : 'transparent',
                      color: activeTab === 'dlq' ? '#FFFFFF' : '#B91C1C',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'dlq' ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <AlertOctagon size={15} />
                    <span>{t.navDlq}</span>
                    <span style={{ fontSize: '0.62rem', background: '#FEE2E2', color: '#B91C1C', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>1</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('git')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'git' ? 800 : 600,
                      background: activeTab === 'git' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'git' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'git' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <GitBranch size={15} />
                    <span>{t.navGitAnalyzer}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('report')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '9px',
                      fontSize: '0.80rem',
                      fontWeight: activeTab === 'report' ? 800 : 600,
                      background: activeTab === 'report' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'report' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'report' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Users size={15} />
                    <span>{t.navReports}</span>
                  </button>
                </>
              )}
            </nav>

            {/* Right: Language Switcher, Atlas Cloud, Role Switcher, User Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {/* Language Flag Switcher (VN Flag -> UK Flag) */}
              {onToggleLang && (
                <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="navbar" />
              )}

              {/* Atlas Live Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803D',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
                <span>Atlas Cloud</span>
              </div>

              {/* Quick Role Indicator / Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FAF9F1',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #E5E8D6',
              }}>
                {isUserAdmin ? (
                  // Admin can switch to any role
                  (['student', 'lecturer', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '7px',
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        background: currentRole === r ? 'var(--color-orange-zest)' : 'transparent',
                        color: currentRole === r ? '#FFFFFF' : 'var(--text-body)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {r === 'student' ? `👨‍💻 ${t.studentRole}` : r === 'lecturer' ? `🎓 ${t.lecturerRole}` : `⚙️ ${t.adminRole}`}
                    </button>
                  ))
                ) : initialRole === 'lecturer' ? (
                  // Lecturer can view student view or switch back to lecturer console
                  (['student', 'lecturer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '7px',
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        background: currentRole === r ? 'var(--color-orange-zest)' : 'transparent',
                        color: currentRole === r ? '#FFFFFF' : 'var(--text-body)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {r === 'student' ? `👨‍💻 ${t.studentRole}` : `🎓 ${t.lecturerRole}`}
                    </button>
                  ))
                ) : (
                  // Student only sees static role badge - CANNOT switch to lecturer or admin
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    background: 'rgba(170, 176, 38, 0.18)',
                    color: 'var(--color-exocarp)',
                  }}>
                    👨‍💻 {t.studentRole}
                  </div>
                )}
              </div>

              {/* User Profile Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                background: '#FAF9F1',
                border: '1px solid #E5E8D6',
                borderRadius: '999px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                }}>
                  {userFullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()}
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userFullName}
                </span>
                <button
                  onClick={onLogout}
                  title={t.logout}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E8D6',
                    padding: '4px',
                    borderRadius: '6px',
                    color: 'var(--color-orange-zest)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </header>
        ) : (
          /* ADMIN TOP NAVBAR (WITH BREADCRUMB & SIDEBAR LAYOUT) */
          <header style={{
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(120, 132, 23, 0.12)',
            padding: '14px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 8px rgba(0,0,0,0.02)',
          }}>
            {/* Breadcrumb info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>{t.appName}</span>
                <ChevronRight size={12} />
                <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>{getBreadcrumbTitle().split(' / ')[0]}</span>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                {getBreadcrumbTitle().includes(' / ') ? getBreadcrumbTitle().split(' / ')[1] : getBreadcrumbTitle()}
              </h2>
            </div>

            {/* Right Controls: Language, Role Switcher & Database Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Language Flag Switcher (VN Flag -> UK Flag) */}
              {onToggleLang && (
                <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="navbar" />
              )}

              {/* Quick Role Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FAF9F1',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #E5E8D6',
              }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 8px' }}>
                  {t.switchRole}
                </span>
                {(['student', 'lecturer', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '7px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: currentRole === r ? 'var(--color-orange-zest)' : 'transparent',
                      color: currentRole === r ? '#FFFFFF' : 'var(--text-body)',
                      transition: 'all 0.15s ease',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {r === 'student' ? `👨‍💻 ${t.studentRole}` : r === 'lecturer' ? `🎓 ${t.lecturerRole}` : `⚙️ ${t.adminRole}`}
                  </button>
                ))}
              </div>

              {/* Cloud Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#15803D',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 6px #16A34A' }} />
                <span>Atlas Cloud (aita_intelligent)</span>
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Body Content */}
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          
          {/* =============================================================== */}
          {/* TAB: STUDENT UPLOAD & SUBMISSION (GIAO DIỆN NỘP BÀI SINH VIÊN)  */}
          {/* =============================================================== */}
          {activeTab === 'student_upload' && (
            <div>
              {submitSuccessMsg && (
                <div style={{
                  background: '#EDF6E8',
                  border: '1.5px solid #AAB026',
                  borderRadius: '14px',
                  padding: '14px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--color-exocarp)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                }}>
                  <CheckCircle size={22} color="var(--color-exocarp)" />
                  <span>{submitSuccessMsg}</span>
                </div>
              )}

              {/* Top Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #FAF2E6 0%, #FFFFFF 100%)',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid rgba(238, 166, 75, 0.35)',
                marginBottom: '26px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                    {t.portalTitle}
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {t.portalStudentLabel} <strong>{userFullName}</strong> ({userEmail}) • {t.portalClassLabel}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.70rem', fontWeight: 800, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '4px 10px', borderRadius: '6px' }}>
                    {t.portalDeadline}
                  </span>
                </div>
              </div>

              {/* 2-Column Form: Submit Form on Left, History on Right/Bottom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '26px', marginBottom: '32px' }}>
                
                {/* SUBMISSION FORM CARD */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={20} color="var(--color-orange-zest)" />
                    <span>{t.submitNewTitle}</span>
                  </h3>

                  <form onSubmit={handleStudentSubmit}>
                    
                    {/* Select Assignment */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {t.selectAssignmentLabel}
                      </label>
                      <select
                        value={submitAssignmentTitle}
                        onChange={(e) => setSubmitAssignmentTitle(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '6px', fontSize: '0.88rem', fontWeight: 600 }}
                      >
                        <option>Assignment 3 — Spring Boot REST Service</option>
                        <option>Lab 5 — Sorting Algorithms &amp; Benchmark</option>
                        <option>Practical Exam — Java Microservices &amp; Docker</option>
                      </select>
                    </div>

                    {/* Choose Method Tabs: ZIP File or Git Link */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {t.methodLabel}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSubmitMethod('file')}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: submitMethod === 'file' ? '2px solid var(--color-orange-zest)' : '1px solid #E5E8D6',
                            background: submitMethod === 'file' ? '#FAF2E6' : '#FAF9F1',
                            color: submitMethod === 'file' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <FileCode size={18} />
                          <span>{t.methodArchive}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSubmitMethod('git')}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: submitMethod === 'git' ? '2px solid var(--color-orange-zest)' : '1px solid #E5E8D6',
                            background: submitMethod === 'git' ? '#FAF2E6' : '#FAF9F1',
                            color: submitMethod === 'git' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <FolderGit2 size={18} />
                          <span>{t.methodGit}</span>
                        </button>
                      </div>
                    </div>

                    {/* METHOD 1: DRAG & DROP FILE ZONE */}
                    {submitMethod === 'file' && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          border: '2px dashed var(--color-kumquat)',
                          background: '#FAF9F1',
                          borderRadius: '16px',
                          padding: '28px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}>
                          <UploadCloud size={38} color="var(--color-orange-zest)" style={{ margin: '0 auto 10px' }} />
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                            {t.dragDropText}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {t.dragDropFormats}
                          </div>
                        </div>

                        {selectedFileName && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px 16px',
                            background: '#FFFFFF',
                            border: '1px solid #E5E8D6',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FileCode size={20} color="var(--color-orange-zest)" />
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{selectedFileName}</div>
                                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>2.4 MB • Source Code Ready</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFileName(null)}
                              style={{ color: '#EF4444', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* METHOD 2: GITHUB REPO URL */}
                    {submitMethod === 'git' && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            LINK GITHUB REPOSITORY CỦA BẠN*
                          </label>
                          <input
                            type="text"
                            value={gitRepoUrl}
                            onChange={(e) => setGitRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository.git"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>NHÁNH (BRANCH)</label>
                            <input
                              type="text"
                              value={gitBranch}
                              onChange={(e) => setGitBranch(e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>COMMIT SHA (TÙY CHỌN)</label>
                            <input
                              type="text"
                              placeholder="HEAD (Mới nhất)"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submission Notes */}
                    <div style={{ marginBottom: '22px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        {t.notesLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        placeholder={t.notesPlaceholder}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px', fontSize: '0.85rem', resize: 'vertical' }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'var(--color-orange-zest)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: '0 8px 20px -4px rgba(217, 100, 31, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <UploadCloud size={20} />
                      <span>{t.confirmSubmitBtn}</span>
                    </button>
                  </form>
                </div>

                {/* MY SUBMISSION HISTORY TABLE */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                      {t.historyTitle} ({uploadedFiles.length})
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.historySub}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#FAF9F1', borderBottom: '1px solid rgba(120, 132, 23, 0.12)' }}>
                        <tr>
                          <th style={{ padding: '12px 16px' }}>{t.colSubId}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colAssignment}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colMethod}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colTime}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colStatus}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colScore}</th>
                          <th style={{ padding: '12px 16px' }}>{t.colTestCases}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedFiles.map((sub) => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>{sub.id}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700 }}>{sub.assignment}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>{sub.method}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{sub.submittedAt}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '3px 8px', borderRadius: '6px' }}>
                                {t.statusGraded}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-main)' }}>{sub.score}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-exocarp)' }}>{sub.testCases}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 0: MAIN DASHBOARD (EXECUTIVE / ADMIN / LECTURER)            */}
          {/* =============================================================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Welcome Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #FAF2E6 0%, #FFFFFF 100%)',
                borderRadius: '20px',
                padding: '26px 28px',
                border: '1px solid rgba(238, 166, 75, 0.35)',
                marginBottom: '26px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.4rem' }}>👋</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                      Xin chào, {userFullName}!
                    </h1>
                  </div>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', maxWidth: '650px', lineHeight: '1.5' }}>
                    Hệ sinh thái chấm bài tự động &amp; phân tích đóng góp mã nguồn nhóm <strong>AITA-Intelligent</strong> (SWP391 - Nhóm 2).
                    Tất cả dữ liệu đang được đồng bộ thời gian thực trên MongoDB Atlas Cloud.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    LỚP HỌC ĐANG CHỌN
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-orange-zest)', marginTop: '2px' }}>
                    SWP391 - Đồ án phần mềm
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '2px' }}>
                    GVHD: TS. Nguyễn Văn Giảng • Nhóm 2
                  </div>
                </div>
              </div>

              {/* 4 High-level Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>ACTIVE BATCHES</span>
                    <Activity size={17} color="var(--color-kumquat)" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '6px' }}>
                    3
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    Đang chạy song song (Giới hạn tối đa 3 batch theo BR-02)
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>DEAD-LETTER JOBS</span>
                    <AlertOctagon size={17} color="#EF4444" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
                    1
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    Tác vụ crash/timeout quá 3 lần retry đang cách ly (BR-06)
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>GIT MONITORED</span>
                    <GitBranch size={17} color="var(--color-exocarp)" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-exocarp)', marginTop: '6px' }}>
                    1 Kho
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    Kho Git Nhóm 2 với 4 thành viên bóc tách commit
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1px solid rgba(2, 132, 199, 0.20)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>ATLAS USERS SYNCED</span>
                    <Database size={17} color="#0284C7" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284C7', marginTop: '6px' }}>
                    6 Users
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    Đã nạp và phân quyền vào cơ sở dữ liệu đám mây
                  </div>
                </div>
              </div>

              {/* MongoDB Atlas Cloud Live Sync Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '18px',
                padding: '20px 24px',
                marginBottom: '32px',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 10px #10B981',
                    }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.3px', color: '#F8FAFC' }}>
                      MongoDB Atlas Cloud — Live Connected (Cluster0)
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}>
                      Database: aita_intelligent
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                    <span>☁️ <strong>Host:</strong> cluster0.lxovslt.mongodb.net</span>
                    <span>👤 <strong>User:</strong> lenguyenanhmai05_db_user</span>
                    <span>🌐 <strong>Shared Access:</strong> Cho phép cả nhóm dùng chung online</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    users: <strong>6</strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    batches: <strong>3</strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    jobs: <strong>6</strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    contributions: <strong>4</strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    settings: <strong>2</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: SUBMISSIONS LIST (BATCH GRADING / STUDENT GRADEBOOK)     */}
          {/* =============================================================== */}
          {activeTab === 'submissions' && (
            <div>
              {currentRole === 'student' ? (
                /* STUDENT PERSONAL GRADEBOOK & TEST RESULTS */
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      {lang === 'vi' ? 'Bảng Điểm & Kết Quả Chấm Bài Của Bạn' : 'My Grades & Evaluation Reports'}
                    </h1>
                    <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                      {lang === 'vi' 
                        ? 'Xem chi tiết điểm số, số lượng test case vượt qua và đánh giá tương đồng mã nguồn (AST) do hệ thống AITA tự động thực thi.'
                        : 'Review your submission grades, passed test cases, and AST code similarity analyzed by AITA.'}
                    </p>
                  </div>

                  {/* Summary metric cards for student */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐIỂM TRUNG BÌNH</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>9.75 / 10</div>
                      <div style={{ fontSize: '0.70rem', color: 'var(--color-exocarp)', marginTop: '2px', fontWeight: 700 }}>Xuất sắc (Top 5% lớp)</div>
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEST CASES ĐÃ VƯỢT QUA</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>19 / 20 (95%)</div>
                      <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px' }}>Chạy trên Docker Sandbox cách ly</div>
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐỘ TRÙNG LẶP MÃ NGUỒN (AST)</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-exocarp)', marginTop: '4px' }}>2.1%</div>
                      <div style={{ fontSize: '0.70rem', color: '#10B981', marginTop: '2px', fontWeight: 700 }}>✓ An toàn (Ngưỡng &lt; 20%)</div>
                    </div>
                  </div>

                  {/* Student Submissions Detail Table */}
                  <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#FAF9F1', borderBottom: '1px solid rgba(120, 132, 23, 0.12)' }}>
                        <tr>
                          <th style={{ padding: '14px 18px' }}>MÃ BÀI NỘP</th>
                          <th style={{ padding: '14px 18px' }}>BÀI TẬP / LAB</th>
                          <th style={{ padding: '14px 18px' }}>PHƯƠNG THỨC NỘP</th>
                          <th style={{ padding: '14px 18px' }}>THỜI GIAN</th>
                          <th style={{ padding: '14px 18px' }}>ĐIỂM SỐ</th>
                          <th style={{ padding: '14px 18px' }}>TEST CASES</th>
                          <th style={{ padding: '14px 18px' }}>AST DIFF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedFiles.map((sub) => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>{sub.id}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 700 }}>{sub.assignment}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{sub.method}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{sub.submittedAt}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>{sub.score}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: '#10B981' }}>{sub.testCases}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '3px 8px', borderRadius: '6px' }}>
                                2.1% (Original)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* LECTURER & ADMIN CLASS BATCH GRADING VIEW */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                        Danh Sách Bài Nộp Của Cả Lớp (Batch Grading)
                      </h1>
                      <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                        Giảng viên chọn bài nộp của sinh viên để tạo đợt chấm hàng loạt tuân thủ quy tắc BR-01 &amp; BR-02.
                      </p>
                    </div>
                    <button
                      disabled={selectedSubmissions.length === 0}
                      onClick={() => setShowBatchModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        background: selectedSubmissions.length > 0 ? 'var(--color-orange-zest)' : '#D1D5DB',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        boxShadow: selectedSubmissions.length > 0 ? '0 8px 20px -4px rgba(217, 100, 31, 0.35)' : 'none',
                        cursor: selectedSubmissions.length > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Play size={16} fill="#FFFFFF" />
                      <span>Bắt Đầu Chấm Bài ({selectedSubmissions.length} bài)</span>
                    </button>
                  </div>

                  {/* Data Table */}
                  <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#FAF9F1', borderBottom: '1px solid rgba(120, 132, 23, 0.12)' }}>
                        <tr>
                          <th style={{ padding: '14px 18px', width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedSubmissions.length === 4}
                              onChange={(e) => setSelectedSubmissions(e.target.checked ? [1, 2, 3, 4] : [])}
                            />
                          </th>
                          <th style={{ padding: '14px 18px' }}>SINH VIÊN</th>
                          <th style={{ padding: '14px 18px' }}>BÀI NỘP</th>
                          <th style={{ padding: '14px 18px' }}>TRẠNG THÁI CHẤM</th>
                          <th style={{ padding: '14px 18px' }}>THỜI GIAN NỘP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, student: 'Nguyễn Văn A', title: 'Assignment 3 — Spring Boot REST', status: 'not graded', time: '2026-09-10 14:20' },
                          { id: 2, student: 'Lê Văn C', title: 'Assignment 3 — Spring Boot REST', status: 'not graded', time: '2026-09-10 16:45' },
                          { id: 3, student: 'Trần Thị B', title: 'Assignment 3 — Spring Boot REST', status: 'failed', time: '2026-09-09 21:15' },
                          { id: 4, student: 'Phạm Văn D', title: 'Assignment 3 — Spring Boot REST', status: 'completed', time: '2026-09-09 18:00' },
                        ].map((sub) => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <input
                                type="checkbox"
                                checked={selectedSubmissions.includes(sub.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedSubmissions([...selectedSubmissions, sub.id]);
                                  else setSelectedSubmissions(selectedSubmissions.filter((x) => x !== sub.id));
                                }}
                              />
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: 700 }}>{sub.student}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{sub.title}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: sub.status === 'completed' ? '#EDF6E8' : sub.status === 'failed' ? '#FEE2E2' : '#F1F5F9',
                                color: sub.status === 'completed' ? 'var(--color-exocarp)' : sub.status === 'failed' ? '#B91C1C' : 'var(--text-muted)',
                              }}>
                                {sub.status === 'completed' ? 'Đã chấm xong' : sub.status === 'failed' ? 'Thất bại (Cần retry)' : 'Chưa chấm'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{sub.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: QUEUE MONITOR (LIVE 2S)                                   */}
          {/* =============================================================== */}
          {activeTab === 'queue' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Giám Sát Hàng Đợi (BullMQ Live Telemetry)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Tự động cập nhật mỗi 2 giây (`BR-03`). Worker nhặt bài và tính thời gian `runtimeDurationMs`.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: heartbeat ? '#10B981' : '#E2E8F0', transition: 'background 0.3s' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-body)' }}>Live Polling (2s chu kỳ)</span>
                </div>
              </div>

              {/* 4 Telemetry Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>⏳ WAITING</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{telemetry.waiting}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid rgba(238, 166, 75, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-orange-zest)' }}>⚡ ACTIVE (WORKERS)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>{telemetry.active}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-exocarp)' }}>✅ COMPLETED</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-exocarp)', marginTop: '4px' }}>{telemetry.completed}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>❌ FAILED (RETRIES)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>{telemetry.failed}</div>
                </div>
              </div>

              {/* Jobs Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FAF9F1' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>JOB ID</th>
                      <th style={{ padding: '12px 18px' }}>SINH VIÊN</th>
                      <th style={{ padding: '12px 18px' }}>TRẠNG THÁI</th>
                      <th style={{ padding: '12px 18px' }}>RETRY COUNT (BR-04)</th>
                      <th style={{ padding: '12px 18px' }}>THỜI GIAN CHẠY</th>
                      <th style={{ padding: '12px 18px' }}>HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#1042</td>
                      <td style={{ padding: '14px 18px' }}>Nguyễn Văn A</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-orange-zest)', fontWeight: 700 }}>active (đang chấm)</td>
                      <td style={{ padding: '14px 18px' }}>0 / 3</td>
                      <td style={{ padding: '14px 18px' }}>2,410 ms</td>
                      <td style={{ padding: '14px 18px' }}>-</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#1043</td>
                      <td style={{ padding: '14px 18px' }}>Lê Văn C</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>waiting</td>
                      <td style={{ padding: '14px 18px' }}>0 / 3</td>
                      <td style={{ padding: '14px 18px' }}>-</td>
                      <td style={{ padding: '14px 18px' }}>-</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#1041</td>
                      <td style={{ padding: '14px 18px' }}>Trần Thị B</td>
                      <td style={{ padding: '14px 18px', color: '#EF4444', fontWeight: 700 }}>failed (chờ retry lần 3)</td>
                      <td style={{ padding: '14px 18px', color: '#EF4444', fontWeight: 700 }}>2 / 3 ($2^2 = 4s$)</td>
                      <td style={{ padding: '14px 18px' }}>30,124 ms</td>
                      <td style={{ padding: '14px 18px' }}>
                        <button onClick={() => setShowJobDetailsModal(1041)} style={{ color: 'var(--color-orange-zest)', fontWeight: 700 }}>
                          Chi tiết lỗi
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: DEAD-LETTER QUEUE (DLQ)                                  */}
          {/* =============================================================== */}
          {activeTab === 'dlq' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Hàng Đợi Chết (Dead-Letter Queue - DLQ)
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                  Khu vực cách ly các tác vụ chấm bị crash hoặc timeout sau 3 lần retry liên tiếp (`status = 'dead'`).
                </p>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(239, 68, 68, 0.25)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FEF2F2' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>JOB ID</th>
                      <th style={{ padding: '12px 18px' }}>SINH VIÊN</th>
                      <th style={{ padding: '12px 18px' }}>PHÂN LOẠI NGUYÊN NHÂN LỖI</th>
                      <th style={{ padding: '12px 18px' }}>THỜI GIAN CHẠY</th>
                      <th style={{ padding: '12px 18px' }}>HÀNH ĐỘNG (BR-06)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px 18px', fontWeight: 800 }}>#1041</td>
                      <td style={{ padding: '16px 18px' }}>Trần Thị B</td>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          timeout: sandbox execution exceeded 30s
                        </span>
                      </td>
                      <td style={{ padding: '16px 18px' }}>30,124 ms</td>
                      <td style={{ padding: '16px 18px' }}>
                        <button
                          onClick={() => setShowDlqModal(1041)}
                          style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--color-orange-zest)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem' }}
                        >
                          Xử lý / Replay
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: GIT REPO SUBMISSION                                      */}
          {/* =============================================================== */}
          {activeTab === 'git' && (
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div style={{ marginBottom: '22px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Nộp Kho Git Để Phân Tích Nhóm
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                  Hệ thống thực hiện bare clone, bóc tách commit log, lọc commit rác và phát hiện gian lận (`BR-08`, `BR-09`, `BR-10`).
                </p>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '28px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CHỌN NHÓM ĐỒ ÁN*</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px' }}>
                    <option>Nhóm 2 - AITA Intelligent (SWP391)</option>
                    <option>Nhóm 1 - Smart LMS Platform</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>GIT REPOSITORY URL*</label>
                  <input
                    type="text"
                    defaultValue="https://github.com/lenguyenanhmai05/AITA-Intelligent.git"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>NHÁNH PHÂN TÍCH (DEFAULT: MAIN)</label>
                  <input type="text" defaultValue="main" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E8D6', marginTop: '4px' }} />
                </div>

                {isAnalyzing ? (
                  <div style={{ padding: '20px', background: '#FAF9F1', borderRadius: '14px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-orange-zest)', marginBottom: '8px' }}>
                      Đang xử lý phân tích kho Git ngầm... (Bước {gitStep} / 4)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {gitStep === 1 && '1. Đang bare clone repository...'}
                      {gitStep === 2 && '2. Đang bóc tách commit history và git log...'}
                      {gitStep === 3 && '3. Đang lọc sạch noise files, lockfiles, node_modules...'}
                      {gitStep === 4 && '4. Đang tính điểm đóng góp % và xét Free-rider...'}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartAnalysis}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'var(--color-orange-zest)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                    }}
                  >
                    Bắt Đầu Bóc Tách Git Repo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: TEAM CONTRIBUTION & FREE-RIDER REPORT                    */}
          {/* =============================================================== */}
          {activeTab === 'report' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Báo Cáo Đóng Góp Nhóm 2 &amp; Phát Hiện Free-Rider
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Áp dụng thuật toán tính Net LOC sau khi lọc sạch rác, cảnh báo Free-Rider theo BR-11 &amp; BR-12.
                  </p>
                </div>
                <button
                  onClick={() => setShowFlaggedModal(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    color: '#B45309',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  ⚠️ Xem Commit Gian Lận Bị Bắt (BR-10)
                </button>
              </div>

              {/* Contribution Bars */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid rgba(120, 132, 23, 0.15)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px' }}>Biểu Đồ Tỷ Lệ Đóng Góp (%)</h3>
                {[
                  { name: 'Lê Nguyễn Anh Mai', pct: 38.5, color: 'var(--color-orange-zest)' },
                  { name: 'Nguyễn Văn A', pct: 31.0, color: 'var(--color-kumquat)' },
                  { name: 'Lê Văn C', pct: 26.5, color: 'var(--color-exocarp)' },
                  { name: 'Trần Thị B (Free-Rider)', pct: 4.0, color: '#EF4444' },
                ].map((m) => (
                  <div key={m.name} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      <span>{m.name}</span>
                      <span>{m.pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '9px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Contribution Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FAF9F1' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>THÀNH VIÊN</th>
                      <th style={{ padding: '12px 18px' }}>COMMITS SẠCH</th>
                      <th style={{ padding: '12px 18px' }}>PULL REQUESTS</th>
                      <th style={{ padding: '12px 18px' }}>NET LOC</th>
                      <th style={{ padding: '12px 18px' }}>TỶ LỆ %</th>
                      <th style={{ padding: '12px 18px' }}>CẢNH BÁO FREE-RIDER</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Lê Nguyễn Anh Mai</td>
                      <td style={{ padding: '14px 18px' }}>42</td>
                      <td style={{ padding: '14px 18px' }}>14</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>+3,820</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>38.5%</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          NO (Tích cực)
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Nguyễn Văn A</td>
                      <td style={{ padding: '14px 18px' }}>35</td>
                      <td style={{ padding: '14px 18px' }}>12</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>+3,100</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>31.0%</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          NO
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Lê Văn C</td>
                      <td style={{ padding: '14px 18px' }}>28</td>
                      <td style={{ padding: '14px 18px' }}>9</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>+2,650</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>26.5%</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          NO
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#B91C1C' }}>Trần Thị B</td>
                      <td style={{ padding: '14px 18px' }}>3</td>
                      <td style={{ padding: '14px 18px' }}>1</td>
                      <td style={{ padding: '14px 18px', color: '#B91C1C', fontWeight: 700 }}>+120</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#B91C1C' }}>4.0%</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', padding: '3px 8px', borderRadius: '6px' }}>
                          ⚠️ YES - FREE RIDER (&lt; 5%)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 6: SUBSYSTEM 1 TEMPLATE (COURSES & CLASSES)                  */}
          {/* =============================================================== */}
          {activeTab === 'subsystem1' && (
            <div>
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Sparkles size={20} color="#16A34A" />
                <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                  <strong>Khung Mẫu Sẵn Sàng Dành Cho Thành Viên Phụ Trách Phân Hệ 1:</strong> Phân hệ này đã kết nối sẵn với MongoDB Atlas (`ClassModel`, `TeamModel`, `UserModel`).
                  Bạn có thể bổ sung API tạo khóa học, phân nhóm và import sinh viên từ Excel trực tiếp tại đây!
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Phân Hệ 1: Quản Lý Khóa Học &amp; Lớp Học (Courses &amp; Enrollment)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Quản lý danh sách lớp học, phân công giảng viên và danh sách sinh viên theo từng lớp.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '10px 16px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={15} /> Thêm Lớp Mới
                  </button>
                  <button style={{ padding: '10px 16px', borderRadius: '10px', background: '#0284C7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem' }}>
                    📥 Bulk Import Excel (SQL Tx)
                  </button>
                </div>
              </div>

              {/* Class List Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FAF9F1' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>MÃ LỚP</th>
                      <th style={{ padding: '12px 18px' }}>TÊN LỚP MÔN HỌC</th>
                      <th style={{ padding: '12px 18px' }}>GIẢNG VIÊN PHỤ TRÁCH</th>
                      <th style={{ padding: '12px 18px' }}>SỐ LƯỢNG NHÓM</th>
                      <th style={{ padding: '12px 18px' }}>SỐ SINH VIÊN</th>
                      <th style={{ padding: '12px 18px' }}>TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#CL-391</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-orange-zest)' }}>SWP391 - Đồ án phần mềm</td>
                      <td style={{ padding: '14px 18px' }}>TS. Nguyễn Văn Giảng</td>
                      <td style={{ padding: '14px 18px' }}>5 Nhóm</td>
                      <td style={{ padding: '14px 18px' }}>24 Sinh viên</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          Đang diễn ra
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 7: SUBSYSTEM 2 TEMPLATE (EXAM BANK)                          */}
          {/* =============================================================== */}
          {activeTab === 'subsystem2' && (
            <div>
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Sparkles size={20} color="#16A34A" />
                <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                  <strong>Khung Mẫu Sẵn Sàng Dành Cho Thành Viên Phụ Trách Phân Hệ 2:</strong> Nơi tạo đề thi và ma trận test case.
                  Khi bấm "Chấm toàn bộ", danh sách bài sẽ được chuyển thẳng sang Hàng Đợi BullMQ của Phân Hệ 5!
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Phân Hệ 2: Ngân Hàng Đề Thi &amp; Bài Tập (Exam &amp; Question Bank)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Quản lý đề thi Assignment, Lab, cấu hình test cases ẩn và hạn chót nộp bài.
                  </p>
                </div>
                <button style={{ padding: '10px 18px', borderRadius: '10px', background: '#0284C7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem' }}>
                  + Tạo Đề Thi Mới
                </button>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FAF9F1' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>MÃ ĐỀ</th>
                      <th style={{ padding: '12px 18px' }}>TIÊU ĐỀ BÀI TẬP</th>
                      <th style={{ padding: '12px 18px' }}>LOẠI ĐỘ ƯU TIÊN (BR-01)</th>
                      <th style={{ padding: '12px 18px' }}>SỐ TEST CASES</th>
                      <th style={{ padding: '12px 18px' }}>HẠN NỘP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#EX-01</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Assignment 3 — Spring Boot REST Service</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FAF2E6', color: 'var(--color-orange-zest)', padding: '2px 8px', borderRadius: '4px' }}>
                          Assignment (Ưu tiên 50)
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>10 Test cases</td>
                      <td style={{ padding: '14px 18px' }}>2026-09-25 23:59</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 8: SUBSYSTEM 3 TEMPLATE (DOCKER SANDBOX ENGINE)             */}
          {/* =============================================================== */}
          {activeTab === 'subsystem3' && (
            <div>
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Sparkles size={20} color="#16A34A" />
                <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                  <strong>Khung Mẫu Sẵn Sàng Dành Cho Thành Viên Phụ Trách Phân Hệ 3:</strong> Môi trường thực thi code sinh viên an toàn.
                  Thành viên phụ trách sẽ cấu hình Docker Sandbox container, giới hạn tài nguyên và trả về `runtimeDurationMs` cho Phân Hệ 5.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Phân Hệ 3: Sandbox Chấm Code Tự Động (Docker Isolation Engine)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Giám sát các container sandbox cô lập, giới hạn CPU, RAM và chặn truy cập mạng ra ngoài.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SANDBOX CONTAINERS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>5 Running</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>RAM LIMIT / CONTAINER</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>512 MB</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXECUTION TIMEOUT</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16A34A', marginTop: '4px' }}>10.0 Giây</div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 9: SUBSYSTEM 4 TEMPLATE (GRADEBOOK & APPEALS)                */}
          {/* =============================================================== */}
          {activeTab === 'subsystem4' && (
            <div>
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Sparkles size={20} color="#16A34A" />
                <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                  <strong>Khung Mẫu Sẵn Sàng Dành Cho Thành Viên Phụ Trách Phân Hệ 4:</strong> Tổng hợp điểm tự động từ Phân Hệ 5 (Code Score + Git Contribution %)
                  và xử lý đơn phúc khảo của sinh viên.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Phân Hệ 4: Bảng Điểm &amp; Phúc Khảo Bài Làm (Gradebook &amp; Appeals)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Kết hợp điểm chấm test case tự động và điểm đóng góp nhóm Git để ra điểm cuối kỳ.
                  </p>
                </div>
              </div>

              {/* Gradebook Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#FAF9F1' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>SINH VIÊN</th>
                      <th style={{ padding: '12px 18px' }}>ĐIỂM CODE TEST CASE</th>
                      <th style={{ padding: '12px 18px' }}>% ĐÓNG GÓP GIT (PHÂN HỆ 5)</th>
                      <th style={{ padding: '12px 18px' }}>ĐIỂM TỔNG KẾT</th>
                      <th style={{ padding: '12px 18px' }}>KẾT QUẢ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Lê Nguyễn Anh Mai</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>10.0 / 10</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>38.5%</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>9.8</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          Xuất Sắc
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Nguyễn Văn A</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>9.0 / 10</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>31.0%</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>8.9</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#EDF6E8', color: 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          Giỏi
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 10: SYSTEM SETTINGS                                         */}
          {/* =============================================================== */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ marginBottom: '22px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Cài Đặt Hệ Thống (System Settings)
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                  Quản trị viên cấu hình tham số động tại runtime mà không cần khởi động lại máy chủ (BR-07, BR-12).
                  Tất cả thay đổi được lưu trực tiếp vào MongoDB Atlas.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                    Số Lượng Worker Concurrency (BR-07)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Giới hạn số worker BullMQ chạy song song cùng lúc (Phạm vi: 1 đến 10 worker).
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={workerConcurrency}
                      onChange={(e) => setWorkerConcurrency(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--color-orange-zest)' }}
                    />
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-orange-zest)', minWidth: '40px' }}>
                      {workerConcurrency}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                    Ngưỡng Cảnh Báo Free-Rider (BR-12)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Thành viên có tỷ lệ đóng góp dưới ngưỡng này sẽ bị gắn cờ đỏ cảnh báo (Phạm vi: 1% đến 20%).
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={freeRidingThreshold}
                      onChange={(e) => setFreeRidingThreshold(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--color-orange-zest)' }}
                    />
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#B91C1C', minWidth: '40px' }}>
                      {freeRidingThreshold}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =================================================================== */}
      {/* 3. MODALS IMPLEMENTATION                                            */}
      {/* =================================================================== */}

      {/* MODAL 1: BATCH CONFIG MODAL (SRS Page 30) */}
      {showBatchModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '460px', width: '100%', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cấu Hình Đợt Chấm Bài (Batch Config)</h3>
              <button onClick={() => setShowBatchModal(false)}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>TÊN ĐỢT CHẤM*</label>
              <input type="text" defaultValue="Assignment 3 — Spring Boot REST" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #E5E8D6', marginTop: '4px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>MỨC ĐỘ ƯU TIÊN (BR-01)*</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #E5E8D6', marginTop: '4px' }}>
                <option>Exam (Ưu tiên cao nhất - Điểm 100)</option>
                <option>Assignment (Ưu tiên trung bình - Điểm 50)</option>
                <option>Practice (Ưu tiên bình thường - Điểm 10)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '24px' }}>
              Số bài nộp đã chọn: <strong>{selectedSubmissions.length} bài</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowBatchModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#F3F4F6' }}>Hủy</button>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setActiveTab('queue');
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--color-orange-zest)', color: '#FFFFFF', fontWeight: 700 }}
              >
                Gửi vào Hàng Đợi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: JOB DETAILS MODAL (SRS Page 33) */}
      {showJobDetailsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Chi Tiết Tác Vụ #{showJobDetailsModal}</h3>
              <button onClick={() => setShowJobDetailsModal(null)}><X size={20} /></button>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div>Trạng thái: <strong style={{ color: '#EF4444' }}>failed (chờ retry lần 3)</strong></div>
              <div>Thời gian chạy: <strong>30,124 ms</strong></div>
              <div>Số lần retry: <strong>2 / 3 lần</strong> (khoảng chờ $2^2 = 4s$)</div>
              <div style={{ marginTop: '12px', fontWeight: 700 }}>Nguyên nhân lỗi:</div>
              <div style={{ padding: '8px', background: '#FEF2F2', borderRadius: '8px', color: '#B91C1C', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)
              </div>
            </div>
            <button onClick={() => setShowJobDetailsModal(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '10px', background: '#F3F4F6' }}>Đóng</button>
          </div>
        </div>
      )}

      {/* MODAL 3: DLQ MODAL (SRS Page 35) */}
      {showDlqModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '500px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#B91C1C', marginBottom: '16px' }}>Xử Lý Tác Vụ Hàng Đợi Chết #{showDlqModal}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '20px' }}>
              Job đã thử lại hết 3 lần và được cách ly. Giảng viên có thể chọn hủy bỏ vĩnh viễn hoặc nạp lại thủ công vào hàng đợi để chấm lại (BR-06: reset retryCount về 0).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDlqModal(null)} style={{ flex: 1, padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '10px', fontWeight: 700 }}>Bỏ qua (Dismiss)</button>
              <button
                onClick={() => {
                  setShowDlqModal(null);
                  alert('Đã reset retryCount về 0 và đẩy lại vào Redis Priority Queue thành công!');
                }}
                style={{ flex: 1, padding: '12px', background: 'var(--color-orange-zest)', color: '#FFFFFF', borderRadius: '10px', fontWeight: 700 }}
              >
                Replay Vào Hàng Đợi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PAT TOKEN AUTH MODAL (SRS Page 38) */}
      {showPatModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '460px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Nhập GitHub Personal Access Token</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Token cần có quyền <code>repo:read</code> để clone kho mã nguồn riêng tư. Hệ thống sẽ mã hóa bằng chuẩn AES-256 (BR-08) trước khi lưu.
            </p>
            <input type="password" defaultValue="ghp_xxxxxxxxxxxxxxxxxxxx" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #E5E8D6', marginBottom: '20px' }} />
            <button onClick={() => setShowPatModal(false)} style={{ width: '100%', padding: '12px', background: 'var(--color-orange-zest)', color: '#FFFFFF', borderRadius: '10px', fontWeight: 700 }}>Lưu &amp; Xác Thực Mã Hóa</button>
          </div>
        </div>
      )}

      {/* MODAL 5: FLAGGED COMMITS (FRAUD DETECTION BR-10) */}
      {showFlaggedModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '620px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-orange-zest)' }}>Danh Sách Commit Bị Bắt Gian Lận (BR-10)</h3>
              <button onClick={() => setShowFlaggedModal(false)}><X size={20} /></button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ background: '#FAF9F1', textAlign: 'left', fontSize: '0.75rem' }}>
                <tr>
                  <th style={{ padding: '10px' }}>TÁC GIẢ</th>
                  <th style={{ padding: '10px' }}>NGÀY COMMIT</th>
                  <th style={{ padding: '10px' }}>HÀNH VI GIAN LẬN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px' }}>a.nguyen@fpt.edu.vn</td>
                  <td style={{ padding: '10px' }}>2026-09-09</td>
                  <td style={{ padding: '10px', color: '#B91C1C', fontWeight: 700 }}>whitespace-only (chỉ thêm dấu cách để farm LOC)</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>b.tran@fpt.edu.vn</td>
                  <td style={{ padding: '10px' }}>2026-09-08</td>
                  <td style={{ padding: '10px', color: 'var(--color-kumquat)', fontWeight: 700 }}>self-revert (tự xóa commit liền trước của mình)</td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => setShowFlaggedModal(false)} style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '10px', background: '#F3F4F6' }}>Đóng</button>
          </div>
        </div>
      )}

      {/* MODAL 6: MEMBER DETAILS MODAL */}
      {showMemberModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Lịch Sử Đóng Góp: {showMemberModal}</h3>
              <button onClick={() => setShowMemberModal(null)}><X size={20} /></button>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div>Tổng Net LOC: <strong style={{ color: 'var(--color-exocarp)' }}>+1,840 lines</strong></div>
              <div>Tổng Commits sạch: <strong>24 commits</strong></div>
              <div>Pull Requests: <strong>4 PRs</strong></div>
            </div>
            <button onClick={() => setShowMemberModal(null)} style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '10px', background: '#F3F4F6' }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
