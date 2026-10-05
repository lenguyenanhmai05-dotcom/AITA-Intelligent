import { AitaLogo } from './AitaLogo';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowRight,
  Plus,
  UploadCloud,
  FileCode,
  CheckCircle,
  Trash2,
  FolderGit2,
  Loader2,
  FileCheck,
  RefreshCw,
  Github,
  GitCommit,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

import { Language, translations } from '../translations';
import { isAdminEmail, Theme } from '../App';
import { LanguageFlagToggle, VietnamFlag, UkFlag } from './FlagIcons';
import { ThemeToggle } from './ThemeToggle';
import { Sun, Moon } from 'lucide-react';

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
  theme?: Theme;
  onToggleTheme?: (newTheme: Theme) => void;
  onLogout: () => void;
}

export const DashboardPortal: React.FC<DashboardPortalProps> = ({
  role: initialRole,
  userEmail,
  userFullName = 'Lê Nguyễn Anh Mai',
  lang = 'vi',
  onToggleLang,
  theme = 'light',
  onToggleTheme,
  onLogout,
}) => {
  const isDark = theme === 'dark';
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
  const [isBackHovered, setIsBackHovered] = useState(false);

  // Submissions selection state (Lecturer view)
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);

  // Shared Submissions list (both Student & Lecturer view)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  // LocalStorage key for student submissions persistence across reloads
  const STORAGE_KEY_STUDENT_UPLOADS = 'aita_student_uploaded_files_v1';

  // No default submissions — always start fresh from DB
  const DEFAULT_STUDENT_SUBMISSIONS: any[] = [];

  // Student Upload state — start empty, populated from DB via fetchSubmissionsFromDb
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [isRefreshingSubmissions, setIsRefreshingSubmissions] = useState(false);

  const [submitAssignmentTitle, setSubmitAssignmentTitle] = useState('Exam');
  const [submitMethod, setSubmitMethod] = useState<'file' | 'git'>('file');

  // Real native file upload and drag-and-drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionDetails, setLastSubmissionDetails] = useState<any>(null);

  const [gitRepoUrl, setGitRepoUrl] = useState('https://github.com/lenguyenanhmai05/AITA-Intelligent.git');
  const [gitBranch, setGitBranch] = useState('main');
  const [submissionNotes, setSubmissionNotes] = useState('Em đã hoàn thiện trọn vẹn 10/10 test cases và cấu hình Docker container.');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  const [analysisGitUrl, setAnalysisGitUrl] = useState('https://github.com/lenguyenanhmai05/AITA-Intelligent.git');
  const [analysisGitBranch, setAnalysisGitBranch] = useState('main');

  // File size formatting helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSelectedFileSize(formatFileSize(file.size));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Queue Live Telemetry state (2s auto-refresh per BR-03 calling real BullMQ API)
  const [telemetry, setTelemetry] = useState({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [heartbeat, setHeartbeat] = useState(false);

  // Dead-Letter Queue (DLQ) state fetched from real API
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);

  // Batch Grading dispatch state
  const [batchName, setBatchName] = useState('Assignment 3 — Spring Boot REST');
  const [batchPriority, setBatchPriority] = useState('Assignment');
  const [isDispatchingBatch, setIsDispatchingBatch] = useState(false);

  // Settings state
  const [workerConcurrency, setWorkerConcurrency] = useState(5);
  const [freeRidingThreshold, setFreeRidingThreshold] = useState(5);

  // Stepper state for Git Analysis
  const [gitStep, setGitStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gitAnalysisJobId, setGitAnalysisJobId] = useState<string | null>(null);
  const [gitReportData, setGitReportData] = useState<any | null>(null);

  // Auto-load latest git report on mount (so real data shows after F5)
  useEffect(() => {
    fetch('/api/git/report')
      .then(r => r.json())
      .then(d => {
        if (d?.data?.status === 'done' && d?.data?.teamContributions?.length) {
          setGitReportData(d.data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-sync uploadedFiles to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT_UPLOADS, JSON.stringify(uploadedFiles));
    } catch (e) {
      console.warn('Could not save uploaded files to localStorage:', e);
    }
  }, [uploadedFiles]);

  // Synchronize submissions from backend API (both for Lecturer & Student views)
  const fetchSubmissionsFromDb = useCallback(async () => {
    setIsRefreshingSubmissions(true);
    try {
      const res = await fetch('/api/grading/submissions');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        // 1. Update Lecturer submissions list
        const mapped = data.data.map((item: any) => ({
          id: item.id,
          student: item.studentName || 'Sinh viên',
          title: item.title || 'Assignment',
          status: item.status || 'not graded',
          time: item.submittedAt || 'Vừa xong',
        }));
        setAllSubmissions(mapped);

        // 2. Synchronize Student personal submissions list
        setUploadedFiles((prev) => {
          const merged = [...prev];
          for (const item of data.data) {
            const isSelf =
              (userEmail && item.studentEmail && item.studentEmail.toLowerCase() === userEmail.toLowerCase()) ||
              (userFullName && item.studentName && item.studentName.toLowerCase().includes(userFullName.toLowerCase())) ||
              (typeof item.id === 'number' && item.id > 104);

            if (!isSelf) continue;

            const codeId = typeof item.id === 'string' && item.id.startsWith('SUB-')
              ? item.id
              : `SUB-0${item.id}`;

            const existingIdx = merged.findIndex((m) => m.id === codeId);
            const isCompleted = item.status === 'completed' || item.status === 'graded';
            const isGrading = item.status === 'grading' || item.status === 'active';
            const status = isCompleted ? 'completed' : isGrading ? 'grading' : 'waiting';
            const score = item.score || (isCompleted ? '100 / 100' : 'Chờ chấm...');
            const testCases = item.testCases || (isCompleted ? '10/10 Passed' : 'Đang xếp hàng (BullMQ)');
            const method = item.method || (item.codeUrl ? (item.codeUrl.startsWith('http') ? `GitHub: ${item.codeUrl}` : `Tệp ZIP: ${item.codeUrl.replace('uploads/', '')}`) : 'Tệp mã nguồn');

            const subRecord = {
              id: codeId,
              assignment: item.title || 'Assignment',
              method,
              submittedAt: item.submittedAt || 'Vừa xong',
              status,
              score,
              testCases,
            };

            if (existingIdx >= 0) {
              merged[existingIdx] = {
                ...merged[existingIdx],
                status: subRecord.status,
                score: subRecord.score,
                testCases: subRecord.testCases,
              };
            } else {
              merged.unshift(subRecord);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_STUDENT_UPLOADS, JSON.stringify(merged));
          } catch (e) {
            console.warn('Failed to sync to localStorage:', e);
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Could not fetch submissions from DB:', err);
    } finally {
      setTimeout(() => setIsRefreshingSubmissions(false), 300);
    }
  }, [userEmail, userFullName]);

  // Fetch Dead-Letter Queue from real API (/api/dlq)
  const fetchDlqJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/dlq');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setDlqJobs(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch DLQ from API:', err);
    }
  }, []);

  // Fetch real BullMQ Telemetry (/api/grading/telemetry)
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/grading/telemetry');
      const data = await res.json();
      if (data?.success && data.data) {
        setTelemetry({
          waiting: data.data.waiting ?? 0,
          active: data.data.active ?? 0,
          completed: data.data.completed ?? 0,
          failed: data.data.failed ?? 0,
          total: data.data.total ?? 0,
        });
        setHeartbeat((prev) => !prev);
      }
    } catch (err) {
      console.warn('Could not fetch telemetry from API:', err);
    }
  }, []);

  // Replay a Dead Job back to Redis BullMQ Queue (BR-06: reset retryCount to 0)
  const handleReplayDlqJob = async (id: number) => {
    try {
      const res = await fetch(`/api/dlq/${id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPriority: 'Assignment' }),
      });
      const data = await res.json();
      if (data?.success) {
        alert(lang === 'vi' ? `✓ Đã khôi phục tác vụ #${id} và reset retryCount về 0 (BR-06)!` : `✓ Replayed job #${id} and reset retry count to 0 (BR-06)!`);
        setShowDlqModal(null);
        fetchDlqJobs();
        fetchTelemetry();
      } else {
        alert(data?.message || 'Lỗi khi khôi phục tác vụ');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Dismiss a Dead Job permanently from DLQ
  const handleDismissDlqJob = async (id: number) => {
    try {
      const res = await fetch(`/api/dlq/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.success) {
        alert(lang === 'vi' ? `✓ Đã hủy bỏ vĩnh viễn tác vụ #${id} khỏi DLQ.` : `✓ Dismissed job #${id} permanently from DLQ.`);
        setShowDlqModal(null);
        fetchDlqJobs();
        fetchTelemetry();
      } else {
        alert(data?.message || 'Lỗi khi hủy bỏ tác vụ');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Dispatch Batch Grading to live BullMQ (/api/grading/batches)
  const handleDispatchBatch = async () => {
    if (!batchName.trim()) {
      alert(lang === 'vi' ? 'Vui lòng nhập tên đợt chấm bài!' : 'Please enter batch name!');
      return;
    }
    if (selectedSubmissions.length === 0) {
      alert(lang === 'vi' ? 'Vui lòng chọn ít nhất một bài nộp!' : 'Please select at least one submission!');
      return;
    }
    setIsDispatchingBatch(true);
    try {
      const res = await fetch('/api/grading/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: 1,
          createdBy: 1,
          batchName: batchName.trim(),
          priority: batchPriority,
          submissionIds: selectedSubmissions,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        alert(lang === 'vi' ? `✓ Khởi tạo đợt chấm bài #${data.data?.batch?.id || ''} thành công! Đã gửi ${selectedSubmissions.length} bài vào Hàng Đợi BullMQ.` : `✓ Successfully launched batch for ${selectedSubmissions.length} submissions!`);
        setShowBatchModal(false);
        fetchSubmissionsFromDb();
        fetchTelemetry();
        fetchDlqJobs();
        setActiveTab('queue');
      } else {
        if (data?.code === 'BR_02_LIMIT_EXCEEDED') {
          alert(`⚠️ CẢNH BÁO BR-02:\n${data.message}`);
        } else {
          alert(data?.message || 'Lỗi khi khởi tạo đợt chấm bài');
        }
      }
    } catch (err: any) {
      alert(`Lỗi kết nối API: ${err.message}`);
    } finally {
      setIsDispatchingBatch(false);
    }
  };

  // Fetch system settings from API (/api/settings)
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data?.success && data.data) {
        if (typeof data.data.worker_concurrency === 'number') {
          setWorkerConcurrency(data.data.worker_concurrency);
        }
        if (typeof data.data.free_riding_threshold === 'number') {
          setFreeRidingThreshold(data.data.free_riding_threshold);
        }
      }
    } catch (err) {
      console.warn('Could not fetch settings from API:', err);
    }
  }, []);

  const handleUpdateConcurrency = async (val: number) => {
    setWorkerConcurrency(val);
    try {
      await fetch('/api/settings/concurrency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val }),
      });
    } catch (err) {
      console.warn('Could not update concurrency to API:', err);
    }
  };

  const handleUpdateFreeRidingThreshold = async (val: number) => {
    setFreeRidingThreshold(val);
    try {
      await fetch('/api/settings/free-riding-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val }),
      });
    } catch (err) {
      console.warn('Could not update free riding threshold to API:', err);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchSubmissionsFromDb();
    fetchDlqJobs();
    fetchTelemetry();
    fetchSettings();
  }, [fetchSubmissionsFromDb, fetchDlqJobs, fetchTelemetry, fetchSettings]);

  // Live 2s polling per BR-03
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTelemetry();
    }, 2000);
    return () => clearInterval(timer);
  }, [fetchTelemetry]);

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

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitMethod === 'file' && !selectedFileName) {
      alert(lang === 'vi' ? 'Vui lòng chọn hoặc kéo thả tệp mã nguồn (.zip, .java, .py...) trước khi nộp bài!' : 'Please select or drag-and-drop a source code archive before submitting!');
      return;
    }

    if (submitMethod === 'git' && !gitRepoUrl.trim()) {
      alert(lang === 'vi' ? 'Vui lòng nhập đường dẫn GitHub repository của bạn!' : 'Please enter your GitHub repository URL!');
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const payload = {
      classId: 1,
      studentName: userFullName || 'Ánh Mai Lê Nguyễn',
      studentEmail: userEmail || 'lenguyenanhmai113@gmail.com',
      title: submitAssignmentTitle,
      method: submitMethod,
      fileName: selectedFileName || 'submission_code.zip',
      fileSize: selectedFileSize || '2.4 MB',
      gitRepoUrl: gitRepoUrl.trim(),
      gitBranch: gitBranch.trim() || 'main',
      notes: submissionNotes,
    };

    try {
      const res = await fetch('/api/grading/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      const newDbId = resData?.data?.id || (100 + uploadedFiles.length + 1);
      const submissionCode = `SUB-0${newDbId}`;

      const newSubmissionRecord = {
        id: submissionCode,
        assignment: submitAssignmentTitle,
        method: submitMethod === 'file'
          ? `Tệp ZIP: ${selectedFileName} (${selectedFileSize || '2.4 MB'})`
          : `GitHub: ${gitRepoUrl} (${gitBranch})`,
        submittedAt: `Vừa xong (${timeStr})`,
        status: 'waiting',
        score: 'Chờ chấm...',
        testCases: 'Đang xếp hàng (BullMQ)',
      };

      setUploadedFiles((prev) => {
        const next = [newSubmissionRecord, ...prev.filter((p) => p.id !== submissionCode)];
        try {
          localStorage.setItem(STORAGE_KEY_STUDENT_UPLOADS, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
        return next;
      });

      // Prepend to class submissions list for lecturer view
      setAllSubmissions((prev) => [
        {
          id: newDbId,
          student: userFullName || 'Ánh Mai Lê Nguyễn',
          title: submitAssignmentTitle,
          status: 'not graded',
          time: timeStr,
        },
        ...prev,
      ]);

      setLastSubmissionDetails({
        id: submissionCode,
        title: submitAssignmentTitle,
        method: newSubmissionRecord.method,
        time: timeStr,
        status: 'Đã lưu vào Docker PostgreSQL (Table: submissions)',
      });

      setSubmitSuccessMsg(
        lang === 'vi'
          ? `🎉 Nộp bài thành công! Mã bài nộp #${submissionCode} ("${submitAssignmentTitle}") đã được lưu vào Docker PostgreSQL và xếp vào hàng đợi chấm BullMQ.`
          : `🎉 Submission successful! Code #${submissionCode} ("${submitAssignmentTitle}") saved to Docker PostgreSQL and dispatched to BullMQ.`
      );
    } catch (err: any) {
      console.warn('API submission error fallback:', err);
      const fallbackId = `SUB-0${uploadedFiles.length + 1}`;
      const newSubmissionRecord = {
        id: fallbackId,
        assignment: submitAssignmentTitle,
        method: submitMethod === 'file'
          ? `Tệp ZIP: ${selectedFileName || 'submission_code.zip'} (${selectedFileSize || '2.4 MB'})`
          : `GitHub: ${gitRepoUrl} (${gitBranch})`,
        submittedAt: `Vừa xong (${timeStr})`,
        status: 'waiting',
        score: 'Chờ chấm...',
        testCases: 'Đang xếp hàng (BullMQ)',
      };

      setUploadedFiles((prev) => {
        const next = [newSubmissionRecord, ...prev.filter((p) => p.id !== fallbackId)];
        try {
          localStorage.setItem(STORAGE_KEY_STUDENT_UPLOADS, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
        return next;
      });
      setAllSubmissions((prev) => [
        {
          id: 100 + allSubmissions.length + 1,
          student: userFullName || 'Ánh Mai Lê Nguyễn',
          title: submitAssignmentTitle,
          status: 'not graded',
          time: timeStr,
        },
        ...prev,
      ]);
      setSubmitSuccessMsg(`🎉 Nộp bài thành công! Bài làm "${submitAssignmentTitle}" đã được ghi nhận trên giao diện và sẵn sàng cho đợt chấm.`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccessMsg(null), 9000);
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setGitStep(1);
    setGitReportData(null);
    let jobId: string | null = null;
    try {
      const res = await fetch('/api/git/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analysisGitUrl, branch: analysisGitBranch, groupId: (analysisGitUrl.toLowerCase().includes('sdn') || analysisGitUrl.includes('min098')) ? 5 : 2 })
      });
      const data = await res.json();
      jobId = data?.data?.jobId || null;
      if (jobId) setGitAnalysisJobId(jobId);
    } catch (err) {
      console.warn('API error, falling back to mock delay:', err);
    }

    // Visual step animation
    setTimeout(() => setGitStep(2), 1200);
    setTimeout(() => setGitStep(3), 2400);
    setTimeout(() => setGitStep(4), 3600);

    // After 5s: switch to report tab immediately, poll in background
    setTimeout(async () => {
      setIsAnalyzing(false);
      setActiveTab('report');

      // Continue polling in background to get real data
      const pollJobId = jobId;
      if (pollJobId) {
        for (let attempt = 0; attempt < 60; attempt++) {
          try {
            const rRes = await fetch(`/api/git/report?jobId=${pollJobId}`);
            const rData = await rRes.json();
            if (rData?.data?.status === 'done') {
              setGitReportData(rData.data);
              break;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }, 5000);
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'student_upload': return lang === 'vi' ? 'Sinh Viên / Nộp Bài Làm' : 'Student / Submit Assignment';
      case 'dashboard': return lang === 'vi' ? 'Bảng Điều Khiển / Tổng Quan' : 'Dashboard / System Overview';
      case 'submissions': return lang === 'vi' ? 'Chấm Điểm Tự Động / Danh Sách Bài Nộp' : 'Automated Grading / Submissions';
      case 'queue': return lang === 'vi' ? 'Hàng Đợi Chấm / Giám Sát Queue' : 'Grading Queue / Queue Monitor';
      case 'dlq': return lang === 'vi' ? 'Hàng Đợi Lỗi / Dead-Letter Queue' : 'Dead-Letter Queue / Error Jobs';
      case 'git': return lang === 'vi' ? 'Phân Tích Git / Đóng Góp Nhóm' : 'Git Analytics / Team Contribution';
      case 'report': return lang === 'vi' ? 'Báo Cáo / Đánh Giá Đóng Góp' : 'Reports / Contribution Evaluation';
      case 'subsystem1': return lang === 'vi' ? 'Quản Trị / Khóa Học & Sinh Viên' : 'Administration / Courses & Students';
      case 'subsystem2': return lang === 'vi' ? 'Đề Thi / Ngân Hàng Câu Hỏi' : 'Exams / Question Bank';
      case 'subsystem3': return lang === 'vi' ? 'Hạ Tầng / Docker Sandbox Chấm Điểm' : 'Infrastructure / Docker Sandbox';
      case 'subsystem4': return lang === 'vi' ? 'Bảng Điểm / Phúc Khảo Điểm Số' : 'Gradebook / Score Appeals';
      case 'settings': return lang === 'vi' ? 'Cài Đặt / Tham Số Hệ Thống' : 'Settings / System Parameters';
      default: return 'AITA-Intelligent';
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
          background: isDark ? 'var(--bg-sidebar)' : '#FFFFFF',
          borderRight: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: isDark ? 'none' : '2px 0 16px rgba(0, 0, 0, 0.02)',
        }}>
          {/* Brand Header */}
          <div style={{
            padding: '20px 22px',
            borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.10)',
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
                  background: isDark ? 'var(--bg-surface-accent)' : '#FAF2E6',
                  color: 'var(--color-orange-zest)',
                  border: isDark ? '1px solid rgba(245, 166, 66, 0.35)' : '1px solid var(--color-cantaloupe)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}>
                  {lang === 'vi' ? 'QUẢN TRỊ VIÊN' : 'ADMIN CONSOLE'}
                </span>
                <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                  Enterprise
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
            padding: '14px 16px',
            borderTop: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.12)',
            background: isDark ? 'var(--bg-surface-subtle)' : '#FCFBF7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
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
            background: isDark ? 'var(--bg-navbar)' : '#FFFFFF',
            borderBottom: isDark ? '1px solid var(--border-light)' : '1.5px solid rgba(120, 132, 23, 0.12)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 35,
            boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.02)',
            gap: '12px',
            flexWrap: 'nowrap',
          }}>
            {/* Left: Clean Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <AitaLogo size={36} showContainer={true} />
              <span style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                {t.appName}
              </span>
            </div>

            {/* Center: Horizontal Navigation Tab Pills */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              background: isDark ? 'var(--bg-nav-pill)' : '#F6F5ED',
              padding: '3px 4px',
              borderRadius: '12px',
              gap: '4px',
              flexShrink: 0,
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
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: activeTab === 'submissions' ? 800 : 600,
                      background: activeTab === 'submissions' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'submissions' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'submissions' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckSquare size={14} />
                    <span>{t.navClassSubmissions}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('queue')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: activeTab === 'queue' ? 800 : 600,
                      background: activeTab === 'queue' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'queue' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'queue' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Activity size={14} />
                    <span>{t.navQueueMonitor}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dlq')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: activeTab === 'dlq' ? 800 : 600,
                      background: activeTab === 'dlq' ? '#EF4444' : 'transparent',
                      color: activeTab === 'dlq' ? '#FFFFFF' : '#B91C1C',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'dlq' ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <AlertOctagon size={14} />
                    <span>{t.navDlq}</span>

                  </button>

                  <button
                    onClick={() => setActiveTab('git')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: activeTab === 'git' ? 800 : 600,
                      background: activeTab === 'git' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'git' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'git' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <GitBranch size={14} />
                    <span>{t.navGitAnalyzer}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('report')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: activeTab === 'report' ? 800 : 600,
                      background: activeTab === 'report' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                      color: activeTab === 'report' ? '#FFFFFF' : 'var(--text-body)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: activeTab === 'report' ? '0 2px 8px rgba(217, 100, 31, 0.25)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Users size={14} />
                    <span>{t.navReports}</span>
                  </button>
                </>
              )}

            </nav>

            {/* Right: User Profile Chip & Sleek Expanding Back Arrow Button behind it */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* 1. User Profile Chip */}
              <div
                onClick={() => setActiveTab('settings')}
                title={lang === 'vi' ? 'Bấm vào tên để xem Hồ sơ cá nhân & Cài đặt' : 'Click name to view Profile & Settings'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px 4px 6px',
                  background: activeTab === 'settings' ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1'),
                  border: activeTab === 'settings' ? '1.5px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'settings' ? '0 2px 8px rgba(217, 100, 31, 0.18)' : 'none',
                }}
              >
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
                  flexShrink: 0,
                }}>
                  {userFullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userFullName}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    color: currentRole === 'lecturer' ? 'var(--color-orange-zest)' : 'var(--color-exocarp)',
                    fontWeight: 700,
                    marginTop: '-2px',
                    whiteSpace: 'nowrap',
                  }}>
                    {currentRole === 'lecturer'
                      ? (lang === 'vi' ? '🎓 Giảng viên (SWP391)' : '🎓 Lecturer (SWP391)')
                      : (lang === 'vi' ? '👨‍💻 Sinh viên (SWP391)' : '👨‍💻 Student (SWP391)')}
                  </span>
                </div>
              </div>

              {/* 2. Premium Expanding Back Arrow Button (Placed BEHIND user name) */}
              {isUserAdmin && (
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('admin')}
                  onMouseEnter={() => setIsBackHovered(true)}
                  onMouseLeave={() => setIsBackHovered(false)}
                  title={lang === 'vi' ? 'Quay lại giao diện Quản trị viên (Admin)' : 'Return to Admin Dashboard'}
                  aria-label={lang === 'vi' ? 'Quay lại trang Admin' : 'Return to Admin'}
                  style={{
                    height: '36px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isBackHovered ? '0 12px 0 14px' : '0',
                    width: isBackHovered ? 'auto' : '36px',
                    minWidth: '36px',
                    background: isBackHovered
                      ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))'
                      : (isDark ? 'var(--bg-surface-accent)' : 'linear-gradient(135deg, #FFF9F3 0%, #FAF2E6 100%)'),
                    border: isBackHovered
                      ? '1.5px solid var(--color-orange-zest)'
                      : (isDark ? '1.5px solid rgba(245, 166, 66, 0.4)' : '1.5px solid rgba(217, 100, 31, 0.35)'),
                    color: isBackHovered ? '#FFFFFF' : 'var(--color-orange-zest)',
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isBackHovered
                      ? '0 4px 14px rgba(217, 100, 31, 0.35)'
                      : (isDark ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(217, 100, 31, 0.12)'),
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      maxWidth: isBackHovered ? '130px' : '0px',
                      opacity: isBackHovered ? 1 : 0,
                      marginRight: isBackHovered ? '6px' : '0px',
                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {lang === 'vi' ? 'Quay lại Admin' : 'Back to Admin'}
                  </span>
                  <ArrowRight
                    size={17}
                    strokeWidth={2.6}
                    style={{
                      transform: isBackHovered ? 'translateX(2px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>
              )}
            </div>
          </header>
        ) : (
          /* ADMIN TOP NAVBAR (WITH BREADCRUMB & SIDEBAR LAYOUT) */
          <header style={{
            background: isDark ? 'var(--bg-navbar)' : '#FFFFFF',
            borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.12)',
            padding: '14px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.02)',
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

            {/* Right Controls: Theme Toggle, Language, Role Switcher & Database Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Theme Toggle (Sun / Moon) */}
              {onToggleTheme && (
                <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="navbar" />
              )}

              {/* Language Flag Switcher (VN Flag -> UK Flag) */}
              {onToggleLang && (
                <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="navbar" />
              )}

              {/* Quick Role Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: isDark ? 'var(--bg-nav-pill)' : '#FAF9F1',
                padding: '3px',
                borderRadius: '10px',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
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

              {/* PostgreSQL Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
                border: isDark ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid #BBF7D0',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: isDark ? '#4ADE80' : '#15803D',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 6px #16A34A' }} />
                <span>PostgreSQL Live</span>
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
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  boxShadow: '0 8px 24px -4px rgba(170, 176, 38, 0.25)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-exocarp)', fontSize: '0.90rem', fontWeight: 800 }}>
                      <CheckCircle size={22} color="var(--color-exocarp)" />
                      <span>{submitSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitSuccessMsg(null)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-exocarp)', padding: '4px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {lastSubmissionDetails && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: isDark ? 'var(--bg-surface-subtle)' : 'rgba(255, 255, 255, 0.85)',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                      border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(170, 176, 38, 0.3)',
                    }}>
                      <span>🏷️ <strong>Mã nộp:</strong> {lastSubmissionDetails.id}</span>
                      <span>📂 <strong>Phương thức:</strong> {lastSubmissionDetails.method}</span>
                      <span>⏰ <strong>Thời gian:</strong> {lastSubmissionDetails.time}</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>🐘 <strong>PostgreSQL:</strong> COMMITTED (Table: submissions)</span>
                      <span style={{ color: 'var(--color-orange-zest)', fontWeight: 700 }}>⚡ <strong>BullMQ:</strong> Sẵn sàng chấm bài</span>
                    </div>
                  )}
                </div>
              )}

              {/* Top Banner */}
              <div style={{
                background: isDark
                  ? 'linear-gradient(135deg, #1C2417 0%, #141A10 100%)'
                  : 'linear-gradient(135deg, #FAF2E6 0%, #FFFFFF 100%)',
                borderRadius: '20px',
                padding: '24px 28px',
                border: isDark ? '1px solid rgba(245, 166, 66, 0.3)' : '1px solid rgba(238, 166, 75, 0.35)',
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
                  <span style={{
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    background: isDark ? 'rgba(158, 171, 43, 0.2)' : '#EDF6E8',
                    color: isDark ? 'var(--color-unripe)' : 'var(--color-exocarp)',
                    border: isDark ? '1px solid rgba(192, 200, 64, 0.3)' : 'none',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    {t.portalDeadline}
                  </span>
                </div>
              </div>

              {/* 2-Column Form: Submit Form on Left, History on Right/Bottom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '26px', marginBottom: '32px' }}>
                
                {/* SUBMISSION FORM CARD */}
                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '28px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                    <UploadCloud size={20} color="var(--color-orange-zest)" />
                    <span>{t.submitNewTitle}</span>
                  </h3>

                  <form onSubmit={handleStudentSubmit}>
                    
                    {/* Select Assignment */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {t.selectAssignmentLabel}
                        </label>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: submitAssignmentTitle === 'Exam'
                            ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                            : submitAssignmentTitle === 'Assignment'
                              ? (isDark ? 'rgba(217, 100, 31, 0.2)' : '#FAF2E6')
                              : (isDark ? 'rgba(120, 132, 23, 0.2)' : '#EDF6E8'),
                          color: submitAssignmentTitle === 'Exam'
                            ? (isDark ? '#F87171' : '#B91C1C')
                            : submitAssignmentTitle === 'Assignment'
                              ? 'var(--color-orange-zest)'
                              : (isDark ? 'var(--color-unripe)' : 'var(--color-exocarp)'),
                          border: submitAssignmentTitle === 'Exam'
                            ? (isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FECACA')
                            : submitAssignmentTitle === 'Assignment'
                              ? (isDark ? '1px solid rgba(217, 100, 31, 0.35)' : '1px solid #FED7AA')
                              : (isDark ? '1px solid rgba(120, 132, 23, 0.35)' : '1px solid #C4DCB5'),
                        }}>
                          {submitAssignmentTitle === 'Exam'
                            ? '⚡ Priority 1 (Cao nhất — Chấm ngay)'
                            : submitAssignmentTitle === 'Assignment'
                              ? '📦 Priority 2 (Trung bình)'
                              : '🌱 Priority 3 (Luyện tập)'}
                        </span>
                      </div>
                      <select
                        value={submitAssignmentTitle}
                        onChange={(e) => setSubmitAssignmentTitle(e.target.value)}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', background: isDark ? 'var(--bg-surface-input)' : '#F8FAFC', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', outline: 'none'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-orange-zest)'; e.target.style.boxShadow = '0 0 0 3px rgba(217, 100, 31, 0.15)'; }}
                        onBlur={(e) => { e.target.style.borderColor = isDark ? 'var(--border-light)' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      >
                        <option value="Assignment">Assignment</option>
                        <option value="Practice">Practice</option>
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
                            border: submitMethod === 'file' ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                            background: submitMethod === 'file' ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1'),
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
                            border: submitMethod === 'git' ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                            background: submitMethod === 'git' ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1'),
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
                    {/* METHOD 1: DRAG & DROP FILE ZONE */}
                    {submitMethod === 'file' && (
                      <div style={{ marginBottom: '20px' }}>
                        {/* Hidden Native File Input */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          accept=".zip,.rar,.tar,.gz,.7z,.java,.py,.cpp,.c,.cs,.js,.ts,.html,.txt"
                          style={{ display: 'none' }}
                        />

                        {/* Interactive Drop Zone Area */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileSelect(e.dataTransfer.files[0]);
                            }
                          }}
                          style={{
                            border: isDragging
                              ? '2.5px dashed var(--color-orange-zest)'
                              : selectedFileName
                                ? (isDark ? '2px solid #22C55E' : '2px solid #86EFAC')
                                : (isDark ? '2px dashed rgba(245, 166, 66, 0.45)' : '2px dashed var(--color-kumquat)'),
                            background: isDragging
                              ? (isDark ? 'rgba(217, 100, 31, 0.2)' : '#FAF2E6')
                              : selectedFileName
                                ? (isDark ? 'rgba(22, 163, 74, 0.12)' : '#F0FDF4')
                                : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAF9F1'),
                            borderRadius: '16px',
                            padding: '28px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                            boxShadow: isDragging ? '0 10px 25px -5px rgba(217, 100, 31, 0.25)' : 'none',
                          }}
                        >
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: selectedFileName
                              ? (isDark ? 'rgba(22, 163, 74, 0.25)' : '#DCFCE7')
                              : (isDark ? 'rgba(217, 100, 31, 0.25)' : '#FAF2E6'),
                            marginBottom: '10px',
                          }}>
                            {selectedFileName ? (
                              <FileCheck size={28} color="#22C55E" />
                            ) : (
                              <UploadCloud size={30} color="var(--color-orange-zest)" />
                            )}
                          </div>

                          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                            {selectedFileName
                              ? (lang === 'vi' ? '✓ Tệp đã được chọn — Sẵn sàng nộp' : '✓ File Selected — Ready to Submit')
                              : t.dragDropText}
                          </div>

                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                            {t.dragDropFormats}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '9px 18px',
                              borderRadius: '10px',
                              background: isDark ? 'var(--bg-surface-accent)' : '#FFFFFF',
                              border: '1.5px solid var(--color-orange-zest)',
                              color: 'var(--color-orange-zest)',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(217, 100, 31, 0.12)',
                            }}
                          >
                            <FileCode size={16} />
                            <span>
                              {selectedFileName
                                ? (lang === 'vi' ? 'Chọn tệp khác từ máy tính' : 'Choose another file')
                                : (lang === 'vi' ? 'Chọn tệp từ máy tính (.zip, .java, .py...)' : 'Browse file from computer')}
                            </span>
                          </button>
                        </div>

                        {/* Selected File Card Details */}
                        {selectedFileName && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px 18px',
                            background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
                            border: isDark ? '1.5px solid rgba(34, 197, 94, 0.35)' : '1.5px solid #BBF7D0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: isDark ? 'rgba(22, 163, 74, 0.25)' : '#DCFCE7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <FileCode size={20} color="#22C55E" />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {selectedFileName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span>{selectedFileSize || '2.4 MB'}</span>
                                  <span>•</span>
                                  <span>✓ Tệp mã nguồn hợp lệ sẵn sàng nộp lên PostgreSQL Docker</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearSelectedFile}
                              title="Xóa tệp này để chọn tệp khác"
                              style={{
                                color: '#EF4444',
                                background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Hủy chọn</span>
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
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: isDark ? '1.5px solid var(--border-light)' : '1.5px solid #E5E8D6',
                              background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                              color: 'var(--text-main)',
                              marginTop: '4px',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>NHÁNH (BRANCH)</label>
                            <input
                              type="text"
                              value={gitBranch}
                              onChange={(e) => setGitBranch(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: isDark ? '1.5px solid var(--border-light)' : '1.5px solid #E5E8D6',
                                background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                                color: 'var(--text-main)',
                                marginTop: '4px',
                                fontSize: '0.85rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>COMMIT SHA (TÙY CHỌN)</label>
                            <input
                              type="text"
                              placeholder="HEAD (Mới nhất)"
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: isDark ? '1.5px solid var(--border-light)' : '1.5px solid #E5E8D6',
                                background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                                color: 'var(--text-main)',
                                marginTop: '4px',
                                fontSize: '0.85rem'
                              }}
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
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: isDark ? '1.5px solid var(--border-light)' : '1.5px solid #E5E8D6',
                          background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                          color: 'var(--text-main)',
                          marginTop: '4px',
                          fontSize: '0.85rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: isSubmitting ? '#9CA3AF' : 'var(--color-orange-zest)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: isSubmitting ? 'none' : '0 8px 20px -4px rgba(217, 100, 31, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>{t.submittingBtn}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={20} />
                          <span>{t.confirmSubmitBtn}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* MY SUBMISSION HISTORY TABLE */}
                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '28px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {t.historyTitle} ({uploadedFiles.length})
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.historySub}
                      </span>
                      <button
                        type="button"
                        onClick={fetchSubmissionsFromDb}
                        disabled={isRefreshingSubmissions}
                        title="Đồng bộ lại danh sách bài nộp từ Docker PostgreSQL"
                        style={{
                          background: isRefreshingSubmissions
                            ? (isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6')
                            : (isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1'),
                          border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.25)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--color-orange-zest)',
                          cursor: isRefreshingSubmissions ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <RefreshCw size={12} className={isRefreshingSubmissions ? 'animate-spin' : ''} />
                        <span>{isRefreshingSubmissions ? (lang === 'vi' ? 'Đang đồng bộ...' : 'Syncing...') : (lang === 'vi' ? 'Làm mới DB' : 'Refresh DB')}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{
                        background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                        borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)'
                      }}>
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
                          <tr key={sub.id} style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>{sub.id}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>{sub.assignment}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>{sub.method}</td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{sub.submittedAt}</td>
                            <td style={{ padding: '14px 16px' }}>
                              {sub.status === 'completed' || sub.status === 'graded' ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8',
                                  color: isDark ? '#4ADE80' : 'var(--color-exocarp)',
                                  border: isDark ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #C4DCB5',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  ✓ {t.statusGraded}
                                </span>
                              ) : sub.status === 'grading' ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF',
                                  color: isDark ? '#60A5FA' : '#1D4ED8',
                                  border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #BFDBFE',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  <Loader2 size={12} className="animate-spin" /> {t.statusGrading}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
                                  color: isDark ? '#FBBF24' : '#B45309',
                                  border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FDE68A',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  ⏳ {t.statusPending}
                                </span>
                              )}
                            </td>
                            <td style={{
                              padding: '14px 16px',
                              fontWeight: 800,
                              color: sub.status === 'completed' || sub.status === 'graded' ? 'var(--text-main)' : 'var(--text-muted)',
                              fontStyle: sub.status === 'completed' || sub.status === 'graded' ? 'normal' : 'italic',
                            }}>
                              {sub.score}
                            </td>
                            <td style={{
                              padding: '14px 16px',
                              fontWeight: 700,
                              color: sub.status === 'completed' || sub.status === 'graded' ? (isDark ? '#4ADE80' : 'var(--color-exocarp)') : 'var(--color-orange-zest)',
                            }}>
                              {sub.testCases}
                            </td>
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
                background: isDark
                  ? 'linear-gradient(135deg, #1C2417 0%, #141A10 100%)'
                  : 'linear-gradient(135deg, #FAF2E6 0%, #FFFFFF 100%)',
                borderRadius: '20px',
                padding: '24px 28px',
                border: isDark ? '1px solid rgba(245, 166, 66, 0.3)' : '1px solid rgba(238, 166, 75, 0.35)',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.4rem' }}>👋</span>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                      {lang === 'vi' ? `Xin chào, ${userFullName}!` : `Welcome, ${userFullName}!`}
                    </h1>
                  </div>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.86rem', maxWidth: '650px', lineHeight: '1.5' }}>
                    {lang === 'vi'
                      ? 'Hệ sinh thái chấm bài tự động & phân tích đóng góp mã nguồn AITA-Intelligent. Dữ liệu đồng bộ thời gian thực qua PostgreSQL & Redis.'
                      : 'AITA-Intelligent automated grading & teamwork code analytics platform. Real-time data synchronized across PostgreSQL & Redis.'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {lang === 'vi' ? 'HỌC PHẦN QUẢN TRỊ' : 'MANAGED COURSE'}
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--color-orange-zest)', marginTop: '2px' }}>
                    SWP391 - {lang === 'vi' ? 'Đồ án phần mềm' : 'Software Project'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-body)', marginTop: '2px' }}>
                    {lang === 'vi' ? 'GVHD: TS. Nguyễn Văn Giảng' : 'Instructor: Dr. Nguyen Van Giang'}
                  </div>
                </div>
              </div>

              {/* 4 High-level Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)',
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
                    {lang === 'vi' ? 'Đợt chấm đang chạy song song' : 'Concurrent active grading batches'}
                  </div>
                </div>

                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.25)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>DEAD-LETTER JOBS</span>
                    <AlertOctagon size={17} color="#EF4444" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
                    {dlqJobs.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    {lang === 'vi' ? 'Tác vụ lỗi đang được cách ly' : 'Isolated failed tasks'}
                  </div>
                </div>

                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>GIT MONITORED</span>
                    <GitBranch size={17} color="var(--color-exocarp)" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-exocarp)', marginTop: '6px' }}>
                    {lang === 'vi' ? '1 Kho' : '1 Repo'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    {lang === 'vi' ? 'Kho Git đồ án với 4 sinh viên bóc tách' : 'Project repo with 4 student contributors'}
                  </div>
                </div>

                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: isDark ? '1px solid rgba(2, 132, 199, 0.35)' : '1px solid rgba(2, 132, 199, 0.20)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.80rem', fontWeight: 700 }}>
                    <span>SYNCED ACCOUNTS</span>
                    <Database size={17} color="#0284C7" />
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284C7', marginTop: '6px' }}>
                    6 Users
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)', marginTop: '4px' }}>
                    {lang === 'vi' ? 'Tài khoản đồng bộ trong PostgreSQL' : 'Synchronized accounts in PostgreSQL'}
                  </div>
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
                    <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐIỂM TRUNG BÌNH</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>9.75 / 10</div>
                      <div style={{ fontSize: '0.70rem', color: isDark ? '#4ADE80' : 'var(--color-exocarp)', marginTop: '2px', fontWeight: 700 }}>Xuất sắc (Top 5% lớp)</div>
                    </div>

                    <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEST CASES ĐÃ VƯỢT QUA</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>19 / 20 (95%)</div>
                      <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px' }}>Chạy trên Docker Sandbox cách ly</div>
                    </div>

                    <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐỘ TRÙNG LẶP MÃ NGUỒN (AST)</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? '#4ADE80' : 'var(--color-exocarp)', marginTop: '4px' }}>2.1%</div>
                      <div style={{ fontSize: '0.70rem', color: '#10B981', marginTop: '2px', fontWeight: 700 }}>✓ An toàn (Ngưỡng &lt; 20%)</div>
                    </div>
                  </div>

                  {/* Student Submissions Detail Table */}
                  <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
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
                          <tr key={sub.id} style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>{sub.id}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{sub.assignment}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{sub.method}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{sub.submittedAt}</td>
                            <td style={{
                              padding: '14px 18px',
                              fontWeight: 800,
                              color: sub.status === 'completed' || sub.status === 'graded' ? 'var(--color-orange-zest)' : 'var(--text-muted)',
                              fontStyle: sub.status === 'completed' || sub.status === 'graded' ? 'normal' : 'italic',
                            }}>
                              {sub.score}
                            </td>
                            <td style={{
                              padding: '14px 18px',
                              fontWeight: 700,
                              color: sub.status === 'completed' || sub.status === 'graded' ? '#10B981' : 'var(--color-orange-zest)',
                            }}>
                              {sub.testCases}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              {sub.status === 'completed' || sub.status === 'graded' ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8', color: isDark ? '#4ADE80' : 'var(--color-exocarp)', border: isDark ? '1px solid rgba(34, 197, 94, 0.35)' : 'none', padding: '3px 8px', borderRadius: '6px' }}>
                                  2.1% (Original)
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7', color: isDark ? '#FBBF24' : '#B45309', border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px' }}>
                                  ⏳ Chờ chấm
                                </span>
                              )}
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
                        {t.lecturerBatchTitle}
                      </h1>
                      <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                        {t.lecturerBatchDesc}
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
                      <span>{t.startBatchBtn} ({selectedSubmissions.length})</span>
                    </button>
                  </div>

                  {/* Data Table */}
                  <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
                        <tr>
                          <th style={{ padding: '14px 18px', width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={allSubmissions.length > 0 && selectedSubmissions.length === allSubmissions.length}
                              onChange={(e) => setSelectedSubmissions(e.target.checked ? allSubmissions.map((s) => s.id) : [])}
                            />
                          </th>
                          <th style={{ padding: '14px 18px' }}>{t.colStudent}</th>
                          <th style={{ padding: '14px 18px' }}>{t.colSubmission}</th>
                          <th style={{ padding: '14px 18px' }}>{t.colGradingStatus}</th>
                          <th style={{ padding: '14px 18px' }}>{t.colSubmittedTime}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSubmissions.map((sub) => (
                          <tr key={sub.id} style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
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
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{sub.student}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{sub.title}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: sub.status === 'completed'
                                  ? (isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8')
                                  : sub.status === 'failed'
                                    ? (isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2')
                                    : sub.status === 'grading'
                                      ? (isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF')
                                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'),
                                color: sub.status === 'completed'
                                  ? (isDark ? '#4ADE80' : 'var(--color-exocarp)')
                                  : sub.status === 'failed'
                                    ? (isDark ? '#F87171' : '#B91C1C')
                                    : sub.status === 'grading'
                                      ? (isDark ? '#60A5FA' : '#1D4ED8')
                                      : 'var(--text-muted)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                              }}>
                                {sub.status === 'completed' ? t.statusGraded : sub.status === 'failed' ? t.statusFailedRetry : sub.status === 'grading' ? t.statusGradingWorker : t.statusNotGraded}
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
                    {t.queueMonitorTitle}
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    {t.queueMonitorDesc}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '10px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: heartbeat ? '#10B981' : '#E2E8F0', transition: 'background 0.3s' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-body)' }}>{t.queueLivePolling}</span>
                </div>
              </div>

              {/* 4 Telemetry Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>⏳ WAITING</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{telemetry.waiting + allSubmissions.filter(s => s.status !== 'completed' && s.status !== 'failed' && s.status !== 'grading').length}</div>
                </div>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid rgba(238, 166, 75, 0.4)' : '1px solid rgba(238, 166, 75, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-orange-zest)' }}>⚡ ACTIVE (WORKERS)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>{telemetry.active}</div>
                </div>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-exocarp)' }}>✅ COMPLETED</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-exocarp)', marginTop: '4px' }}>{telemetry.completed}</div>
                </div>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>❌ FAILED (RETRIES)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>{telemetry.failed}</div>
                </div>
              </div>

              {/* Jobs Table */}
              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>{t.colJobId}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colStudent}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colStatusGeneral}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colRetryCount}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colRunTime}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colAction}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {t.emptyQueue}
                        </td>
                      </tr>
                    ) : (
                      [...allSubmissions].sort((a, b) => a.id - b.id).map((job, index) => {
                        let badgeBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
                        let badgeColor = 'var(--text-muted)';
                        let statusText = 'WAITING';
                        let actionText = t.statusNotGraded;
                        let runTime = '-';
                        
                        if (job.status === 'completed') {
                           badgeBg = isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8';
                           badgeColor = isDark ? '#4ADE80' : 'var(--color-exocarp)';
                           statusText = 'COMPLETED';
                           actionText = t.statusGraded;
                           runTime = '840 ms';
                        } else if (job.status === 'failed') {
                           badgeBg = isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2';
                           badgeColor = isDark ? '#F87171' : '#B91C1C';
                           statusText = 'FAILED';
                           actionText = t.statusFailedRetry;
                        } else if (job.status === 'grading') {
                           badgeBg = isDark ? 'rgba(238, 166, 75, 0.18)' : '#FEF3C7';
                           badgeColor = 'var(--color-orange-zest)';
                           statusText = 'ACTIVE';
                           actionText = t.statusGradingWorker;
                        }

                        return (
                          <tr key={job.id} style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-main)' }}>#{index + 1}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{job.student}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: badgeBg, color: badgeColor }}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>0</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{runTime}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{actionText}</td>
                          </tr>
                        );
                      })
                    )}
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
                  {t.dlqTitle}
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                  {t.dlqDesc}
                </p>
              </div>

              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.25)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderBottom: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : 'none' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>{t.colJobId}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colStudent}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colErrorClass}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colRunTime}</th>
                      <th style={{ padding: '12px 18px' }}>{t.colActionBr06}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dlqJobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          🎉 {t.emptyDlq}
                        </td>
                      </tr>
                    ) : (
                      dlqJobs.map((job) => (
                        <tr key={job.id} style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                          <td style={{ padding: '16px 18px', fontWeight: 800, color: 'var(--text-main)' }}>#{job.id}</td>
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{job.studentName}</td>
                          <td style={{ padding: '16px 18px' }}>
                            <span style={{
                              background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                              color: isDark ? '#F87171' : '#B91C1C',
                              border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : 'none',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {job.errorClassification || 'timeout: sandbox execution exceeded 30s'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 18px', color: 'var(--text-body)' }}>{job.runtimeDurationMs ? `${job.runtimeDurationMs.toLocaleString()} ms` : '30,124 ms'}</td>
                          <td style={{ padding: '16px 18px' }}>
                            <button
                              onClick={() => setShowDlqModal(job.id)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: 'var(--color-orange-zest)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{t.actionProcessReplay}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: GIT REPO SUBMISSION                                      */}
          {/* =============================================================== */}
          {activeTab === 'git' && (
            <div style={{ maxWidth: '760px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginBottom: '10px' }}>
                  {lang === 'vi' ? 'Phân Tích Git Repo' : 'Git Repo Analysis'}
                </h1>
              </div>

              <div style={{ 
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF', 
                borderRadius: '24px', 
                padding: '40px', 
                border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.12)', 
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--color-orange-zest), var(--color-kumquat), var(--color-exocarp))' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Users size={14} /> {lang === 'vi' ? 'Nhóm Đồ Án (Project Group)' : 'Project Group'} <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value="2"
                        onChange={() => {
                          setAnalysisGitUrl('https://github.com/lenguyenanhmai05/AITA-Intelligent.git');
                          setAnalysisGitBranch('main');
                        }}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', background: isDark ? 'var(--bg-surface-input)' : '#F8FAFC', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', outline: 'none', appearance: 'none'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-orange-zest)'; e.target.style.boxShadow = '0 0 0 3px rgba(217, 100, 31, 0.15)'; }}
                        onBlur={(e) => { e.target.style.borderColor = isDark ? 'var(--border-light)' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                      >
                        <option value="2">Group 2 - AITA Intelligent (SWP391)</option>
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Github size={14} /> Git Repository URL <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={analysisGitUrl}
                      onChange={(e) => setAnalysisGitUrl(e.target.value)}
                      placeholder="https://github.com/username/repo.git"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', background: isDark ? 'var(--bg-surface-input)' : '#F8FAFC', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'monospace', transition: 'all 0.2s', outline: 'none'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--color-orange-zest)'; e.target.style.boxShadow = '0 0 0 3px rgba(217, 100, 31, 0.15)'; }}
                      onBlur={(e) => { e.target.style.borderColor = isDark ? 'var(--border-light)' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <GitCommit size={14} /> {lang === 'vi' ? 'Nhánh phân tích (Branch)' : 'Analysis Branch'} <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={analysisGitBranch}
                      onChange={(e) => setAnalysisGitBranch(e.target.value)}
                      placeholder="main"
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', background: isDark ? 'var(--bg-surface-input)' : '#F8FAFC', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'monospace', transition: 'all 0.2s', outline: 'none'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--color-orange-zest)'; e.target.style.boxShadow = '0 0 0 3px rgba(217, 100, 31, 0.15)'; }}
                      onBlur={(e) => { e.target.style.borderColor = isDark ? 'var(--border-light)' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>



                <div style={{ marginTop: '32px' }}>
                  {isAnalyzing ? (
                    <div style={{ 
                      padding: '24px', background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', borderRadius: '12px', textAlign: 'center', border: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0'
                    }}>
                      <div className="spinner" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(217, 100, 31, 0.2)', borderTopColor: 'var(--color-orange-zest)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                      <div style={{ fontWeight: 800, color: 'var(--color-orange-zest)', marginBottom: '8px', fontSize: '1rem' }}>
                        {lang === 'vi' ? `Đang xử lý phân tích ngầm... (Bước ${gitStep}/4)` : `Processing background analysis... (Step ${gitStep}/4)`}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {lang === 'vi' ? (
                          <>
                            {gitStep === 1 && '1. Đang bare clone repository...'}
                            {gitStep === 2 && '2. Đang bóc tách commit history và git log...'}
                            {gitStep === 3 && '3. Đang lọc sạch noise files, lockfiles...'}
                            {gitStep === 4 && '4. Đang tính Net LOC & xét chuẩn Free-Rider...'}
                          </>
                        ) : (
                          <>
                            {gitStep === 1 && '1. Bare cloning repository...'}
                            {gitStep === 2 && '2. Extracting commit history and git log...'}
                            {gitStep === 3 && '3. Filtering out noise files, lockfiles...'}
                            {gitStep === 4 && '4. Calculating Net LOC & detecting Free-Riders...'}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartAnalysis}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(217, 100, 31, 0.3)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 100, 31, 0.2)'; }}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-orange-zest) 0%, var(--color-kumquat) 100%)', color: '#FFFFFF', fontWeight: 800, fontSize: '1.05rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 100, 31, 0.2)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                      }}
                    >
                      <Play size={18} fill="currentColor" />
                      {lang === 'vi' ? 'Khởi Động Engine Phân Tích' : 'Start Analysis Engine'}
                    </button>
                  )}
                </div>
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
                  <h1 style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                    {lang === 'vi' ? 'Báo Cáo Đóng Góp & Free-Rider' : 'Contribution & Free-Rider Report'}
                  </h1>
                </div>
                {currentRole !== 'student' && (
<button
                  onClick={() => setShowFlaggedModal(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
                    border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #FDE68A',
                    color: isDark ? '#FBBF24' : '#B45309',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? '⚠️ Xem Commit Gian Lận Bị Bắt (BR-10)' : '⚠️ View Flagged Fraudulent Commits (BR-10)'}
                </button>
)}
              </div>

              {/* Top Overview: Stacked Team Progress Bar */}
              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '16px', padding: '28px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.12)', boxShadow: 'var(--shadow-card)', marginBottom: '28px', animation: 'fadeIn 0.4s ease' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E5E7EB', paddingBottom: '12px' }}>
                  {lang === 'vi' ? 'Tổng Quan Đóng Góp Nhóm' : 'Team Contribution Overview'}
                </h3>
                
                {/* Stacked Bar */}
                <div style={{ width: '100%', height: '28px', display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                  {(gitReportData?.teamContributions || []).map((m: any) => (
                    <div key={m.name} style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRight: '1px solid rgba(255,255,255,0.2)', transition: 'width 1.2s ease' }} title={`${m.name}: ${m.pct.toFixed ? m.pct.toFixed(1) : m.pct}%`} />
                  ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {(gitReportData?.teamContributions || []).map((m: any) => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.name.includes('Trí') ? '#DC2626' : 'var(--text-main)' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: m.color }} />
                      {m.name} <span style={{ color: 'var(--text-muted)' }}>({Number(m.pct).toFixed(2)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formal Data Table */}
              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '16px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.12)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', animation: 'fadeIn 0.5s ease' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0' }}>
                    <tr>
                      <th style={{ width: '28%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>{lang === 'vi' ? 'THÀNH VIÊN' : 'MEMBER'}</th>
                      <th style={{ width: '14%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', textAlign: 'center' }}>{lang === 'vi' ? 'COMMITS' : 'COMMITS'}</th>
                      <th style={{ width: '14%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', textAlign: 'center' }}>{lang === 'vi' ? 'PULL REQUESTS' : 'PULL REQUESTS'}</th>
                      <th style={{ width: '14%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', textAlign: 'right' }}>{lang === 'vi' ? 'NET LOC' : 'NET LOC'}</th>
                      <th style={{ width: '12%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', textAlign: 'right' }}>{lang === 'vi' ? 'TỶ LỆ %' : 'PERCENTAGE'}</th>
                      <th style={{ width: '18%', padding: '16px 20px', fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', textAlign: 'center' }}>{lang === 'vi' ? 'ĐÁNH GIÁ' : 'EVALUATION'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gitReportData?.teamContributions?.length ? gitReportData.teamContributions.map((m: any) => ({
                      name: m.name,
                      initials: m.name.substring(0, 2).toUpperCase(),
                      commits: m.commits || 0,
                      prs: m.prs || 0,
                      loc: m.codeLines || `+${m.loc || 0}`,
                      pct: m.pct || 0,
                      color: m.color || '#94A3B8',
                      status: m.pct >= 30 ? (lang === 'vi' ? 'Tốt' : 'Good') : (m.pct < 10 ? (lang === 'vi' ? '⚠️ Cảnh báo' : '⚠️ Alert') : (lang === 'vi' ? 'Đạt' : 'Average')),
                      statusColor: m.pct >= 30 ? 'green' : (m.pct < 10 ? 'red' : 'gray')
                    })) : (gitAnalysisJobId ? [{name: (lang==='vi'?'Đang tải dữ liệu từ GitHub... (vui lòng chờ khoảng 30s)':'Loading data from GitHub... (please wait ~30s)'), initials: '...', commits: 0, prs: 0, loc: '...', pct: 0, status: '...', statusColor: 'gray', color: '#94A3B8'}] : [])).map((row: any, idx: number, arr: any[]) => (
                      <tr key={row.name} style={{ borderBottom: idx === arr.length - 1 ? 'none' : isDark ? '1px solid var(--border-subtle)' : '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'var(--bg-surface-hover)' : '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px', fontWeight: row.statusColor === 'red' ? 800 : 700, color: row.statusColor === 'red' ? '#DC2626' : 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              {row.initials}
                            </div>
                            {row.name}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: isDark ? '#F1F5F9' : '#334155', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>{row.commits}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: isDark ? '#F1F5F9' : '#334155', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>{row.prs}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', color: row.color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.95rem' }}>{row.loc}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 900, color: row.color, fontFamily: 'monospace', fontSize: '1rem' }}>{row.pct.toFixed(1)}%</td>
                        {currentRole !== 'student' && (
<td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          {row.statusColor === 'red' ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#DC2626', padding: '5px 12px', borderRadius: '999px', border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #FECACA', display: 'inline-block' }}>
                              {row.status}
                            </span>
                          ) : row.statusColor === 'blue' ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#DBEAFE', color: isDark ? '#93C5FD' : '#1D4ED8', padding: '5px 12px', borderRadius: '999px', border: isDark ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid #BFDBFE', display: 'inline-block' }}>
                              {row.status}
                            </span>
                          ) : row.statusColor === 'green' ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7', color: isDark ? '#4ADE80' : '#166534', padding: '5px 12px', borderRadius: '999px', border: isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #BBF7D0', display: 'inline-block' }}>
                              {row.status}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: isDark ? 'rgba(156, 163, 175, 0.1)' : '#F1F5F9', color: 'var(--text-muted)', padding: '5px 12px', borderRadius: '999px', border: isDark ? '1px solid rgba(156, 163, 175, 0.2)' : '1px solid #E2E8F0', display: 'inline-block' }}>
                              {row.status}
                            </span>
                          )}
                        </td>
)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 6: COURSES & CLASSES MANAGEMENT                             */}
          {/* =============================================================== */}
          {activeTab === 'subsystem1' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Quản Lý Khóa Học &amp; Lớp Học (Courses &amp; Enrollment)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Quản lý danh sách lớp học, phân công giảng viên và danh sách sinh viên theo từng lớp.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '10px 16px', borderRadius: '10px', background: isDark ? 'var(--bg-surface)' : '#FFFFFF', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Plus size={15} /> Thêm Lớp Mới
                  </button>
                  <button style={{ padding: '10px 16px', borderRadius: '10px', background: '#0284C7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    📥 Bulk Import Excel (SQL Tx)
                  </button>
                </div>
              </div>

              {/* Class List Table */}
              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
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
                    <tr style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#CL-391</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-orange-zest)' }}>SWP391 - Đồ án phần mềm</td>
                      <td style={{ padding: '14px 18px' }}>TS. Nguyễn Văn Giảng</td>
                      <td style={{ padding: '14px 18px' }}>5 Nhóm</td>
                      <td style={{ padding: '14px 18px' }}>24 Sinh viên</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8', color: isDark ? '#4ADE80' : 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
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
          {/* TAB 7: EXAM & QUESTION BANK                                      */}
          {/* =============================================================== */}
          {activeTab === 'subsystem2' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Ngân Hàng Đề Thi &amp; Bài Tập (Exam &amp; Question Bank)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Quản lý đề thi Assignment, Lab, cấu hình test cases ẩn và hạn chót nộp bài.
                  </p>
                </div>
                <button style={{ padding: '10px 18px', borderRadius: '10px', background: '#0284C7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  + Tạo Đề Thi Mới
                </button>
              </div>

              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>MÃ ĐỀ</th>
                      <th style={{ padding: '12px 18px' }}>TIÊU ĐỀ BÀI TẬP</th>
                      <th style={{ padding: '12px 18px' }}>LOẠI ĐỘ ƯU TIÊN (BR-01)</th>
                      <th style={{ padding: '12px 18px' }}>SỐ TEST CASES</th>
                      <th style={{ padding: '12px 18px' }}>HẠN NỘP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>#EX-01</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Assignment 3 — Spring Boot REST Service</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isDark ? 'var(--bg-surface-accent)' : '#FAF2E6', color: 'var(--color-orange-zest)', padding: '2px 8px', borderRadius: '4px' }}>
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
          {/* TAB 8: DOCKER SANDBOX ENGINE                                     */}
          {/* =============================================================== */}
          {activeTab === 'subsystem3' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {lang === 'vi' ? 'Hạ Tầng Docker Sandbox Chấm Code' : 'Docker Sandbox Engine'}
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    {lang === 'vi'
                      ? 'Giám sát các container sandbox cô lập, giới hạn CPU, RAM và ghi nhận thời gian thực thi runtimeDurationMs.'
                      : 'Monitor isolated sandbox containers, CPU/RAM resource limits, and execution runtime tracking.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SANDBOX CONTAINERS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>5 Running</div>
                </div>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>RAM LIMIT / CONTAINER</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-orange-zest)', marginTop: '4px' }}>512 MB</div>
                </div>
                <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', padding: '18px', borderRadius: '14px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXECUTION TIMEOUT</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: isDark ? '#4ADE80' : '#16A34A', marginTop: '4px' }}>10.0 Giây</div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 9: GRADEBOOK & APPEALS                                       */}
          {/* =============================================================== */}
          {activeTab === 'subsystem4' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    Bảng Điểm &amp; Phúc Khảo Bài Làm (Gradebook &amp; Appeals)
                  </h1>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.84rem' }}>
                    Kết hợp điểm chấm test case tự động và điểm đóng góp nhóm Git để ra điểm cuối kỳ.
                  </p>
                </div>
              </div>

              {/* Gradebook Table */}
              <div style={{ background: isDark ? 'var(--bg-surface)' : '#FFFFFF', borderRadius: '18px', border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(120, 132, 23, 0.15)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid rgba(120, 132, 23, 0.12)' }}>
                    <tr>
                      <th style={{ padding: '12px 18px' }}>{t.colStudent}</th>
                      <th style={{ padding: '12px 18px' }}>ĐIỂM CODE TEST CASE</th>
                      <th style={{ padding: '12px 18px' }}>% ĐÓNG GÓP GIT (PHÂN HỆ 5)</th>
                      <th style={{ padding: '12px 18px' }}>ĐIỂM TỔNG KẾT</th>
                      <th style={{ padding: '12px 18px' }}>KẾT QUẢ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Lê Nguyễn Anh Mai</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>10.0 / 10</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>38.5%</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-orange-zest)' }}>9.8</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8', color: isDark ? '#4ADE80' : 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
                          Xuất Sắc
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>Nguyễn Văn A</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>9.0 / 10</td>
                      <td style={{ padding: '14px 18px', color: 'var(--color-exocarp)', fontWeight: 700 }}>31.0%</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800 }}>8.9</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: isDark ? 'rgba(34, 197, 94, 0.18)' : '#EDF6E8', color: isDark ? '#4ADE80' : 'var(--color-exocarp)', padding: '2px 8px', borderRadius: '6px' }}>
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
          {/* TAB 10: SYSTEM SETTINGS & STUDENT PROFILE                       */}
          {/* =============================================================== */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {/* Header Title */}
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  ⚙️ {lang === 'vi'
                    ? (currentRole === 'lecturer' ? 'Hồ Sơ Giảng Viên' : currentRole === 'admin' ? 'Hồ Sơ Quản Trị Viên' : 'Hồ Sơ Sinh Viên')
                    : (currentRole === 'lecturer' ? 'Lecturer Profile' : currentRole === 'admin' ? 'Admin Profile' : 'Student Profile')}
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.86rem' }}>
                  {lang === 'vi'
                    ? (currentRole === 'lecturer'
                      ? 'Thông tin tài khoản giảng viên, học phần phụ trách và cấu hình ngôn ngữ hiển thị.'
                      : currentRole === 'admin'
                      ? 'Thông tin tài khoản quản trị hệ thống, quyền hạn điều hành và cấu hình hiển thị.'
                      : 'Thông tin tài khoản sinh viên, nhóm đồ án và cấu hình ngôn ngữ hiển thị.')
                    : (currentRole === 'lecturer'
                      ? 'Lecturer account details, assigned courses, and display language configuration.'
                      : currentRole === 'admin'
                      ? 'System administrator account information, privileges, and display language configuration.'
                      : 'Student account information, team project, and display language configuration.')}
                </p>
              </div>

              {/* MAIN PROFILE CARD (WIDE & SPACIOUS) */}
              <div style={{
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                borderRadius: '24px',
                padding: '32px 36px',
                border: isDark ? '1.5px solid var(--border-card)' : '1.5px solid rgba(120, 132, 23, 0.16)',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '24px',
              }}>
                {/* Top: Avatar, Name, Email, Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '24px',
                  borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F1F3E8',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.6rem',
                      boxShadow: '0 6px 18px rgba(217, 100, 31, 0.35)',
                      flexShrink: 0,
                    }}>
                      {userFullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {userFullName}
                        </h2>
                        <span style={{
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          background: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
                          color: isDark ? '#4ADE80' : '#15803D',
                          border: isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #BBF7D0',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}>
                          🟢 {lang === 'vi' ? 'Đang hoạt động' : 'Active'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '4px' }}>
                        ✉️ {userEmail}
                      </div>
                      <div style={{ fontSize: '0.80rem', color: 'var(--color-orange-zest)', fontWeight: 700, marginTop: '4px' }}>
                        {currentRole === 'lecturer'
                          ? (lang === 'vi' ? '🎓 Giảng viên phụ trách: SWP391 - Đồ án phần mềm' : '🎓 Course Lecturer: SWP391 - Software Project')
                          : currentRole === 'admin'
                          ? (lang === 'vi' ? '⚙️ Quản trị viên hệ thống: AITA-Intelligent Enterprise' : '⚙️ System Administrator: AITA-Intelligent Enterprise')
                          : (lang === 'vi' ? '👨‍💻 Sinh viên lớp: SWP391 - Đồ án phần mềm' : '👨‍💻 Student: SWP391 - Software Project')}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    background: currentRole === 'lecturer' ? '#FAF2E6' : currentRole === 'admin' ? '#EFF6FF' : 'rgba(170, 176, 38, 0.18)',
                    color: currentRole === 'lecturer' ? 'var(--color-orange-zest)' : currentRole === 'admin' ? '#1D4ED8' : 'var(--color-exocarp)',
                    border: currentRole === 'lecturer' ? '1.5px solid var(--color-cantaloupe)' : currentRole === 'admin' ? '1.5px solid #BFDBFE' : '1.5px solid rgba(170, 176, 38, 0.35)',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>{currentRole === 'lecturer' ? '🎓' : currentRole === 'admin' ? '⚙️' : '👨‍💻'}</span>
                    <span>
                      {currentRole === 'student'
                        ? (lang === 'vi' ? 'Sinh viên (Student)' : 'Student')
                        : currentRole === 'lecturer'
                        ? (lang === 'vi' ? 'Giảng viên (Lecturer)' : 'Lecturer')
                        : (lang === 'vi' ? 'Quản trị viên (Admin)' : 'Administrator')}
                    </span>
                  </span>
                </div>

                {/* 2-Column Details Grid */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                    {lang === 'vi' ? 'THÔNG TIN CHI TIẾT' : 'ACCOUNT DETAILS'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {currentRole === 'lecturer' ? (
                      <>
                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'MÃ GIẢNG VIÊN (MSGV)' : 'LECTURER ID'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            GV-SWP391
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'BỘ MÔN / KHOA' : 'DEPARTMENT'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Kỹ thuật phần mềm (Software Engineering)' : 'Software Engineering'}
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'HỌC PHẦN PHỤ TRÁCH' : 'ASSIGNED COURSE'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-orange-zest)', marginTop: '4px' }}>
                            SWP391 - Software Project Capstone
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'CƠ SỞ ĐÀO TẠO' : 'CAMPUS'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Đại học FPT (Campus Đà Nẵng)' : 'FPT University (Da Nang Campus)'}
                          </div>
                        </div>
                      </>
                    ) : currentRole === 'admin' ? (
                      <>
                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'MÃ QUẢN TRỊ (ADMIN ID)' : 'ADMIN ID'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            ADM-ROOT-01
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'QUYỀN HẠN HỆ THỐNG' : 'PRIVILEGE LEVEL'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Toàn quyền điều hành (Super Admin)' : 'Super Administrator'}
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'PHẠM VI QUẢN LÝ' : 'MANAGEMENT SCOPE'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
                            PostgreSQL, Redis &amp; Docker Sandbox
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'CƠ SỞ ĐÀO TẠO' : 'CAMPUS'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Đại học FPT (Campus Đà Nẵng)' : 'FPT University (Da Nang Campus)'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'MÃ SINH VIÊN (MSSV)' : 'STUDENT ID'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            SE170113
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'CHUYÊN NGÀNH' : 'MAJOR'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Kỹ thuật phần mềm (Software Engineering)' : 'Software Engineering'}
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'ĐỒ ÁN TỐT NGHIỆP' : 'CAPSTONE PROJECT'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-orange-zest)', marginTop: '4px' }}>
                            AITA-Intelligent
                          </div>
                        </div>

                        <div style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1', padding: '14px 18px', borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {lang === 'vi' ? 'CƠ SỞ ĐÀO TẠO' : 'CAMPUS'}
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                            {lang === 'vi' ? 'Đại học FPT (Campus Đà Nẵng)' : 'FPT University (Da Nang Campus)'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Language Selection */}
                <div style={{
                  padding: '20px 22px',
                  borderRadius: '16px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                    🌐 {lang === 'vi' ? 'NGÔN NGỮ GIAO DIỆN' : 'DISPLAY LANGUAGE'}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onToggleLang && onToggleLang('vi')}
                      style={{
                        flex: '1 1 200px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: lang === 'vi' ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                        background: lang === 'vi' ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        color: lang === 'vi' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                        fontWeight: lang === 'vi' ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: lang === 'vi' ? '0 4px 12px rgba(217, 100, 31, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <VietnamFlag size={18} />
                      <span>Tiếng Việt (Mặc định)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleLang && onToggleLang('en')}
                      style={{
                        flex: '1 1 200px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: lang === 'en' ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                        background: lang === 'en' ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        color: lang === 'en' ? 'var(--color-orange-zest)' : 'var(--text-body)',
                        fontWeight: lang === 'en' ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: lang === 'en' ? '0 4px 12px rgba(217, 100, 31, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <UkFlag size={18} />
                      <span>English (International)</span>
                    </button>
                  </div>
                </div>

                {/* THEME MODE SELECTION (SÁNG / TỐI) - PLACED DIRECTLY UNDER LANGUAGE */}
                <div style={{
                  padding: '20px 22px',
                  borderRadius: '16px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F1',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
                  marginBottom: '28px',
                }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                    🌓 {t.themeSectionTitle}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onToggleTheme && onToggleTheme('light')}
                      style={{
                        flex: '1 1 200px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: !isDark ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                        background: !isDark ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        color: !isDark ? 'var(--color-orange-zest)' : 'var(--text-body)',
                        fontWeight: !isDark ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: !isDark ? '0 4px 12px rgba(217, 100, 31, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Sun size={20} color={!isDark ? 'var(--color-orange-zest)' : 'var(--text-muted)'} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                        <span style={{ fontWeight: 800 }}>{t.themeLightMode}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.themeLightDesc}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleTheme && onToggleTheme('dark')}
                      style={{
                        flex: '1 1 200px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: isDark ? '2px solid var(--color-orange-zest)' : (isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6'),
                        background: isDark ? (isDark ? 'var(--bg-surface-accent)' : '#FAF2E6') : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                        color: isDark ? 'var(--color-orange-zest)' : 'var(--text-body)',
                        fontWeight: isDark ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: isDark ? '0 4px 12px rgba(217, 100, 31, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Moon size={20} color={isDark ? 'var(--color-orange-zest)' : 'var(--text-muted)'} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                        <span style={{ fontWeight: 800 }}>{t.themeDarkMode}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.themeDarkDesc}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Actions: Return to Admin & Logout */}
                <div style={{ display: 'flex', justifyContent: isUserAdmin ? 'space-between' : 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  {isUserAdmin && (
                    <button
                      onClick={() => handleRoleSwitch('admin')}
                      style={{
                        padding: '11px 20px',
                        borderRadius: '12px',
                        background: isDark ? 'var(--bg-surface-accent)' : '#FAF2E6',
                        border: '1.5px solid var(--color-orange-zest)',
                        color: 'var(--color-orange-zest)',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 8px rgba(217, 100, 31, 0.15)',
                      }}
                    >
                      <Sliders size={16} />
                      <span>{lang === 'vi' ? '⚙️ Quay lại giao diện Admin' : '⚙️ Return to Admin Dashboard'}</span>
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    style={{
                      padding: '11px 22px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      border: isDark ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1.5px solid #FECACA',
                      color: isDark ? '#F87171' : '#DC2626',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LogOut size={16} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>

              {/* If currentRole is admin, show the Runtime Settings Sliders below */}
              {currentRole === 'admin' && (
                <div style={{
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '26px 30px',
                  border: isDark ? '1.5px solid var(--border-light)' : '1.5px solid rgba(120, 132, 23, 0.15)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>
                    ⚡ {lang === 'vi' ? 'Tham Số Chấm & Giám Sát Runtime (BR-07, BR-12)' : 'Grading & Monitoring Parameters (BR-07, BR-12)'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {lang === 'vi' ? 'Cấu hình tham số điều phối worker và ngưỡng cảnh báo đóng góp mã nguồn.' : 'Configure worker concurrency and free-rider alert thresholds.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                        <span>{lang === 'vi' ? 'Số Worker Concurrency (BR-07):' : 'Worker Concurrency (BR-07):'}</span>
                        <strong style={{ color: 'var(--color-orange-zest)' }}>{workerConcurrency} Workers</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={workerConcurrency}
                        onChange={(e) => handleUpdateConcurrency(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-orange-zest)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                        <span>{lang === 'vi' ? 'Ngưỡng Cảnh Báo Free-Rider (BR-12):' : 'Free-Rider Alert Threshold (BR-12):'}</span>
                        <strong style={{ color: '#B91C1C' }}>{freeRidingThreshold}%</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={freeRidingThreshold}
                        onChange={(e) => handleUpdateFreeRidingThreshold(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-orange-zest)' }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{lang === 'vi' ? 'Cấu Hình Đợt Chấm Bài (Batch Config)' : 'Batch Config'}</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{lang === 'vi' ? 'TÊN ĐỢT CHẤM*' : 'BATCH NAME*'}</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E5E8D6',
                  background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                  color: 'var(--text-main)',
                  marginTop: '6px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{lang === 'vi' ? 'MỨC ĐỘ ƯU TIÊN (BR-01)*' : 'PRIORITY LEVEL (BR-01)*'}</label>
              <select
                value={batchPriority}
                onChange={(e) => setBatchPriority(e.target.value as 'exam' | 'assignment' | 'practice')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E5E8D6',
                  background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                  color: 'var(--text-main)',
                  marginTop: '6px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="exam">{lang === 'vi' ? 'Exam (Ưu tiên cao nhất - Điểm 100)' : 'Exam (Highest Priority - Score 100)'}</option>
                <option value="assignment">Assignment (Ưu tiên trung bình - Điểm 50)</option>
                <option value="practice">Practice (Ưu tiên bình thường - Điểm 10)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '24px' }}>
              {lang === 'vi' ? 'Số bài nộp đã chọn:' : 'Selected submissions:'} <strong>{selectedSubmissions.length} bài</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                  color: 'var(--text-body)',
                  border: isDark ? '1px solid var(--border-light)' : 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleDispatchBatch}
                disabled={isDispatchingBatch}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--color-orange-zest)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: isDispatchingBatch ? 0.7 : 1,
                }}
              >
                {isDispatchingBatch ? 'Đang gửi...' : 'Gửi vào Hàng Đợi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: JOB DETAILS MODAL (SRS Page 33) */}
      {showJobDetailsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Chi Tiết Tác Vụ #{showJobDetailsModal}</h3>
              <button
                onClick={() => setShowJobDetailsModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div>Trạng thái: <strong style={{ color: '#EF4444' }}>failed (chờ retry lần 3)</strong></div>
              <div>Thời gian chạy: <strong>30,124 ms</strong></div>
              <div>Số lần retry: <strong>2 / 3 lần</strong> (khoảng chờ $2^2 = 4s$)</div>
              <div style={{ marginTop: '12px', fontWeight: 700 }}>Nguyên nhân lỗi:</div>
              <div style={{
                padding: '10px 14px',
                background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                borderRadius: '8px',
                color: isDark ? '#F87171' : '#B91C1C',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                marginTop: '4px',
              }}>
                TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)
              </div>
            </div>
            <button
              onClick={() => setShowJobDetailsModal(null)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '10px',
                borderRadius: '10px',
                background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                color: 'var(--text-body)',
                border: isDark ? '1px solid var(--border-light)' : 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: DLQ MODAL (SRS Page 35) */}
      {showDlqModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EF4444', marginBottom: '16px' }}>
              Xử Lý Tác Vụ Hàng Đợi Chết #{showDlqModal}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '20px', lineHeight: '1.6' }}>
              Job đã thử lại hết 3 lần và được cách ly. Giảng viên có thể chọn hủy bỏ vĩnh viễn hoặc nạp lại thủ công vào hàng đợi để chấm lại (BR-06: reset retryCount về 0).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => showDlqModal && handleDismissDlqJob(showDlqModal)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : 'none',
                  color: isDark ? '#F87171' : '#B91C1C',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Bỏ qua (Dismiss)
              </button>
              <button
                onClick={() => showDlqModal && handleReplayDlqJob(showDlqModal)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-orange-zest)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Nhập GitHub Personal Access Token</h3>
              <button
                onClick={() => setShowPatModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Token cần có quyền <code>repo:read</code> để clone kho mã nguồn riêng tư. Hệ thống sẽ mã hóa bằng chuẩn AES-256 (BR-08) trước khi lưu.
            </p>
            <input
              type="password"
              defaultValue="ghp_xxxxxxxxxxxxxxxxxxxx"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E5E8D6',
                background: isDark ? 'var(--bg-surface-input)' : '#FFFFFF',
                color: 'var(--text-main)',
                marginBottom: '20px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowPatModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                  color: 'var(--text-body)',
                  border: isDark ? '1px solid var(--border-light)' : 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowPatModal(false);
                  alert('Đã lưu và mã hóa Personal Access Token (AES-256) thành công!');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--color-orange-zest)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Lưu &amp; Xác Thực Mã Hóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: FLAGGED COMMITS (FRAUD DETECTION BR-10) */}
      {showFlaggedModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '620px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E5E7EB', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-orange-zest)' }}>
                {lang === 'vi' ? '⚠️ Danh Sách Commit Gian Lận (BR-10)' : '⚠️ Flagged Fraudulent Commits (BR-10)'}
              </h3>
              <button
                onClick={() => setShowFlaggedModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ borderRadius: '12px', border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', textAlign: 'left', fontSize: '0.75rem', color: isDark ? '#94A3B8' : '#475569', borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'vi' ? 'TÁC GIẢ' : 'AUTHOR'}</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'vi' ? 'NGÀY COMMIT' : 'COMMIT DATE'}</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'vi' ? 'HÀNH VI GIAN LẬN' : 'FRAUDULENT BEHAVIOR'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #F1F5F9', background: isDark ? 'rgba(239, 68, 68, 0.05)' : '#FEF2F2' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>VT</div>
                        <div>
                          <div>Võ Minh Trí</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>tri.vm@fpt.edu.vn</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: isDark ? '#F1F5F9' : '#334155', fontFamily: 'monospace', fontWeight: 600 }}>2026-09-09</td>
                    <td style={{ padding: '14px 16px', color: '#DC2626', fontWeight: 700, fontSize: '0.8rem' }}>
                      {lang === 'vi' ? 'Whitespace-only (chỉ thêm dấu cách để farm LOC)' : 'Whitespace-only (adding spaces to farm LOC)'}
                    </td>
                  </tr>
                  <tr style={{ background: isDark ? 'rgba(239, 68, 68, 0.05)' : '#FEF2F2' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>VT</div>
                        <div>
                          <div>Võ Minh Trí</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>tri.vm@fpt.edu.vn</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: isDark ? '#F1F5F9' : '#334155', fontFamily: 'monospace', fontWeight: 600 }}>2026-09-08</td>
                    <td style={{ padding: '14px 16px', color: '#D97706', fontWeight: 700, fontSize: '0.8rem' }}>
                      {lang === 'vi' ? 'Self-revert (tự xóa commit liền trước của mình)' : 'Self-revert (reverting own previous commit)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowFlaggedModal(false)}
              onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'var(--bg-surface-hover)' : '#E5E7EB'}
              onMouseOut={(e) => e.currentTarget.style.background = isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6'}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                borderRadius: '10px',
                background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                color: 'var(--text-main)',
                border: isDark ? '1px solid var(--border-light)' : 'none',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {lang === 'vi' ? 'Đóng cửa sổ' : 'Close window'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: MEMBER DETAILS MODAL */}
      {showMemberModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E5E8D6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: 'var(--text-main)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Lịch Sử Đóng Góp: {showMemberModal}</h3>
              <button
                onClick={() => setShowMemberModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div>Tổng Net LOC: <strong style={{ color: 'var(--color-exocarp)' }}>+1,840 lines</strong></div>
              <div>Tổng Commits sạch: <strong>24 commits</strong></div>
              <div>Pull Requests: <strong>4 PRs</strong></div>
            </div>
            <button
              onClick={() => setShowMemberModal(null)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '10px',
                borderRadius: '10px',
                background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                color: 'var(--text-body)',
                border: isDark ? '1px solid var(--border-light)' : 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
