import React, { useState, useRef } from 'react';
import {
  X,
  Users,
  FolderGit2,
  Plus,
  Trash2,
  CheckCircle,
  GitBranch,
  Calendar,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Crown,
  Search,
  Check,
  Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface TeamMemberDetail {
  mssv: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member' | string;
}

export interface TeamGroupItem {
  id: string;
  teamName: string;
  projectTopic: string;
  topicType?: 'teacher_assigned' | 'student_proposed';
  leader: string;
  leaderMssv?: string;
  members: string[];
  memberDetails?: TeamMemberDetail[];
  gitUrl: string;
  branch: string;
  status: 'approved' | 'pending';
  classCode?: string;
}

interface GroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassCode: string;
  classesList: string[];
  onSaveGroupAssignment: (assignmentData: {
    classCode: string;
    projectTitle?: string;
    description?: string;
    topicMode?: 'teacher_assigned' | 'student_proposed';
    deadline: string;
    freeRiderThreshold: number;
    minCommits: number;
    teams: TeamGroupItem[];
  }) => void;
  lang: 'vi' | 'en';
  isDark: boolean;
  initialTeams?: TeamGroupItem[];
}

export const GroupAssignmentModal: React.FC<GroupAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedClassCode,
  classesList,
  onSaveGroupAssignment,
  lang,
  isDark,
  initialTeams
}) => {
  const [targetClass, setTargetClass] = useState<string>(selectedClassCode || 'SWP391-SE1801');
  const [deadline, setDeadline] = useState<string>('2026-11-15 23:59');
  const [freeRiderThreshold, setFreeRiderThreshold] = useState<number>(10);
  const [minCommits, setMinCommits] = useState<number>(5);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<{
    fileName: string;
    teamCount: number;
    studentCount: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 3 standard default teams matching sample Excel (10 students across 3 teams)
  const defaultTeams: TeamGroupItem[] = [
    {
      id: 'TG-1',
      teamName: 'Nhóm 1',
      projectTopic: 'AITA Intelligent - Nền Tảng Chấm Bài & Phân Tích Đóng Góp Git Tự Động',
      topicType: 'teacher_assigned',
      leader: 'Lê Nguyễn Anh Mai',
      leaderMssv: 'SE180101',
      members: ['Lê Nguyễn Anh Mai', 'Lê Nguyễn Linh Nhi', 'Nguyễn Tường Vy'],
      memberDetails: [
        { mssv: 'SE180101', name: 'Lê Nguyễn Anh Mai', email: 'maina.se180101@fpt.edu.vn', role: 'Leader' },
        { mssv: 'SE180102', name: 'Lê Nguyễn Linh Nhi', email: 'nhilnl.se180102@fpt.edu.vn', role: 'Member' },
        { mssv: 'SE180103', name: 'Nguyễn Tường Vy', email: 'vynt.se180103@fpt.edu.vn', role: 'Member' }
      ],
      gitUrl: 'https://github.com/lenguyenanhmai05/AITA-Intelligent',
      branch: 'main',
      status: 'approved',
      classCode: 'SWP391-SE1801'
    },
    {
      id: 'TG-2',
      teamName: 'Nhóm 2',
      projectTopic: 'Smart Logistics - Hệ Thống Quản Lý Kho Vận & Vận Chuyển',
      topicType: 'student_proposed',
      leader: 'Trần Minh Quân',
      leaderMssv: 'SE180201',
      members: ['Trần Minh Quân', 'Hoàng Văn Nam', 'Phạm Thị Dung', 'Đỗ Đức Anh'],
      memberDetails: [
        { mssv: 'SE180201', name: 'Trần Minh Quân', email: 'quantm.se180201@fpt.edu.vn', role: 'Leader' },
        { mssv: 'SE180202', name: 'Hoàng Văn Nam', email: 'namhv.se180202@fpt.edu.vn', role: 'Member' },
        { mssv: 'SE180203', name: 'Phạm Thị Dung', email: 'dungpt.se180203@fpt.edu.vn', role: 'Member' },
        { mssv: 'SE180204', name: 'Đỗ Đức Anh', email: 'anhdd.se180204@fpt.edu.vn', role: 'Member' }
      ],
      gitUrl: 'https://github.com/smart-lms/smart-lms-platform',
      branch: 'main',
      status: 'approved',
      classCode: 'SWP391-SE1801'
    },
    {
      id: 'TG-3',
      teamName: 'Nhóm 3',
      projectTopic: 'E-Commerce AI - Sàn Thương Mại Điện Tử & Gợi Ý AI',
      topicType: 'student_proposed',
      leader: 'Phạm Hoàng Long',
      leaderMssv: 'SE180301',
      members: ['Phạm Hoàng Long', 'Vũ Quỳnh Anh', 'Ngô Quốc Bảo'],
      memberDetails: [
        { mssv: 'SE180301', name: 'Phạm Hoàng Long', email: 'longph.se180301@fpt.edu.vn', role: 'Leader' },
        { mssv: 'SE180302', name: 'Vũ Quỳnh Anh', email: 'anhvq.se180302@fpt.edu.vn', role: 'Member' },
        { mssv: 'SE180303', name: 'Ngô Quốc Bảo', email: 'baonq.se180303@fpt.edu.vn', role: 'Member' }
      ],
      gitUrl: 'https://github.com/ecommerce-ai/platform',
      branch: 'main',
      status: 'approved',
      classCode: 'SWP391-SE1801'
    }
  ];

  const [teams, setTeams] = useState<TeamGroupItem[]>(() => {
    if (initialTeams && initialTeams.length > 0) {
      return initialTeams.map(t => {
        if (!t.memberDetails || t.memberDetails.length === 0) {
          const details: TeamMemberDetail[] = t.members.map((m, idx) => ({
            mssv: t.leaderMssv && idx === 0 ? t.leaderMssv : `SE180${idx + 1}01`,
            name: m,
            email: `${m.toLowerCase().replace(/\s+/g, '')}.se180${idx + 1}01@fpt.edu.vn`,
            role: m === t.leader || idx === 0 ? 'Leader' : 'Member'
          }));
          return { ...t, memberDetails: details, leaderMssv: details[0]?.mssv, classCode: t.classCode || targetClass };
        }
        return { ...t, classCode: t.classCode || targetClass };
      });
    }
    return defaultTeams;
  });

  // Track expanded cards
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(() => new Set(['TG-1']));
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Manual add team form drawer
  const [isAddingTeam, setIsAddingTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamTopic, setNewTeamTopic] = useState<string>('');
  const [newTeamLeader, setNewTeamLeader] = useState<string>('');
  const [newTeamLeaderMssv, setNewTeamLeaderMssv] = useState<string>('');
  const [newTeamLeaderEmail, setNewTeamLeaderEmail] = useState<string>('');
  const [newTeamMembers, setNewTeamMembers] = useState<string>('');
  const [newTeamGit, setNewTeamGit] = useState<string>('');

  if (!isOpen) return null;

  // Toggle card expansion
  const toggleExpandTeam = (id: string) => {
    setExpandedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTeamIds(new Set(teams.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedTeamIds(new Set());
  };

  // ==========================================
  // AI EXCEL PARSER LOGIC WITH ACCENT NORMALIZATION
  // ==========================================
  const removeVietnameseTones = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const findValueByPatterns = (row: any, patterns: RegExp[]): string => {
    for (const key of Object.keys(row)) {
      const rawKey = key.toLowerCase().trim();
      const noTonesKey = removeVietnameseTones(key).toLowerCase().trim().replace(/[\s_\-\/()]+/g, '');
      const cleanKey = rawKey.replace(/[\s_\-\/()]+/g, '');
      for (const pattern of patterns) {
        if (pattern.test(noTonesKey) || pattern.test(cleanKey) || pattern.test(rawKey)) {
          const val = String(row[key] ?? '').trim();
          if (val) return val;
        }
      }
    }
    return '';
  };

  const processExcelFile = (file: File) => {
    setIsAiParsing(true);
    setUploadSuccessInfo(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          alert(lang === 'vi' ? 'Tệp Excel trống hoặc không có dòng dữ liệu nào!' : 'Excel file is empty or has no data!');
          setIsAiParsing(false);
          return;
        }

        // Patterns supporting both accented Vietnamese and unaccented/English column headers
        const mssvPatterns = [/mssv/, /masosinhvien/, /masv/, /studentid/, /code/, /^id$/];
        const namePatterns = [/hoten/, /hovaten/, /tensinhvien/, /tensv/, /fullname/, /studentname/, /^ten$/];
        const emailPatterns = [/email/, /gmail/, /mail/, /thudientu/];
        const rolePatterns = [/role/, /vaitro/, /chucdanh/, /chucvu/, /position/];
        const teamPatterns = [/nhom/, /nhóm/, /tennhom/, /tênnhóm/, /group/, /team/, /teamname/];
        const classPatterns = [/lop/, /lớp/, /lophoc/, /lớphọc/, /class/, /classcode/];
        const topicPatterns = [/detai/, /đềtài/, /tendetai/, /tênđềtài/, /duan/, /dựán/, /tenduan/, /têndựán/, /project/, /topic/, /projectname/];
        const gitPatterns = [/git/, /github/, /linkgit/, /repo/, /repository/, /giturl/, /urlgit/];

        interface TempGroup {
          teamName: string;
          projectTopic: string;
          gitUrl: string;
          classCode: string;
          members: TeamMemberDetail[];
        }

        const teamMap = new Map<string, TempGroup>();
        let studentCount = 0;
        let detectedClass = '';

        rawRows.forEach((row, rowIdx) => {
          const mssvVal = findValueByPatterns(row, mssvPatterns) || `SV${String(rowIdx + 1).padStart(4, '0')}`;
          const nameVal = findValueByPatterns(row, namePatterns);
          if (!nameVal && !mssvVal) return; // Skip blank rows

          studentCount++;
          let emailVal = findValueByPatterns(row, emailPatterns);
          if (!emailVal) {
            // Find any cell value containing @
            for (const k of Object.keys(row)) {
              const strVal = String(row[k] ?? '').trim();
              if (strVal.includes('@') && !strVal.startsWith('http')) {
                emailVal = strVal;
                break;
              }
            }
          }
          if (!emailVal) {
            emailVal = `${mssvVal.toLowerCase()}@fpt.edu.vn`;
          }

          const roleRaw = removeVietnameseTones(findValueByPatterns(row, rolePatterns)).toLowerCase();
          const isLeader = /lead|truong|chu\s*nhiem/.test(roleRaw);
          const role: 'Leader' | 'Member' = isLeader ? 'Leader' : 'Member';

          let teamVal = findValueByPatterns(row, teamPatterns);
          const topicVal = findValueByPatterns(row, topicPatterns);
          let gitVal = findValueByPatterns(row, gitPatterns);
          const classVal = findValueByPatterns(row, classPatterns);

          // If git link not found in headers, check any string containing github
          if (!gitVal) {
            for (const k of Object.keys(row)) {
              const strVal = String(row[k] ?? '');
              if (/github\.com|gitlab\.com/.test(strVal)) {
                gitVal = strVal.trim();
                break;
              }
            }
          }

          if (classVal && !detectedClass) {
            detectedClass = classVal;
          }

          // Canonical team key: "Nhóm 1", "Nhóm 2", ... so all members of the same group MERGE properly
          let canonicalTeamKey = '';
          if (teamVal) {
            const trimmed = teamVal.trim();
            if (/^\d+$/.test(trimmed)) {
              canonicalTeamKey = `Nhóm ${parseInt(trimmed, 10)}`;
            } else {
              const match = trimmed.match(/(?:nhom|nhóm|group|team)\s*0*(\d+)/i);
              if (match) {
                canonicalTeamKey = `Nhóm ${parseInt(match[1], 10)}`;
              } else {
                canonicalTeamKey = trimmed;
              }
            }
          } else if (topicVal) {
            canonicalTeamKey = `Nhóm - ${topicVal.substring(0, 20)}`;
          } else {
            canonicalTeamKey = `Nhóm ${teamMap.size + 1}`;
          }

          if (!teamMap.has(canonicalTeamKey)) {
            teamMap.set(canonicalTeamKey, {
              teamName: canonicalTeamKey,
              projectTopic: topicVal || `Đồ án môn học: ${canonicalTeamKey}`,
              gitUrl: gitVal || `https://github.com/swp391-${(classVal || targetClass).toLowerCase()}/${canonicalTeamKey.toLowerCase().replace(/\s+/g, '-')}`,
              classCode: classVal || targetClass,
              members: []
            });
          }

          const currentGroup = teamMap.get(canonicalTeamKey)!;
          if (topicVal && (!currentGroup.projectTopic || currentGroup.projectTopic.startsWith('Đồ án môn học:'))) {
            currentGroup.projectTopic = topicVal;
          }
          if (gitVal && (!currentGroup.gitUrl || currentGroup.gitUrl.includes('swp391-'))) {
            currentGroup.gitUrl = gitVal;
          }
          if (classVal && currentGroup.classCode === targetClass) {
            currentGroup.classCode = classVal;
          }

          currentGroup.members.push({
            mssv: mssvVal,
            name: nameVal || `Sinh viên ${mssvVal}`,
            email: emailVal,
            role: role
          });
        });

        if (teamMap.size === 0) {
          alert(lang === 'vi' ? 'Không nhận diện được nhóm nào từ file Excel. Vui lòng kiểm tra lại cấu trúc file mẫu!' : 'Could not parse any teams. Please check the sample format!');
          setIsAiParsing(false);
          return;
        }

        // Convert Map to TeamGroupItem array
        const newParsedTeams: TeamGroupItem[] = [];
        let groupIdx = 1;

        teamMap.forEach((grp) => {
          // Identify leader
          const leaderMember = grp.members.find(m => m.role === 'Leader') || grp.members[0];
          if (!grp.members.some(m => m.role === 'Leader') && grp.members[0]) {
            grp.members[0].role = 'Leader';
          }

          newParsedTeams.push({
            id: `TG-${Date.now()}-${groupIdx++}`,
            teamName: grp.teamName,
            projectTopic: grp.projectTopic,
            topicType: 'teacher_assigned',
            leader: leaderMember ? leaderMember.name : 'Chưa chỉ định',
            leaderMssv: leaderMember ? leaderMember.mssv : '',
            members: grp.members.map(m => m.name),
            memberDetails: grp.members,
            gitUrl: grp.gitUrl,
            branch: 'main',
            status: 'approved',
            classCode: grp.classCode || targetClass
          });
        });

        if (detectedClass && classesList.includes(detectedClass)) {
          setTargetClass(detectedClass);
        }

        setTeams(newParsedTeams);
        // Expand all parsed teams so user sees results immediately
        setExpandedTeamIds(new Set(newParsedTeams.map(t => t.id)));
        setUploadSuccessInfo({
          fileName: file.name,
          teamCount: newParsedTeams.length,
          studentCount: studentCount
        });
        setIsAiParsing(false);
      } catch (err: any) {
        console.error('Lỗi khi đọc file Excel:', err);
        alert(lang === 'vi' ? `Có lỗi khi bóc tách Excel: ${err?.message || 'Định dạng không hợp lệ'}` : `Failed to parse Excel: ${err?.message}`);
        setIsAiParsing(false);
      }
    };

    reader.onerror = () => {
      alert(lang === 'vi' ? 'Lỗi khi đọc file trên máy tính!' : 'Failed to read file from disk!');
      setIsAiParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // ==========================================
  // GENERATE SAMPLE EXCEL TEMPLATE (.XLSX) - 3 TEAMS, 10 STUDENTS
  // ==========================================
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180101',
        'Họ Và Tên': 'Lê Nguyễn Anh Mai',
        'Email / Gmail': 'maina.se180101@fpt.edu.vn',
        'Vai Trò (Role)': 'Leader',
        'Nhóm': 'Nhóm 1',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'AITA Intelligent - Nền Tảng Chấm Bài & Phân Tích Đóng Góp Git Tự Động',
        'Link Git Repository': 'https://github.com/lenguyenanhmai05/AITA-Intelligent'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180102',
        'Họ Và Tên': 'Lê Nguyễn Linh Nhi',
        'Email / Gmail': 'nhilnl.se180102@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 1',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'AITA Intelligent - Nền Tảng Chấm Bài & Phân Tích Đóng Góp Git Tự Động',
        'Link Git Repository': 'https://github.com/lenguyenanhmai05/AITA-Intelligent'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180103',
        'Họ Và Tên': 'Nguyễn Tường Vy',
        'Email / Gmail': 'vynt.se180103@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 1',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'AITA Intelligent - Nền Tảng Chấm Bài & Phân Tích Đóng Góp Git Tự Động',
        'Link Git Repository': 'https://github.com/lenguyenanhmai05/AITA-Intelligent'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180201',
        'Họ Và Tên': 'Trần Minh Quân',
        'Email / Gmail': 'quantm.se180201@fpt.edu.vn',
        'Vai Trò (Role)': 'Leader',
        'Nhóm': 'Nhóm 2',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'Smart Logistics - Hệ Thống Quản Lý Vận Chuyển Kho Bãi',
        'Link Git Repository': 'https://github.com/smart-lms/smart-lms-platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180202',
        'Họ Và Tên': 'Hoàng Văn Nam',
        'Email / Gmail': 'namhv.se180202@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 2',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'Smart Logistics - Hệ Thống Quản Lý Vận Chuyển Kho Bãi',
        'Link Git Repository': 'https://github.com/smart-lms/smart-lms-platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180203',
        'Họ Và Tên': 'Phạm Thị Dung',
        'Email / Gmail': 'dungpt.se180203@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 2',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'Smart Logistics - Hệ Thống Quản Lý Vận Chuyển Kho Bãi',
        'Link Git Repository': 'https://github.com/smart-lms/smart-lms-platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180204',
        'Họ Và Tên': 'Đỗ Đức Anh',
        'Email / Gmail': 'anhdd.se180204@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 2',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'Smart Logistics - Hệ Thống Quản Lý Vận Chuyển Kho Bãi',
        'Link Git Repository': 'https://github.com/smart-lms/smart-lms-platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180301',
        'Họ Và Tên': 'Phạm Hoàng Long',
        'Email / Gmail': 'longph.se180301@fpt.edu.vn',
        'Vai Trò (Role)': 'Leader',
        'Nhóm': 'Nhóm 3',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'E-Commerce AI - Sàn Thương Mại Điện Tử & Gợi Ý AI',
        'Link Git Repository': 'https://github.com/ecommerce-ai/platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180302',
        'Họ Và Tên': 'Vũ Quỳnh Anh',
        'Email / Gmail': 'anhvq.se180302@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 3',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'E-Commerce AI - Sàn Thương Mại Điện Tử & Gợi Ý AI',
        'Link Git Repository': 'https://github.com/ecommerce-ai/platform'
      },
      {
        'Mã Số Sinh Viên (MSSV)': 'SE180303',
        'Họ Và Tên': 'Ngô Quốc Bảo',
        'Email / Gmail': 'baonq.se180303@fpt.edu.vn',
        'Vai Trò (Role)': 'Member',
        'Nhóm': 'Nhóm 3',
        'Lớp': 'SWP391-SE1801',
        'Đề Tài / Tên Dự Án': 'E-Commerce AI - Sàn Thương Mại Điện Tử & Gợi Ý AI',
        'Link Git Repository': 'https://github.com/ecommerce-ai/platform'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 15 }, // MSSV
      { wch: 22 }, // Họ tên
      { wch: 28 }, // Email / Gmail
      { wch: 14 }, // Role
      { wch: 12 }, // Nhóm
      { wch: 16 }, // Lớp
      { wch: 45 }, // Đề tài
      { wch: 48 }  // Link git
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachPhanCongDoAn');
    XLSX.writeFile(wb, 'Mau_Phan_Cong_Do_An_Nhom_AITA.xlsx');
  };

  // Add a team manually
  const handleAddTeam = () => {
    if (!newTeamName.trim() || !newTeamTopic.trim()) {
      alert(lang === 'vi' ? 'Vui lòng nhập tên nhóm và tên đề tài!' : 'Please enter team name and topic!');
      return;
    }
    const membersList = newTeamMembers.split(',').map(m => m.trim()).filter(Boolean);
    const leaderName = newTeamLeader.trim() || (membersList[0] || 'Chưa chỉ định');
    const leaderMssv = newTeamLeaderMssv.trim() || 'SE180101';
    const leaderEmail = newTeamLeaderEmail.trim() || `${leaderMssv.toLowerCase()}@fpt.edu.vn`;

    const memberDetailsList: TeamMemberDetail[] = [
      { mssv: leaderMssv, name: leaderName, email: leaderEmail, role: 'Leader' }
    ];

    membersList.forEach((m, idx) => {
      if (m !== leaderName) {
        const mssv = `SE180${idx + 2}01`;
        memberDetailsList.push({
          mssv,
          name: m,
          email: `${mssv.toLowerCase()}@fpt.edu.vn`,
          role: 'Member'
        });
      }
    });

    const newTeam: TeamGroupItem = {
      id: `TG-${Date.now()}`,
      teamName: newTeamName.trim(),
      projectTopic: newTeamTopic.trim(),
      topicType: 'teacher_assigned',
      leader: leaderName,
      leaderMssv: leaderMssv,
      members: memberDetailsList.map(m => m.name),
      memberDetails: memberDetailsList,
      gitUrl: newTeamGit.trim() || `https://github.com/aita-project/${newTeamName.trim().toLowerCase().replace(/\s+/g, '-')}`,
      branch: 'main',
      status: 'approved',
      classCode: targetClass
    };

    setTeams([newTeam, ...teams]);
    setExpandedTeamIds(new Set([newTeam.id, ...Array.from(expandedTeamIds)]));
    setNewTeamName('');
    setNewTeamTopic('');
    setNewTeamLeader('');
    setNewTeamLeaderMssv('');
    setNewTeamLeaderEmail('');
    setNewTeamMembers('');
    setNewTeamGit('');
    setIsAddingTeam(false);
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa nhóm này khỏi đợt đồ án?' : 'Delete this team?')) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setTeams(teams.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'approved' ? 'pending' : 'approved' };
      }
      return t;
    }));
  };

  const handleUpdateTeamTopic = (id: string, newTopic: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, projectTopic: newTopic } : t));
  };

  const handleUpdateTeamGit = (id: string, newGit: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, gitUrl: newGit } : t));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (teams.length === 0) {
      alert(lang === 'vi' ? 'Vui lòng thêm hoặc tải lên ít nhất 1 nhóm!' : 'Please add or upload at least one team!');
      return;
    }

    const firstTopic = teams[0]?.projectTopic || 'Đồ Án Môn Học SWP391';
    const computedTitle = teams.length === 1
      ? `Đồ án nhóm: ${firstTopic}`
      : `Đồ án môn học SWP391: Phân công ${teams.length} Dự án Nhóm & Git Repositories`;

    const computedDesc = `Đợt đồ án nhóm gồm ${teams.length} đề tài được bóc tách và phân công tự động từ file Excel danh sách lớp. Hệ thống AITA sẽ tự động kéo commits, AST bóc tách mã nguồn, tính Net LOC và phát hiện Free-Rider (< ${freeRiderThreshold}%).`;

    onSaveGroupAssignment({
      classCode: targetClass,
      projectTitle: computedTitle,
      description: computedDesc,
      deadline,
      freeRiderThreshold,
      minCommits,
      teams
    });
    onClose();
  };

  // Filtered teams for search (search by topic, leader, member, mssv, git, email, class)
  const filteredTeams = teams.filter(t => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const inName = t.teamName.toLowerCase().includes(q);
    const inTopic = t.projectTopic.toLowerCase().includes(q);
    const inLeader = t.leader.toLowerCase().includes(q);
    const inGit = t.gitUrl.toLowerCase().includes(q);
    const inMembers = t.members.some(m => m.toLowerCase().includes(q));
    const inMssv = t.memberDetails?.some(m => m.mssv.toLowerCase().includes(q)) || false;
    const inEmail = t.memberDetails?.some(m => m.email.toLowerCase().includes(q)) || false;
    const inClass = (t.classCode || targetClass).toLowerCase().includes(q);
    return inName || inTopic || inLeader || inGit || inMembers || inMssv || inEmail || inClass;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 130,
      padding: '16px'
    }}>
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '1200px',
        width: '96vw',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
        boxShadow: '0 25px 65px rgba(122, 62, 46, 0.4)',
        color: 'var(--text-main)',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 26px',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          background: isDark ? 'rgba(45, 26, 22, 0.65)' : 'linear-gradient(90deg, #FFFAF6 0%, #FBEEE6 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 16px rgba(181, 82, 58, 0.35)'
            }}>
              <FolderGit2 size={23} />
            </div>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.70rem',
                fontWeight: 800,
                color: 'var(--color-terracotta-700, #B5523A)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '2px'
              }}>
                <Sparkles size={12} />
                <span>{lang === 'vi' ? 'BÓC TÁCH EXCEL THÔNG MINH AI • PHÂN CÔNG ĐỒ ÁN NHÓM' : 'SMART AI EXCEL PARSER • TEAM PROJECT ALLOCATION'}</span>
              </div>
              <h3 style={{ fontSize: '1.20rem', fontWeight: 800, margin: 0, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                {lang === 'vi' ? 'Giao Đề Bài Đồ Án Nhóm (SWP391 / Capstone Project)' : 'Assign Team Project & Capstone'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Top configuration row: Class, Deadline, Git & Free-Rider Rules */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              background: isDark ? 'rgba(45, 26, 22, 0.35)' : 'var(--color-terracotta-50, #FFFAF6)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)'
            }}>
              {/* 1. Select Class */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {lang === 'vi' ? '1. Áp Dụng Cho Lớp Học *' : '1. Target Class *'}
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
                    background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                >
                  {Array.from(new Set([...classesList, 'SWP391-SE1801', 'PRN231-SE1803', 'PRJ301-IS1702', 'MMA301'])).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Deadline */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {lang === 'vi' ? '2. Hạn Chót Nộp Git & Báo Cáo *' : '2. Deadline (Git & Report) *'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="var(--color-terracotta-600, #D9794E)" />
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '9px',
                      border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* 3. Free-Riding threshold & Min commits */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  {lang === 'vi' ? '3. Tiêu Chuẩn Git & Free-Rider *' : '3. Git & Free-Rider Rules *'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Free-Rider &lt;</span>
                    <input
                      type="number"
                      value={freeRiderThreshold}
                      onChange={(e) => setFreeRiderThreshold(Number(e.target.value))}
                      style={{
                        width: '50px',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        border: '1.5px solid #F1C2A7',
                        fontWeight: 800,
                        textAlign: 'center',
                        fontSize: '0.84rem'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>%</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Min Commits:</span>
                    <input
                      type="number"
                      value={minCommits}
                      onChange={(e) => setMinCommits(Number(e.target.value))}
                      style={{
                        width: '50px',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        border: '1.5px solid #F1C2A7',
                        fontWeight: 800,
                        textAlign: 'center',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MINIMALIST & STREAMLINED EXCEL UPLOAD CARD */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                borderRadius: '16px',
                border: isDragging
                  ? '2px dashed #D9794E'
                  : (isDark ? '1.5px dashed #5C3225' : '1.5px dashed #F1C2A7'),
                background: isDragging
                  ? (isDark ? 'rgba(217, 121, 78, 0.15)' : '#FFF3EB')
                  : (isDark ? 'rgba(38, 20, 16, 0.35)' : '#FFFDFB'),
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              {/* Left: Icon + Concise title & clean unbolded column reminder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF8A50 0%, #D95328 100%)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(217, 83, 40, 0.25)'
                }}>
                  <FileSpreadsheet size={22} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                      {lang === 'vi' ? 'Tải Lên File Excel Phân Công Nhóm & Đề Tài' : 'Upload Team Project Excel'}
                    </h4>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(217, 121, 78, 0.12)',
                      color: 'var(--color-terracotta-700, #B5523A)'
                    }}>
                      .xlsx, .xls, .csv
                    </span>
                  </div>

                  {/* Clean, minimalist column helper line with NO bold tags */}
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-terracotta-700, #B5523A)' }}>✨ Cột AI tự nhận diện: </span>
                    <span>Mã SV • Họ Tên • Email/Gmail • Vai Trò (Leader/Member) • Nhóm • Lớp • Đề Tài • Link Git</span>
                  </div>
                </div>
              </div>

              {/* Right: 2 Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isAiParsing}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: isAiParsing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(181, 82, 58, 0.3)'
                  }}
                >
                  {isAiParsing ? (
                    <>
                      <Sparkles size={14} className="animate-spin" />
                      <span>{lang === 'vi' ? 'AI Đang Đọc...' : 'Parsing...'}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} />
                      <span>{lang === 'vi' ? '✨ Tải Lên File Excel' : '✨ Upload Excel'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                    color: 'var(--color-terracotta-700, #B5523A)',
                    fontWeight: 800,
                    fontSize: '0.80rem',
                    border: '1.5px solid var(--color-terracotta-300, #F1C2A7)',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>{lang === 'vi' ? 'Tải File Mẫu (.xlsx)' : 'Sample Template'}</span>
                </button>
              </div>

              {/* Upload Success Alert */}
              {uploadSuccessInfo && (
                <div style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10B981',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.80rem',
                  fontWeight: 700
                }}>
                  <CheckCircle size={15} />
                  <span>
                    {lang === 'vi'
                      ? `🎉 AI đã đọc thành công ${uploadSuccessInfo.teamCount} nhóm (${uploadSuccessInfo.studentCount} sinh viên kèm Email/Gmail) từ tệp "${uploadSuccessInfo.fileName}"!`
                      : `🎉 Successfully parsed ${uploadSuccessInfo.teamCount} teams (${uploadSuccessInfo.studentCount} students with emails) from "${uploadSuccessInfo.fileName}"!`}
                  </span>
                </div>
              )}
            </div>

            {/* TEAMS AND TOPICS INTERACTIVE LIST */}
            <div>
              {/* Header bar of team roster */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: 'rgba(217, 121, 78, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-terracotta-700, #B5523A)'
                  }}>
                    <Users size={17} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                      {lang === 'vi'
                        ? `Danh Sách Phân Công Đồ Án Lớp ${targetClass} (${teams.length} Nhóm)`
                        : `Team Project Allocation for ${targetClass} (${teams.length} Teams)`}
                    </h4>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {lang === 'vi'
                        ? 'Cấu trúc hiển thị: [Tên Lớp] [Tên Nhóm] [Tên Dự Án] • Bấm vào để mở rộng chi tiết Leader, Thành viên, Email và Link Git'
                        : 'Format: [Class] [Team] [Project Name] • Click to expand details'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Search box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <Search size={14} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder={lang === 'vi' ? 'Tìm lớp, đề tài, email, MSSV...' : 'Search class, topic, email...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.80rem',
                        color: 'var(--text-main)',
                        width: '180px'
                      }}
                    />
                  </div>

                  {/* Expand/Collapse All */}
                  <button
                    type="button"
                    onClick={expandedTeamIds.size === teams.length ? collapseAll : expandAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid #CBD5E1',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {expandedTeamIds.size === teams.length ? (lang === 'vi' ? 'Thu gọn tất cả' : 'Collapse all') : (lang === 'vi' ? 'Mở rộng tất cả' : 'Expand all')}
                  </button>

                  {/* Add team toggle */}
                  <button
                    type="button"
                    onClick={() => setIsAddingTeam(!isAddingTeam)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--color-kumquat, #EA6D35), var(--color-orange-zest, #D95328))',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217, 83, 40, 0.25)'
                    }}
                  >
                    <Plus size={15} />
                    <span>{isAddingTeam ? (lang === 'vi' ? 'Đóng Thêm Nhóm' : 'Close Add') : (lang === 'vi' ? '+ Thêm Nhóm Mới' : '+ Add Team')}</span>
                  </button>
                </div>
              </div>

              {/* Add New Team Form Drawer (Manual Entry) */}
              {isAddingTeam && (
                <div style={{
                  background: isDark ? 'rgba(45, 26, 22, 0.5)' : '#FBEEE6',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  marginBottom: '14px',
                  border: '1.5px dashed var(--color-terracotta-400, #E7A27A)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'TÊN NHÓM *' : 'TEAM NAME *'}
                    </label>
                    <input
                      type="text"
                      placeholder="Nhóm 4"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'TÊN ĐỀ TÀI / DỰ ÁN *' : 'PROJECT TOPIC *'}
                    </label>
                    <input
                      type="text"
                      placeholder="AI Code Analytics..."
                      value={newTeamTopic}
                      onChange={(e) => setNewTeamTopic(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'TRƯỞNG NHÓM (Họ tên)' : 'LEADER NAME'}
                    </label>
                    <input
                      type="text"
                      placeholder="Lê Văn A"
                      value={newTeamLeader}
                      onChange={(e) => setNewTeamLeader(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'MSSV TRƯỞNG NHÓM' : 'LEADER MSSV'}
                    </label>
                    <input
                      type="text"
                      placeholder="SE180101"
                      value={newTeamLeaderMssv}
                      onChange={(e) => setNewTeamLeaderMssv(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'GMAIL / EMAIL LEADER' : 'LEADER EMAIL'}
                    </label>
                    <input
                      type="email"
                      placeholder="alevan.se180101@fpt.edu.vn"
                      value={newTeamLeaderEmail}
                      onChange={(e) => setNewTeamLeaderEmail(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'THÀNH VIÊN KHÁC (Dấu phẩy)' : 'OTHER MEMBERS'}
                    </label>
                    <input
                      type="text"
                      placeholder="Trần Thị B, Nguyễn Văn C..."
                      value={newTeamMembers}
                      onChange={(e) => setNewTeamMembers(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>
                      {lang === 'vi' ? 'LINK GITHUB REPO' : 'GITHUB REPO'}
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/org/repo"
                      value={newTeamGit}
                      onChange={(e) => setNewTeamGit(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '3px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'var(--color-terracotta-700, #B5523A)',
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: '0.80rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'vi' ? 'Lưu Nhóm Này' : 'Save Team'}
                  </button>
                </div>
              )}

              {/* INTERACTIVE PROJECT CARDS LIST: [Lớp] [Nhóm] [Tên Dự Án] */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTeams.length === 0 ? (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                    borderRadius: '16px',
                    border: '1px dashed #CBD5E1',
                    color: 'var(--text-muted)'
                  }}>
                    {lang === 'vi' ? 'Không tìm thấy nhóm dự án nào phù hợp!' : 'No teams found!'}
                  </div>
                ) : (
                  filteredTeams.map((team) => {
                    const isExpanded = expandedTeamIds.has(team.id);
                    const membersList = team.memberDetails && team.memberDetails.length > 0
                      ? team.memberDetails
                      : team.members.map((m, mIdx) => ({
                          mssv: team.leaderMssv && mIdx === 0 ? team.leaderMssv : `SE180${mIdx + 1}01`,
                          name: m,
                          email: `${m.toLowerCase().replace(/\s+/g, '')}.se180${mIdx + 1}01@fpt.edu.vn`,
                          role: m === team.leader || mIdx === 0 ? 'Leader' : 'Member'
                        }));

                    const leaderInfo = membersList.find(m => m.role === 'Leader') || membersList[0];

                    return (
                      <div
                        key={team.id}
                        style={{
                          borderRadius: '14px',
                          border: isExpanded
                            ? '1.5px solid var(--color-terracotta-500, #D9794E)'
                            : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                          boxShadow: isExpanded
                            ? '0 6px 20px rgba(217, 121, 78, 0.12)'
                            : '0 2px 5px rgba(0, 0, 0, 0.03)',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* PROJECT CARD HEADER: [TÊN LỚP] [TÊN NHÓM] [TÊN DỰ ÁN] - CLICK TO EXPAND */}
                        <div
                          onClick={() => toggleExpandTeam(team.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            background: isExpanded
                              ? (isDark ? 'rgba(217, 121, 78, 0.10)' : '#FFF8F4')
                              : 'transparent',
                            borderBottom: isExpanded
                              ? (isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6')
                              : 'none',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <div style={{
                              color: isExpanded ? 'var(--color-terracotta-700, #B5523A)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.2s'
                            }}>
                              {isExpanded ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
                            </div>

                            {/* 1. TÊN LỚP */}
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                              color: '#2563EB',
                              border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
                              whiteSpace: 'nowrap'
                            }}>
                              {team.classCode || targetClass}
                            </span>

                            {/* 2. TÊN NHÓM */}
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '7px',
                              background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                              color: '#FFF',
                              letterSpacing: '0.5px',
                              whiteSpace: 'nowrap'
                            }}>
                              {team.teamName}
                            </span>

                            {/* 3. TÊN DỰ ÁN */}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                color: isDark ? '#FFFAF6' : 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {team.projectTopic}
                              </div>
                            </div>
                          </div>

                          {/* Quick info chips on header */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}
                          >
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--color-terracotta-800, #7A3E2E)',
                              background: 'rgba(217, 121, 78, 0.12)',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              <Crown size={12} color="#D97706" />
                              <span>{leaderInfo?.name || team.leader}</span>
                            </span>

                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              👥 {membersList.length} SV
                            </span>

                            <a
                              href={team.gitUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={team.gitUrl}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--color-terracotta-700, #B5523A)',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(217, 121, 78, 0.08)'
                              }}
                            >
                              <GitBranch size={12} />
                              <span>Git Repo</span>
                              <ExternalLink size={10} />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(team.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: team.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: team.status === 'approved' ? '#059669' : '#D97706',
                                fontWeight: 800,
                                fontSize: '0.70rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <CheckCircle size={11} />
                              <span>{team.status === 'approved' ? (lang === 'vi' ? 'Đã Duyệt' : 'Approved') : (lang === 'vi' ? 'Chờ Duyệt' : 'Pending')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTeam(team.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.7
                              }}
                              title="Xóa nhóm"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* EXPANDED DETAILS: LEADER, EMAIL/GMAIL, MEMBERS, ROLES, GIT LINK */}
                        {isExpanded && (
                          <div style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            background: isDark ? 'rgba(30, 16, 13, 0.4)' : '#FFFFFF'
                          }}>
                            {/* Project & Git Config Row */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '12px',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                              border: isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9'
                            }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  💡 Tên Đề Tài / Dự Án Đồ Án
                                </label>
                                <input
                                  type="text"
                                  value={team.projectTopic}
                                  onChange={(e) => handleUpdateTeamTopic(team.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    background: isDark ? 'var(--bg-surface)' : '#FFFFFF'
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  🐙 Link GitHub Repository (Dùng Để Chấm & Đo Đóng Góp)
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    value={team.gitUrl}
                                    onChange={(e) => handleUpdateTeamGit(team.id, e.target.value)}
                                    style={{
                                      flex: 1,
                                      padding: '7px 10px',
                                      borderRadius: '8px',
                                      border: '1px solid #CBD5E1',
                                      fontSize: '0.80rem',
                                      fontFamily: 'monospace',
                                      color: 'var(--text-main)',
                                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF'
                                    }}
                                  />
                                  <a
                                    href={team.gitUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '7px 12px',
                                      borderRadius: '8px',
                                      background: 'var(--color-terracotta-700, #B5523A)',
                                      color: '#FFF',
                                      textDecoration: 'none',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <ExternalLink size={13} />
                                    <span>Mở Git</span>
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* LEADER HERO BADGE WITH EMAIL */}
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              background: isDark ? 'rgba(217, 119, 6, 0.12)' : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                              border: '1.5px solid #F59E0B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: '#D97706',
                                  color: '#FFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)'
                                }}>
                                  <Crown size={18} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    👑 Trưởng Nhóm (Leader)
                                  </div>
                                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#78350F' }}>
                                    {leaderInfo?.name || team.leader}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: '#FFFFFF',
                                  color: '#78350F',
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  border: '1px solid #FCD34D'
                                }}>
                                  MSSV: {leaderInfo?.mssv || team.leaderMssv || 'Chưa cập nhật'}
                                </span>

                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: '#FFFFFF',
                                  color: '#78350F',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  border: '1px solid #FCD34D'
                                }}>
                                  <Mail size={12} color="#D97706" />
                                  <span>{leaderInfo?.email || `${(leaderInfo?.mssv || 'leader').toLowerCase()}@fpt.edu.vn`}</span>
                                </span>

                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: '#D97706',
                                  color: '#FFFFFF',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}>
                                  Leader
                                </span>
                              </div>
                            </div>

                            {/* MEMBERS & ROLES TABLE WITH EMAIL/GMAIL */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Users size={15} color="var(--color-terracotta-700, #B5523A)" />
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase' }}>
                                  Danh Sách Thành Viên & Email / Gmail ({membersList.length} Sinh Viên)
                                </span>
                              </div>

                              <div style={{
                                borderRadius: '12px',
                                border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                                overflow: 'hidden'
                              }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.80rem', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)', width: '36px' }}>#</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)', width: '110px' }}>MSSV</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>HỌ VÀ TÊN</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>EMAIL / GMAIL</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)', width: '130px' }}>VAI TRÒ (ROLE)</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-muted)', width: '130px' }}>TRẠNG THÁI</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {membersList.map((m, mIdx) => {
                                      const isRowLeader = m.role === 'Leader' || m.name === team.leader;
                                      return (
                                        <tr
                                          key={mIdx}
                                          style={{
                                            borderBottom: mIdx !== membersList.length - 1 ? (isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9') : 'none',
                                            background: isRowLeader ? (isDark ? 'rgba(217, 119, 6, 0.05)' : '#FFFBEB') : 'transparent'
                                          }}
                                        >
                                          <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            {mIdx + 1}
                                          </td>
                                          <td style={{ padding: '9px 12px' }}>
                                            <span style={{
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                                              fontWeight: 800,
                                              fontSize: '0.76rem',
                                              color: 'var(--text-main)',
                                              border: '1px solid #E2E8F0'
                                            }}>
                                              {m.mssv}
                                            </span>
                                          </td>
                                          <td style={{ padding: '9px 12px', fontWeight: 700, color: isDark ? '#FFFAF6' : 'var(--text-main)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              {isRowLeader && <Crown size={13} color="#D97706" />}
                                              <span>{m.name}</span>
                                            </div>
                                          </td>
                                          <td style={{ padding: '9px 12px' }}>
                                            <a
                                              href={`mailto:${m.email}`}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                color: 'var(--color-terracotta-700, #B5523A)',
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.78rem'
                                              }}
                                            >
                                              <Mail size={12} color="var(--color-terracotta-600, #D9794E)" />
                                              <span>{m.email}</span>
                                            </a>
                                          </td>
                                          <td style={{ padding: '9px 12px' }}>
                                            <span style={{
                                              padding: '3px 9px',
                                              borderRadius: '12px',
                                              fontSize: '0.70rem',
                                              fontWeight: 800,
                                              background: isRowLeader ? '#FEF3C7' : 'rgba(217, 121, 78, 0.1)',
                                              color: isRowLeader ? '#92400E' : 'var(--color-terracotta-700, #B5523A)',
                                              border: isRowLeader ? '1px solid #FCD34D' : '1px solid rgba(217, 121, 78, 0.2)'
                                            }}>
                                              {isRowLeader ? '👑 Leader (Trưởng Nhóm)' : 'Thành Viên (Member)'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '9px 12px' }}>
                                            <span style={{
                                              fontSize: '0.70rem',
                                              fontWeight: 700,
                                              color: '#059669',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}>
                                              <Check size={11} />
                                              <span>Sẵn sàng chấm Git</span>
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{
            padding: '14px 26px',
            borderTop: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
            background: isDark ? 'var(--bg-surface-subtle)' : '#FAFAFA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'vi'
                ? `Đang cấu hình ${teams.length} nhóm đồ án cho lớp ${targetClass} (Hạn nộp: ${deadline})`
                : `Configuring ${teams.length} teams for class ${targetClass} (Deadline: ${deadline})`}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                  background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                  color: 'var(--text-body)',
                  fontWeight: 700,
                  fontSize: '0.80rem',
                  cursor: 'pointer'
                }}
              >
                {lang === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </button>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(181, 82, 58, 0.35)'
                }}
              >
                <FolderGit2 size={16} />
                <span>{lang === 'vi' ? 'Lưu & Giao Đồ Án Cho Các Nhóm' : 'Save & Assign Team Projects'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
