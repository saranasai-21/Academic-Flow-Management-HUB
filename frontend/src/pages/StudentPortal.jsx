import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  MessageSquare,
  Phone,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Upload,
  User
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { apiUrl } from '../config/api';
import './Portal.css';
import Chatbot from '../components/Chatbot';

const schoolInfo = {
  name: 'ABC High School',
  motto: 'Learn Today, Lead Tomorrow',
  principal: 'Dr. Rajesh Kumar',
  established: '2005',
  totalStudents: 1200,
  totalTeachers: 65
};

const StudentPortal = ({ section = 'dashboard', user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = section || location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
  const [student, setStudent] = useState(null);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [materialsData, setMaterialsData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  const [attendancePortal, setAttendancePortal] = useState({ records: [], summary: {} });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Sick Leave', fromDate: '', toDate: '', reason: '', attachment: '' });
  const [assignmentForm, setAssignmentForm] = useState({ submittedFile: '', answer: '', notes: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'UPI' });
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendanceFilters, setAttendanceFilters] = useState({
    month: 'All',
    subject: 'All',
    status: 'All',
    fromDate: '',
    toDate: ''
  });
  const [resultFilters, setResultFilters] = useState({
    subject: 'All',
    examType: 'All',
    date: '',
    status: 'All'
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [assignmentFilters, setAssignmentFilters] = useState({
    subject: 'All',
    status: 'All',
    dueDate: '',
    teacher: 'All'
  });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [materialFilters, setMaterialFilters] = useState({
    search: '',
    subject: 'All',
    type: 'All',
    teacher: 'All',
    sort: 'Recent'
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [notificationFilters, setNotificationFilters] = useState({
    category: 'All',
    status: 'All',
    search: ''
  });
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const loadStudentPanel = async () => {
      try {
        setLoading(true);
        
        // Fetch the first student (represents the logged-in student)
        const studentsRes = await fetch(apiUrl(`/students?search=${encodeURIComponent(user?.email || '')}`));
        const studentsData = studentsRes.ok ? await studentsRes.json() : [];
        const currentStudent = studentsData[0] || null;
        
        if (!currentStudent) {
          console.warn('No student data available');
          setStudent(null);
          setLoading(false);
          return;
        }
        
        console.log('✅ Student loaded:', currentStudent.name, currentStudent.grade, currentStudent.section);
        setStudent(currentStudent);
        
        // Fetch exams filtered by student's grade
        const examsUrl = apiUrl(`/exams?grade=${encodeURIComponent(currentStudent.grade)}`);
        const examsRes = await fetch(examsUrl);
        const examsData = examsRes.ok ? await examsRes.json() : [];
        console.log('✅ Exams loaded:', examsData.length, 'for grade', currentStudent.grade);
        setExams(examsData);
        
        // Fetch attendance data for the student
        const attendanceRes = await fetch(apiUrl(`/attendance?student=${currentStudent._id}`));
        const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { records: [], summary: {} };
        setAttendancePortal(attendanceData);
        console.log('✅ Attendance loaded:', attendanceData.length);
        
        // Fetch notices
        const noticesRes = await fetch(apiUrl('/notices'));
        const noticesData = noticesRes.ok ? await noticesRes.json() : [];
        console.log('✅ Notices loaded:', noticesData.length);
        setNotices(noticesData);
        
        // Fetch assignments filtered by student's grade and section
        const assignmentsUrl = apiUrl(`/assignments?grade=${encodeURIComponent(currentStudent.grade)}&section=${encodeURIComponent(currentStudent.section)}`);
        const assignmentsRes = await fetch(assignmentsUrl);
        const assignmentsApiData = assignmentsRes.ok ? await assignmentsRes.json() : [];
        console.log('✅ Assignments loaded:', assignmentsApiData.length);
        setAssignmentsData(assignmentsApiData);
        if (assignmentsApiData.length > 0) {
          setSelectedAssignment(assignmentsApiData[0]);
        }
        
        // Fetch materials filtered by student's grade
        const materialsUrl = apiUrl(`/materials?grade=${encodeURIComponent(currentStudent.grade)}`);
        const materialsRes = await fetch(materialsUrl);
        const materialsApiData = materialsRes.ok ? await materialsRes.json() : [];
        console.log('✅ Materials loaded:', materialsApiData.length);
        setMaterialsData(materialsApiData);
        if (materialsApiData.length > 0) {
          setSelectedMaterial(materialsApiData[0]);
        }
        
        // Fetch notifications
        const notificationsRes = await fetch(apiUrl('/notifications'));
        const notificationsApiData = notificationsRes.ok ? await notificationsRes.json() : [];
        console.log('✅ Notifications loaded:', notificationsApiData.length);
        setNotificationsData(notificationsApiData);

        const portalRes = await fetch(apiUrl(`/student-portal?studentId=${currentStudent._id}`));
        if (portalRes.ok) {
          const portalData = await portalRes.json();
          setAttendancePortal(portalData.attendance || { records: [], summary: {} });
          setLeaveRequests(portalData.leaveRequests || []);
        }
        
      } catch (error) {
        console.error('❌ Error loading student panel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentPanel();
  }, [user?.email]);

  const upcomingExams = useMemo(() => {
    if (!student) return exams.slice(0, 4);
    return exams.filter(exam => exam.grade === student.grade).slice(0, 4);
  }, [exams, student]);

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="spinner"></div>
        <p>Loading student portal...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="portal-empty glass-panel">
        <h2>No student profile found</h2>
        <p>Add a student from Admin panel to show Student portal data.</p>
      </div>
    );
  }

  const recentMarks = [...(student.grades || [])].slice(-5).reverse();
  const feeBalance = student.finance?.outstandingBalance ?? ((student.finance?.totalFees || 0) - (student.finance?.feesPaid || 0));
  const activeAssignments = assignmentsData;
  const activeMaterials = materialsData;
  const activeNotifications = notificationsData.length > 0 ? notificationsData : buildNotificationItems(notices);
  const currentAssignment = selectedAssignment || activeAssignments[0];
  const currentMaterial = selectedMaterial || activeMaterials[0];
  const totalSubjects = new Set((student.grades || []).map(grade => grade.subject)).size || activeMaterials.length;
  const pendingAssignments = activeAssignments.filter(item => item.status === 'Pending').length;
  const latestGrade = recentMarks[0]?.grade || '-';
  const marksData = (student.grades || []).slice(-6).map(item => ({
    subject: item.subject,
    marks: Number(item.marks) || 0
  }));
  const completedResults = buildCompletedResults(student);
  const filteredResults = completedResults.filter(result => {
    const subjectMatch = resultFilters.subject === 'All' || result.subject === resultFilters.subject;
    const examMatch = resultFilters.examType === 'All' || result.examType === resultFilters.examType;
    const dateMatch = !resultFilters.date || result.date === resultFilters.date;
    const statusMatch = resultFilters.status === 'All' || result.resultStatus === resultFilters.status;
    return subjectMatch && examMatch && dateMatch && statusMatch;
  });
  const activeResult = selectedResult || completedResults[0];
  const resultSubjects = Array.from(new Set(completedResults.map(result => result.subject)));
  const progressTrend = completedResults.map((result, index) => ({
    exam: `Exam ${index + 1}`,
    marks: result.marks
  }));
  const examCalendarDays = buildExamCalendar(upcomingExams);
  const averageScore = completedResults.length
    ? Math.round(completedResults.reduce((sum, result) => sum + result.marks, 0) / completedResults.length)
    : student.percentage || 0;
  const attendanceSummary = attendancePortal.summary || {};
  const attendanceRate = attendanceSummary.totalDays ? attendanceSummary.rate : (student.attendance?.rate || 0);
  const attendancePie = [
    { name: 'Present', value: attendanceRate },
    { name: 'Absent', value: Math.max(100 - attendanceRate, 0) }
  ];
  const lateDays = attendanceSummary.lateDays || 0;
  const totalWorkingDays = attendanceSummary.totalDays || student.attendance?.totalDays || 0;
  const presentDays = attendanceSummary.totalDays ? attendanceSummary.presentDays : (student.attendance?.presentDays || 0);
  const calculatedAbsentDays = Math.max(totalWorkingDays - presentDays - lateDays, 0);
  const detailedAttendance = attendancePortal.records?.length
    ? attendancePortal.records.map(record => ({
        ...record,
        day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        month: new Date(record.date).toLocaleDateString('en-US', { month: 'short' })
      }))
    : buildAttendanceRecords(student);
  const subjectAttendance = buildSubjectAttendance(detailedAttendance);
  const monthlyAttendanceData = buildMonthlyAttendance(detailedAttendance);
  const calendarDays = buildAttendanceCalendar(detailedAttendance);
  const filteredAttendance = detailedAttendance.filter(record => {
    const monthMatch = attendanceFilters.month === 'All' || record.month === attendanceFilters.month;
    const subjectMatch = attendanceFilters.subject === 'All' || record.subject === attendanceFilters.subject;
    const statusMatch = attendanceFilters.status === 'All' || record.status === attendanceFilters.status;
    const fromMatch = !attendanceFilters.fromDate || new Date(record.date) >= new Date(attendanceFilters.fromDate);
    const toMatch = !attendanceFilters.toDate || new Date(record.date) <= new Date(attendanceFilters.toDate);
    return monthMatch && subjectMatch && statusMatch && fromMatch && toMatch;
  });
  const absentDates = detailedAttendance.filter(record => record.status === 'Absent').map(record => formatDate(record.date));
  const dashboardNotices = notices.slice(0, 4).map(notice => notice.title);
  const absentDays = Math.max((student.attendance?.totalDays || 0) - (student.attendance?.presentDays || 0), 0);
  const sortedMarks = [...(student.grades || [])].sort((a, b) => (b.marks || 0) - (a.marks || 0));
  const bestSubject = sortedMarks[0]?.subject || 'Mathematics';
  const weakSubject = sortedMarks[sortedMarks.length - 1]?.subject || 'English';
  const admissionNumber = student.admissionNumber || student.registerNumber || 'ADM2026001';
  const admissionDate = student.admissionDate || student.enrollmentDate || student.createdAt;
  const profileCompletion = calculateProfileCompletion(student);
  const idPayload = `${student.name}|${student.rollNumber}|${student.grade}-${student.section}|${student.phone}|${student.email}`;
  const studentProfile = {
    bloodGroup: student.bloodGroup || 'B+',
    aadhaar: student.aadhaarNumber || 'XXXX-XXXX-2048',
    nationality: student.nationality || 'Indian',
    academicYear: '2026-2027',
    previousClass: 'Previous Grade Completed',
    house: 'Blue House',
    medium: 'English',
    rank: student.rank || 5,
    fatherName: student.parent?.fatherName || student.guardian?.name || 'Rajesh Kumar',
    fatherPhone: student.parent?.phone || student.guardian?.phone || student.phone,
    fatherOccupation: student.parent?.occupation || 'Business',
    motherName: student.parent?.motherName || 'Lakshmi Devi',
    motherPhone: student.parent?.motherPhone || student.guardian?.phone || student.phone,
    motherOccupation: student.parent?.motherOccupation || 'Teacher',
    emergencyContact: student.parent?.emergencyContact || student.guardian?.phone || student.phone,
    permanentAddress: student.permanentAddress || student.address,
    allergies: 'No known allergies',
    medicalConditions: 'None',
    emergencyNotes: 'Contact parent immediately for medical support.'
  };
  const summaryCards = [
    { title: 'Attendance', value: `${attendanceRate}%`, status: attendanceRate >= 85 ? 'Good' : 'Needs focus', icon: CalendarDays },
    { title: 'Total Subjects', value: totalSubjects, status: 'Active subjects', icon: BookOpen },
    { title: 'Upcoming Exams', value: upcomingExams.length, status: upcomingExams.length > 0 ? 'Scheduled' : 'No exams', icon: Award },
    { title: 'Assignments', value: activeAssignments.length, status: `${pendingAssignments} Pending`, icon: ClipboardList },
    { title: 'Fees', value: feeBalance > 0 ? 'Pending' : 'Paid', status: feeBalance > 0 ? `${feeBalance.toLocaleString()} INR due` : 'No pending', icon: CreditCard },
    { title: 'Latest Grade', value: latestGrade, status: recentMarks[0]?.subject || 'No marks', icon: FileText }
  ];
  const assignmentStats = {
    total: activeAssignments.length,
    submitted: activeAssignments.filter(item => ['Submitted', 'Checked', 'Late Submitted'].includes(item.status)).length,
    pending: activeAssignments.filter(item => item.status === 'Pending').length,
    overdue: activeAssignments.filter(item => item.status === 'Overdue').length
  };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueTomorrowCount = activeAssignments.filter(item => new Date(item.due).toDateString() === tomorrow.toDateString()).length;
  const checkedAssignmentCount = activeAssignments.filter(item => item.status === 'Checked').length;
  const newAssignmentCount = activeAssignments.filter(item => item.status === 'Pending').length;
  const assignmentSubjects = Array.from(new Set(activeAssignments.map(item => item.subject)));
  const assignmentTeachers = Array.from(new Set(activeAssignments.map(item => item.teacher)));
  const filteredAssignments = activeAssignments.filter(item => {
    const subjectMatch = assignmentFilters.subject === 'All' || item.subject === assignmentFilters.subject;
    const statusMatch = assignmentFilters.status === 'All' || item.status === assignmentFilters.status;
    const teacherMatch = assignmentFilters.teacher === 'All' || item.teacher === assignmentFilters.teacher;
    const dueMatch = !assignmentFilters.dueDate || item.due === assignmentFilters.dueDate;
    return subjectMatch && statusMatch && teacherMatch && dueMatch;
  });
  const assignmentCalendarDays = buildAssignmentCalendar(activeAssignments);
  const assignmentProgress = [
    { name: 'Submitted', value: assignmentStats.submitted },
    { name: 'Pending', value: assignmentStats.pending },
    { name: 'Overdue', value: assignmentStats.overdue }
  ];
  const materialSubjects = Array.from(new Set(activeMaterials.map(item => item.subject)));
  const materialTeachers = Array.from(new Set(activeMaterials.map(item => item.uploadedBy)));
  const filteredMaterials = activeMaterials
    .filter(item => {
      const query = materialFilters.search.toLowerCase();
      const searchMatch = !query || item.title.toLowerCase().includes(query) || item.subject.toLowerCase().includes(query);
      const subjectMatch = materialFilters.subject === 'All' || item.subject === materialFilters.subject;
      const typeMatch = materialFilters.type === 'All' || item.type === materialFilters.type;
      const teacherMatch = materialFilters.teacher === 'All' || item.uploadedBy === materialFilters.teacher;
      return searchMatch && subjectMatch && typeMatch && teacherMatch;
    })
    .sort((a, b) => {
      if (materialFilters.sort === 'Most Viewed') return b.views - a.views;
      if (materialFilters.sort === 'Most Downloaded') return b.downloads - a.downloads;
      return new Date(b.uploadDate) - new Date(a.uploadDate);
    });
  const materialStats = {
    total: 250,
    subjects: 8,
    videos: 120,
    pdfs: 95,
    notes: 35
  };
  const completedPercent = activeMaterials.length ? Math.round((activeMaterials.filter(item => item.completed).length / activeMaterials.length) * 100) : 0;
  const videoPercent = 80;
  const pdfPercent = 55;
  const recentMaterials = activeMaterials.filter(item => {
    const uploadTime = new Date(item.uploadDate).getTime();
    const now = new Date('2026-06-12').getTime();
    return now - uploadTime <= 7 * 24 * 60 * 60 * 1000;
  }).slice(0, 4);
  const favoriteMaterials = activeMaterials.filter(item => item.rating >= 5 || item.bookmarked).slice(0, 4);
  const totalFees = student.finance?.totalFees || 50000;
  const paidFees = student.finance?.feesPaid || 35000;
  const pendingFees = Math.max(totalFees - paidFees, 0);
  const paymentProgress = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;
  const feeStatus = pendingFees === 0 ? 'Paid' : paidFees > 0 ? 'Partially Paid' : 'Pending';
  const feeStructure = [
    ['Tuition Fee', 25000],
    ['Library Fee', 5000],
    ['Transport Fee', 10000],
    ['Lab Fee', 5000],
    ['Exam Fee', 5000]
  ];
  const feeDistribution = [
    { name: 'Paid', value: paidFees },
    { name: 'Pending', value: pendingFees }
  ];
  const monthlyPaymentTrend = buildMonthlyPaymentTrend(student.finance?.paymentHistory || []);
  const notificationItems = normalizeNotifications(activeNotifications);
  const activeNotification = selectedNotification || notificationItems[0];
  const filteredNotifications = notificationItems.filter(item => {
    const search = notificationFilters.search.toLowerCase();
    const searchMatch = !search || item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search) || item.sender.toLowerCase().includes(search);
    const categoryMatch = notificationFilters.category === 'All' || item.category === notificationFilters.category;
    const statusMatch = notificationFilters.status === 'All'
      || (notificationFilters.status === 'Unread' && !item.read)
      || (notificationFilters.status === 'Read' && item.read)
      || (notificationFilters.status === 'Important' && item.important);
    return searchMatch && categoryMatch && statusMatch;
  });
  const notificationStats = {
    total: 125,
    unread: notificationItems.filter(item => !item.read).length,
    important: notificationItems.filter(item => item.important).length,
    today: notificationItems.filter(item => item.group === 'Today').length
  };

  const pageTitle = {
    dashboard: 'Student Dashboard',
    profile: 'My Profile',
    attendance: 'Attendance Report',
    results: 'Exams & Results',
    assignments: 'Assignments',
    materials: 'Study Materials',
    fees: 'Fee Details',
    notifications: 'Notifications'
  }[activeSection] || 'Student Dashboard';

  const refreshAssignments = async () => {
    const response = await fetch(apiUrl(`/assignments?grade=${encodeURIComponent(student.grade)}&section=${encodeURIComponent(student.section)}`));
    if (response.ok) {
      const data = await response.json();
      setAssignmentsData(data);
      setSelectedAssignment(data.find(item => item._id === currentAssignment?._id) || data[0] || null);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!currentAssignment?._id) return;
    const response = await fetch(apiUrl(`/assignments/${currentAssignment._id}/submit`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submittedFile: assignmentForm.submittedFile || 'student-upload.pdf',
        answer: assignmentForm.answer,
        notes: assignmentForm.notes
      })
    });
    if (response.ok) {
      setActionMessage('Assignment submitted successfully.');
      setAssignmentForm({ submittedFile: '', answer: '', notes: '' });
      refreshAssignments();
    }
  };

  const refreshPortalData = async () => {
    const response = await fetch(apiUrl(`/student-portal?studentId=${student._id}`));
    if (!response.ok) return;
    const data = await response.json();
    setStudent(data.student);
    setAttendancePortal(data.attendance || { records: [], summary: {} });
    setLeaveRequests(data.leaveRequests || []);
    setMaterialsData(data.materials || []);
  };

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(apiUrl(`/student-portal/${student._id}/leaves`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveForm)
    });
    const data = await response.json();
    setActionMessage(response.ok ? 'Leave request submitted.' : data.message);
    if (response.ok) {
      setLeaveForm({ leaveType: 'Sick Leave', fromDate: '', toDate: '', reason: '', attachment: '' });
      refreshPortalData();
    }
  };

  const handleFeePayment = async () => {
    const response = await fetch(apiUrl(`/student-portal/${student._id}/payments`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentForm)
    });
    const data = await response.json();
    setActionMessage(response.ok ? 'Fee payment recorded successfully.' : data.message);
    if (response.ok) {
      setPaymentForm(prev => ({ ...prev, amount: '' }));
      refreshPortalData();
    }
  };

  const handleMaterialActivity = async (action) => {
    if (!currentMaterial?._id) return;
    const response = await fetch(apiUrl(`/materials/${currentMaterial._id}/activity`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, studentId: student._id })
    });
    if (response.ok) {
      const updated = await response.json();
      setMaterialsData(items => items.map(item => item._id === updated._id ? updated : item));
      setSelectedMaterial(updated);
      setActionMessage(`Material ${action} updated.`);
    }
  };

  const refreshNotifications = async () => {
    const response = await fetch(apiUrl('/notifications'));
    if (response.ok) setNotificationsData(await response.json());
  };

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId || notificationId.startsWith('notice-')) return;
    const response = await fetch(apiUrl(`/notifications/${notificationId}/read`), { method: 'PUT' });
    if (response.ok) refreshNotifications();
  };

  const handleMarkAllNotificationsRead = async () => {
    const response = await fetch(apiUrl('/notifications/read-all'), { method: 'PUT' });
    if (response.ok) refreshNotifications();
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>Welcome back, {student.name}. Track academics, attendance, fees and school updates.</p>
        </div>
      </header>
      {actionMessage && <div className="glass-panel portal-action-message">{actionMessage}</div>}

      {activeSection === 'dashboard' && (
        <div className="student-dashboard">
          <div className="student-summary-grid">
            {summaryCards.map(card => (
              <PortalStat key={card.title} icon={card.icon} label={card.title} value={card.value} status={card.status} />
            ))}
          </div>

          <div className="student-dashboard-layout">
            <aside className="student-left-column">
              <section className="student-profile-card glass-panel">
                <div className="student-avatar-large">{student.name.slice(0, 2).toUpperCase()}</div>
                <h2>{student.name}</h2>
                <p>{student.grade} - Section {student.section}</p>
                <span>{student.rollNumber}</span>
              </section>

              <Panel title="Attendance" icon={CalendarDays} compact>
                <div className="attendance-ring">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={attendancePie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="attendance-ring-label">
                    <strong>{attendanceRate}%</strong>
                    <span>Present</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Quick Actions" icon={ClipboardList} compact>
                <div className="quick-action-list">
                  <button className="btn btn-secondary" onClick={() => navigate('/student/results')}><Download size={16} /> Report Card</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/student/attendance')}><CalendarDays size={16} /> Attendance</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/student/assignments')}><ClipboardList size={16} /> Assignment</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/student/fees')}><CreditCard size={16} /> Fee Receipt</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/student/notifications')}><MessageSquare size={16} /> Contact Teacher</button>
                </div>
              </Panel>
            </aside>

            <main className="student-middle-column">
              <Panel title="Marks Performance" icon={Award}>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={marksData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="marks" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Monthly Attendance" icon={CalendarDays}>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={monthlyAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Legend />
                      <Bar dataKey="present" fill="#22c55e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Upcoming Exams" icon={Award}>
                <div className="exam-card-list">
                  {(upcomingExams.length > 0 ? upcomingExams : exams.slice(0, 3)).map((exam, index) => (
                    <div key={exam._id || index} className="exam-card-row">
                      <div>
                        <strong>{exam.name}</strong>
                        <span>{exam.subject}</span>
                      </div>
                      <div>
                        <span>{new Date(exam.date).toLocaleDateString()}</span>
                        <small>10:00 AM</small>
                      </div>
                      <b>Scheduled</b>
                    </div>
                  ))}
                  {upcomingExams.length === 0 && exams.length === 0 && <p>No upcoming exams.</p>}
                </div>
              </Panel>
            </main>

            <aside className="student-right-column">
              <Panel title="Assignments" icon={ClipboardList} compact>
                <div className="assignment-list">
                  {activeAssignments.map(item => (
                    <div key={item.title} className={`assignment-row ${item.status.toLowerCase()}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.subject} - Due {new Date(item.due).toLocaleDateString()}</span>
                      </div>
                      <b>{item.status}</b>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Notice Board" icon={Bell} compact>
                <SimpleList items={dashboardNotices} empty="No notices." />
              </Panel>

              <Panel title="About School" icon={BookOpen} compact>
                <ProfileRows rows={[
                  ['School', schoolInfo.name],
                  ['Motto', schoolInfo.motto],
                  ['Principal', schoolInfo.principal],
                  ['Established', schoolInfo.established],
                  ['Students', schoolInfo.totalStudents],
                  ['Teachers', schoolInfo.totalTeachers]
                ]} />
              </Panel>

              <Panel title="Fee Status" icon={CreditCard} compact>
                <div className={`fee-status-box ${feeBalance > 0 ? 'pending' : 'paid'}`}>
                  <strong>{feeBalance > 0 ? 'Pending' : 'Paid'}</strong>
                  <span>{feeBalance > 0 ? `${feeBalance.toLocaleString()} INR due` : 'No pending balance'}</span>
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      )}

      {activeSection === 'profile' && (
        <div className="student-profile-module">
          <section className="digital-profile-header glass-panel">
            <div className="digital-photo">{student.name.slice(0, 2).toUpperCase()}</div>
            <div className="digital-profile-main">
              <span className={`badge ${student.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{student.status}</span>
              <h2>{student.name}</h2>
              <div className="profile-header-grid">
                <span>Roll No: <strong>{student.rollNumber}</strong></span>
                <span>Class: <strong>{student.grade}-{student.section}</strong></span>
                <span>Admission No: <strong>{admissionNumber}</strong></span>
                <span>Academic Year: <strong>{studentProfile.academicYear}</strong></span>
              </div>
            </div>
            <div className="profile-completion-card">
              <strong>{profileCompletion}%</strong>
              <span>Profile Completion</span>
              <div className="completion-track"><i style={{ width: `${profileCompletion}%` }}></i></div>
            </div>
          </section>

          <div className="student-profile-layout">
            <main className="profile-main-column">
              <Panel title="Personal Information" icon={User}>
                <ProfileRows rows={[
                  ['Full Name', student.name],
                  ['Date of Birth', formatDate(student.dateOfBirth)],
                  ['Gender', student.gender],
                  ['Blood Group', studentProfile.bloodGroup],
                  ['Aadhaar Number', studentProfile.aadhaar],
                  ['Nationality', studentProfile.nationality],
                  ['Address', student.address]
                ]} />
              </Panel>

              <Panel title="Contact Information" icon={Phone}>
                <ProfileRows rows={[
                  ['Mobile Number', student.phone],
                  ['Email', student.email],
                  ['Emergency Contact', studentProfile.emergencyContact],
                  ['Current Address', student.address],
                  ['Permanent Address', studentProfile.permanentAddress]
                ]} />
              </Panel>

              <Panel title="Parent Information" icon={User}>
                <div className="profile-subgrid">
                  <ProfileMiniCard title="Father Details" rows={[
                    ['Name', studentProfile.fatherName],
                    ['Mobile', studentProfile.fatherPhone],
                    ['Occupation', studentProfile.fatherOccupation]
                  ]} />
                  <ProfileMiniCard title="Mother Details" rows={[
                    ['Name', studentProfile.motherName],
                    ['Mobile', studentProfile.motherPhone],
                    ['Occupation', studentProfile.motherOccupation]
                  ]} />
                  <ProfileMiniCard title="Guardian Details" rows={[
                    ['Name', student.guardian?.name || '-'],
                    ['Relationship', student.guardian?.relationship || '-'],
                    ['Phone', student.guardian?.phone || '-']
                  ]} />
                </div>
              </Panel>

              <Panel title="Academic Information" icon={BookOpen}>
                <ProfileRows rows={[
                  ['Admission Date', formatDate(admissionDate)],
                  ['Current Class', student.grade],
                  ['Section', student.section],
                  ['Previous Class Grade', studentProfile.previousClass],
                  ['House / Group', studentProfile.house],
                  ['Medium', studentProfile.medium]
                ]} />
              </Panel>

              <div className="profile-analytics-grid">
                <Panel title="Academic Performance" icon={Award} compact>
                  <ProfileRows rows={[
                    ['Overall Percentage', `${student.percentage || 0}%`],
                    ['Current Rank', studentProfile.rank],
                    ['Best Subject', bestSubject],
                    ['Weak Subject', weakSubject]
                  ]} />
                </Panel>
                <Panel title="Attendance Overview" icon={CalendarDays} compact>
                  <ProfileRows rows={[
                    ['Present Days', `${student.attendance?.presentDays || 0} Days`],
                    ['Absent Days', `${absentDays} Days`],
                    ['Attendance', `${student.attendance?.rate || 0}%`]
                  ]} />
                </Panel>
              </div>

              <Panel title="Activity Timeline" icon={CalendarDays}>
                <div className="activity-timeline">
                  {[
                    ['10 Jun 2026', 'Attendance Marked'],
                    ['08 Jun 2026', 'Maths Assignment Submitted'],
                    ['05 Jun 2026', 'Exam Completed'],
                    ['01 Jun 2026', feeBalance > 0 ? 'Fee Reminder Generated' : 'Fee Paid']
                  ].map(([date, text]) => (
                    <div key={`${date}-${text}`}><span>{date}</span><strong>{text}</strong></div>
                  ))}
                </div>
              </Panel>
            </main>

            <aside className="profile-side-column">
              <Panel title="Digital Student ID" icon={ShieldCheck} compact>
                <div className="student-id-card">
                  <div className="id-card-top">
                    <div className="id-card-photo">{student.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{student.name}</strong>
                      <span>{student.grade} - {student.section}</span>
                    </div>
                  </div>
                  <QrCodeMatrix value={idPayload} />
                  <ProfileRows rows={[
                    ['Roll No', student.rollNumber],
                    ['Admission No', admissionNumber],
                    ['Contact', student.phone]
                  ]} />
                </div>
              </Panel>

              <Panel title="Skills & Interests" icon={Trophy} compact>
                <ChipList items={['Sports', 'Drawing', 'Coding', 'Singing', 'Dance', 'Leadership']} />
              </Panel>

              <Panel title="Achievements" icon={Award} compact>
                <ChipList items={['Quiz Winner', 'Sports Champion', 'School Topper', 'Science Fair Winner']} strong />
              </Panel>

              <Panel title="Document Vault" icon={FileText} compact>
                <DocumentRows docs={['Birth Certificate', 'Transfer Certificate', 'Aadhaar Copy', 'Report Cards']} />
              </Panel>

              <Panel title="Medical Information" icon={ShieldCheck} compact>
                <ProfileRows rows={[
                  ['Blood Group', studentProfile.bloodGroup],
                  ['Allergies', studentProfile.allergies],
                  ['Medical Conditions', studentProfile.medicalConditions],
                  ['Emergency Notes', studentProfile.emergencyNotes]
                ]} />
              </Panel>

              <Panel title="Fee Summary" icon={CreditCard} compact>
                <ProfileRows rows={[
                  ['Total Fees', `${(student.finance?.totalFees || 0).toLocaleString()} INR`],
                  ['Paid', `${(student.finance?.feesPaid || 0).toLocaleString()} INR`],
                  ['Pending', `${feeBalance.toLocaleString()} INR`]
                ]} />
              </Panel>
            </aside>
          </div>
        </div>
      )}

      {activeSection === 'attendance' && (
        <div className="attendance-module">
          <div className="attendance-summary-grid">
            <PortalStat icon={CalendarDays} label="Working Days" value={totalWorkingDays} status="Academic year" />
            <PortalStat icon={CheckCircle2} label="Present Days" value={presentDays} status="Marked present" />
            <PortalStat icon={Bell} label="Absent Days" value={calculatedAbsentDays} status="Needs attention" />
            <PortalStat icon={CalendarDays} label="Late Days" value={lateDays} status="Late entries" />
            <PortalStat icon={Award} label="Attendance" value={`${attendanceRate}%`} status={attendanceRate >= 75 ? 'Eligible' : 'Below required'} />
          </div>

          {attendanceRate < 75 && (
            <div className="low-attendance-alert glass-panel">
              <Bell size={20} />
              <span>Your attendance is below 75%. Please attend classes regularly.</span>
            </div>
          )}

          <div className="attendance-middle-grid">
            <Panel title="Monthly Attendance Chart" icon={CalendarDays}>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Legend />
                    <Bar dataKey="present" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Attendance Calendar View" icon={CalendarDays}>
              <div className="attendance-calendar">
                <div className="calendar-weekdays">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
                </div>
                <div className="calendar-grid">
                  {calendarDays.map((day, index) => (
                    <div key={`${day.date}-${index}`} className={`calendar-cell ${day.status.toLowerCase()}`}>
                      <span>{day.date}</span>
                    </div>
                  ))}
                </div>
                <div className="calendar-legend">
                  <span><i className="present"></i>Present</span>
                  <span><i className="absent"></i>Absent</span>
                  <span><i className="late"></i>Late</span>
                  <span><i className="holiday"></i>Holiday</span>
                </div>
              </div>
            </Panel>
          </div>

          <div className="attendance-bottom-grid">
            <Panel title="Subject-wise Attendance" icon={BookOpen}>
              <div className="subject-attendance-list">
                {subjectAttendance.map(item => (
                  <div key={item.subject}>
                    <div>
                      <strong>{item.subject}</strong>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="subject-progress"><i style={{ width: `${item.percentage}%` }}></i></div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Leave Request" icon={FileText}>
              <form className="leave-request-form" onSubmit={handleLeaveSubmit}>
                <select className="form-input" value={leaveForm.leaveType} onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}>
                  <option>Sick Leave</option>
                  <option>Family Function</option>
                  <option>Medical Appointment</option>
                  <option>Other</option>
                </select>
                <input className="form-input" type="date" value={leaveForm.fromDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, fromDate: e.target.value }))} required />
                <input className="form-input" type="date" value={leaveForm.toDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, toDate: e.target.value }))} required />
                <textarea className="form-input" rows="3" placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} required></textarea>
                <input className="form-input" type="file" onChange={(e) => setLeaveForm(prev => ({ ...prev, attachment: e.target.files?.[0]?.name || '' }))} />
                <button type="submit" className="btn btn-primary">Apply Leave</button>
              </form>
              <DataRows rows={leaveRequests.map(item => [item.leaveType, formatDate(item.fromDate), item.status])} />
            </Panel>

            <Panel title="Parent View" icon={User}>
              <ProfileRows rows={[
                ['Attendance Percentage', `${attendanceRate}%`],
                ['Absent Dates', absentDates.slice(0, 3).join(', ') || 'None'],
                ['Leave Status', `${leaveRequests.filter(item => item.status === 'Pending').length} Pending, ${leaveRequests.filter(item => item.status === 'Approved').length} Approved`]
              ]} />
            </Panel>
          </div>

          <Panel title="Attendance Records" icon={FileText}>
            <div className="attendance-tools">
              <select className="form-input" value={attendanceFilters.month} onChange={(e) => setAttendanceFilters(prev => ({ ...prev, month: e.target.value }))}>
                <option value="All">All Months</option>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => <option key={month} value={month}>{month}</option>)}
              </select>
              <select className="form-input" value={attendanceFilters.subject} onChange={(e) => setAttendanceFilters(prev => ({ ...prev, subject: e.target.value }))}>
                <option value="All">All Subjects</option>
                {subjectAttendance.map(item => <option key={item.subject} value={item.subject}>{item.subject}</option>)}
              </select>
              <select className="form-input" value={attendanceFilters.status} onChange={(e) => setAttendanceFilters(prev => ({ ...prev, status: e.target.value }))}>
                <option value="All">All Status</option>
                {['Present', 'Absent', 'Late', 'Holiday'].map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <input className="form-input" type="date" value={attendanceFilters.fromDate} onChange={(e) => setAttendanceFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
              <input className="form-input" type="date" value={attendanceFilters.toDate} onChange={(e) => setAttendanceFilters(prev => ({ ...prev, toDate: e.target.value }))} />
            </div>
            <div className="attendance-download-actions">
              <button className="btn btn-secondary" type="button"><Download size={16} /> Monthly PDF</button>
              <button className="btn btn-secondary" type="button"><Download size={16} /> Export Excel</button>
            </div>
            <div className="attendance-record-table">
              <div className="attendance-record-head">
                <span>Date</span><span>Day</span><span>Status</span><span>Subject</span><span>Teacher</span><span>Remarks</span>
              </div>
              {filteredAttendance.map(record => (
                <div key={`${record.date}-${record.subject}`} className="attendance-record-row">
                  <span>{formatDate(record.date)}</span>
                  <span>{record.day}</span>
                  <span className={`attendance-status-pill ${record.status.toLowerCase()}`}>{record.status}</span>
                  <span>{record.subject}</span>
                  <span>{record.teacher}</span>
                  <span>{record.remarks}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeSection === 'results' && (
        <div className="results-module">
          <div className="results-summary-grid">
            <PortalStat icon={Award} label="Upcoming Exams" value={upcomingExams.length || 4} status="Scheduled" />
            <PortalStat icon={CheckCircle2} label="Completed Exams" value={completedResults.length} status="Published results" />
            <PortalStat icon={BookOpen} label="Average Score" value={`${averageScore}%`} status="Overall" />
            <PortalStat icon={Trophy} label="Current Rank" value={studentProfile.rank} status="Class rank" />
          </div>

          <div className="result-alert-row">
            <div className="glass-panel"><Bell size={17} /> New exam scheduled for this month</div>
            <div className="glass-panel"><CheckCircle2 size={17} /> Result published for latest unit test</div>
            <div className="glass-panel warning"><Award size={17} /> Low marks improvement alert for weak subject</div>
          </div>

          <div className="results-middle-grid">
            <Panel title="Upcoming Exams" icon={Award}>
              <div className="exam-schedule-table">
                <div className="exam-schedule-head">
                  <span>Exam Name</span><span>Subject</span><span>Date</span><span>Time</span><span>Duration</span><span>Syllabus</span><span>Status</span>
                </div>
                {(upcomingExams.length > 0 ? upcomingExams : buildFallbackExams()).map((exam, index) => (
                  <div key={exam._id || index} className="exam-schedule-row">
                    <span>{exam.name}</span>
                    <span>{exam.subject}</span>
                    <span>{formatDate(exam.date)}</span>
                    <span>{exam.time || '10:00 AM'}</span>
                    <span>{exam.duration || '2 Hours'}</span>
                    <span>{exam.syllabus || 'Algebra and core chapters'}</span>
                    <span className="exam-status upcoming">Upcoming</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Exam Timetable Calendar" icon={CalendarDays}>
              <div className="exam-calendar">
                <div className="calendar-weekdays">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
                </div>
                <div className="calendar-grid">
                  {examCalendarDays.map((day, index) => (
                    <div key={`${day.date}-${index}`} className={`calendar-cell ${day.hasExam ? 'exam-day' : 'neutral'}`}>
                      <span>{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="results-chart-grid">
            <Panel title="Subject-wise Performance" icon={Award}>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={marksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="subject" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="marks" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Progress Trend" icon={TrendingUp}>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={progressTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="exam" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="marks" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title="Completed Exams & Results" icon={FileText}>
            <div className="result-filter-bar">
              <select className="form-input" value={resultFilters.subject} onChange={(e) => setResultFilters(prev => ({ ...prev, subject: e.target.value }))}>
                <option value="All">All Subjects</option>
                {resultSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <select className="form-input" value={resultFilters.examType} onChange={(e) => setResultFilters(prev => ({ ...prev, examType: e.target.value }))}>
                <option value="All">All Exam Types</option>
                <option value="Unit Test">Unit Test</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final">Final</option>
              </select>
              <input className="form-input" type="date" value={resultFilters.date} onChange={(e) => setResultFilters(prev => ({ ...prev, date: e.target.value }))} />
              <select className="form-input" value={resultFilters.status} onChange={(e) => setResultFilters(prev => ({ ...prev, status: e.target.value }))}>
                <option value="All">All Result Status</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div className="completed-results-table">
              <div className="completed-results-head">
                <span>Exam Name</span><span>Subject</span><span>Marks</span><span>Grade</span><span>Rank</span><span>Status</span>
              </div>
              {filteredResults.map(result => (
                <button key={`${result.examName}-${result.subject}`} type="button" className="completed-results-row" onClick={() => setSelectedResult(result)}>
                  <span>{result.examName}</span>
                  <span>{result.subject}</span>
                  <span>{result.marks}/100</span>
                  <span>{result.grade}</span>
                  <span>{result.rank}</span>
                  <span className={`result-status ${result.resultStatus.toLowerCase()}`}>{result.resultStatus}</span>
                </button>
              ))}
            </div>
          </Panel>

          {activeResult && (
            <div className="result-detail-grid">
              <Panel title="Result Details" icon={Award}>
                <ProfileRows rows={[
                  ['Total Marks', activeResult.totalMarks],
                  ['Obtained Marks', activeResult.marks],
                  ['Percentage', `${activeResult.marks}%`],
                  ['Grade', activeResult.grade],
                  ['Rank', activeResult.rank],
                  ['Result', activeResult.resultStatus],
                  ['Teacher Remarks', activeResult.remarks]
                ]} />
                <div className="report-actions">
                  <button className="btn btn-secondary"><Download size={16} /> PDF Report Card</button>
                  <button className="btn btn-secondary">Print Result</button>
                  <button className="btn btn-primary">Share Parent Email</button>
                </div>
              </Panel>

              <Panel title="Answer Sheet / Feedback" icon={FileText}>
                <div className="feedback-table">
                  <div><span>Question</span><span>Your Answer</span><span>Correct Answer</span><span>Marks</span><span>Teacher Feedback</span></div>
                  {buildFeedbackRows(activeResult.subject).map(row => (
                    <div key={row.question}>
                      <span>{row.question}</span><span>{row.answer}</span><span>{row.correct}</span><span>{row.marks}</span><span>{row.feedback}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}

      {activeSection === 'assignments' && (
        <div className="assignment-module">
          <div className="assignment-summary-grid">
            <PortalStat icon={ClipboardList} label="Total Assignments" value={assignmentStats.total} status="This term" />
            <PortalStat icon={CheckCircle2} label="Submitted" value={assignmentStats.submitted} status="Uploaded" />
            <PortalStat icon={Bell} label="Pending" value={assignmentStats.pending} status="Need action" />
            <PortalStat icon={CalendarDays} label="Overdue" value={assignmentStats.overdue} status="Past due date" />
          </div>

          <div className="assignment-alert-row">
            <div className="glass-panel warning"><Bell size={17} /> {dueTomorrowCount} due tomorrow</div>
            <div className="glass-panel danger"><Bell size={17} /> {assignmentStats.overdue} overdue</div>
            <div className="glass-panel"><CheckCircle2 size={17} /> {checkedAssignmentCount} checked</div>
            <div className="glass-panel"><ClipboardList size={17} /> {newAssignmentCount} awaiting submission</div>
          </div>

          <div className="assignment-layout">
            <main className="assignment-main-column">
              <Panel title="Assignment List" icon={ClipboardList}>
                <div className="assignment-filter-bar">
                  <select className="form-input" value={assignmentFilters.subject} onChange={(e) => setAssignmentFilters(prev => ({ ...prev, subject: e.target.value }))}>
                    <option value="All">All Subjects</option>
                    {assignmentSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <select className="form-input" value={assignmentFilters.status} onChange={(e) => setAssignmentFilters(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="All">All Status</option>
                    {['Pending', 'Submitted', 'Late Submitted', 'Checked', 'Rejected', 'Overdue'].map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <input className="form-input" type="date" value={assignmentFilters.dueDate} onChange={(e) => setAssignmentFilters(prev => ({ ...prev, dueDate: e.target.value }))} />
                  <select className="form-input" value={assignmentFilters.teacher} onChange={(e) => setAssignmentFilters(prev => ({ ...prev, teacher: e.target.value }))}>
                    <option value="All">All Teachers</option>
                    {assignmentTeachers.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
                  </select>
                </div>
                <div className="assignment-table">
                  <div className="assignment-table-head">
                    <span>Title</span><span>Subject</span><span>Teacher</span><span>Due Date</span><span>Status</span><span>Marks</span>
                  </div>
                  {filteredAssignments.map(item => (
                    <button key={item.title} type="button" className="assignment-table-row" onClick={() => setSelectedAssignment(item)}>
                      <span>{item.title}</span>
                      <span>{item.subject}</span>
                      <span>{item.teacher}</span>
                      <span>{formatDate(item.due)}</span>
                      <span className={`assignment-status-pill ${normalizeStatusClass(item.status)}`}>{item.status}</span>
                      <span>{item.marks === '-' ? '-' : `${item.marks}/${item.totalMarks}`}</span>
                    </button>
                  ))}
                  {filteredAssignments.length === 0 && <div className="portal-empty-state">No assignments found from backend.</div>}
                </div>
              </Panel>

              <div className="assignment-bottom-grid">
                <Panel title="Checked Assignments & Feedback" icon={Award}>
                  <DataRows rows={activeAssignments.filter(item => item.status === 'Checked' || item.status === 'Late Submitted').map(item => [
                    item.title,
                    `${item.marks}/${item.totalMarks}`,
                    item.gradeLetter || item.grade || '-',
                    item.feedback,
                    item.checkedDate ? formatDate(item.checkedDate) : '-'
                  ])} />
                </Panel>

                <Panel title="Assignment Progress Chart" icon={TrendingUp}>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={assignmentProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
            </main>

            <aside className="assignment-side-column">
              {currentAssignment ? <>
              <Panel title="Assignment Details" icon={FileText} compact>
                <ProfileRows rows={[
                  ['Title', currentAssignment.title],
                  ['Subject', currentAssignment.subject],
                  ['Teacher', currentAssignment.teacher],
                  ['Due Date', formatDate(currentAssignment.due)],
                  ['Total Marks', currentAssignment.totalMarks],
                  ['Attachment', currentAssignment.attachment]
                ]} />
                <p className="portal-muted">{currentAssignment.description}</p>
                <p className="portal-muted"><strong>Instructions:</strong> {currentAssignment.instructions}</p>
                <div className="assignment-downloads">
                  <button className="btn btn-secondary"><Download size={16} /> Question PDF</button>
                  <button className="btn btn-secondary"><Download size={16} /> Submitted File</button>
                  <button className="btn btn-secondary"><Download size={16} /> Feedback Report</button>
                </div>
              </Panel>

              <Panel title="Submit Assignment" icon={Upload} compact>
                <form className="assignment-submit-form">
                  <input className="form-input" type="file" onChange={(e) => setAssignmentForm(prev => ({ ...prev, submittedFile: e.target.files?.[0]?.name || '' }))} />
                  <textarea className="form-input" rows="4" placeholder="Write answer" value={assignmentForm.answer} onChange={(e) => setAssignmentForm(prev => ({ ...prev, answer: e.target.value }))}></textarea>
                  <textarea className="form-input" rows="3" placeholder="Add notes" value={assignmentForm.notes} onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}></textarea>
                  <button type="button" className="btn btn-primary" onClick={handleAssignmentSubmit}>Submit Assignment</button>
                </form>
              </Panel>

              <Panel title="Due Date Calendar" icon={CalendarDays} compact>
                <div className="assignment-calendar">
                  <div className="calendar-weekdays">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}
                  </div>
                  <div className="calendar-grid">
                    {assignmentCalendarDays.map((day, index) => (
                      <div key={`${day.date}-${index}`} className={`calendar-cell ${day.hasDue ? 'assignment-due' : 'neutral'}`}>
                        <span>{day.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="Marks & Feedback" icon={Award} compact>
                <ProfileRows rows={[
                  ['Marks', currentAssignment.marks === '-' ? '-' : `${currentAssignment.marks}/${currentAssignment.totalMarks}`],
                  ['Grade', currentAssignment.gradeLetter || currentAssignment.grade || '-'],
                  ['Feedback', currentAssignment.feedback || 'Waiting for teacher review'],
                  ['Checked Date', currentAssignment.checkedDate ? formatDate(currentAssignment.checkedDate) : '-']
                ]} />
              </Panel>
              </> : <Panel title="Assignment Details" icon={FileText} compact>
                <p className="portal-muted">Select an assignment after it is added from the teacher/admin backend.</p>
              </Panel>}
            </aside>
          </div>
        </div>
      )}

      {activeSection === 'materials' && (
        <div className="materials-module">
          <div className="materials-summary-grid">
            <PortalStat icon={BookOpen} label="Total Materials" value={materialStats.total} status="Learning resources" />
            <PortalStat icon={ClipboardList} label="Subjects" value={materialStats.subjects} status="Categories" />
            <PortalStat icon={PlayCircle} label="Videos" value={materialStats.videos} status="Watch lessons" />
            <PortalStat icon={FileText} label="PDFs" value={materialStats.pdfs} status="Downloadable" />
            <PortalStat icon={BookOpen} label="Notes" value={materialStats.notes} status="Quick revision" />
          </div>

          <div className="materials-layout">
            <aside className="materials-left-sidebar">
              <Panel title="Subjects" icon={BookOpen} compact>
                <div className="subject-category-list">
                  {[
                    ['Maths', 'Mathematics'],
                    ['Science', 'Science'],
                    ['English', 'English'],
                    ['Social', 'Social'],
                    ['Computer Science', 'Computer Science']
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={materialFilters.subject === value ? 'active' : ''} onClick={() => setMaterialFilters(prev => ({ ...prev, subject: value }))}>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Saved Materials" icon={Star} compact>
                <SimpleList items={favoriteMaterials.map(item => item.title)} empty="No saved materials." />
              </Panel>

              <Panel title="Recent Materials" icon={CalendarDays} compact>
                <SimpleList items={recentMaterials.map(item => item.title)} empty="No recent uploads." />
              </Panel>
            </aside>

            <main className="materials-center">
              <section className="materials-search-panel glass-panel">
                <div className="material-search-input">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search material by title or subject..."
                    value={materialFilters.search}
                    onChange={(e) => setMaterialFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <select className="form-input" value={materialFilters.subject} onChange={(e) => setMaterialFilters(prev => ({ ...prev, subject: e.target.value }))}>
                  <option value="All">All Subjects</option>
                  {materialSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                </select>
                <select className="form-input" value={materialFilters.type} onChange={(e) => setMaterialFilters(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="All">All Types</option>
                  {['PDF', 'Video', 'Notes', 'E-Book'].map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <select className="form-input" value={materialFilters.teacher} onChange={(e) => setMaterialFilters(prev => ({ ...prev, teacher: e.target.value }))}>
                  <option value="All">All Teachers</option>
                  {materialTeachers.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
                </select>
                <select className="form-input" value={materialFilters.sort} onChange={(e) => setMaterialFilters(prev => ({ ...prev, sort: e.target.value }))}>
                  <option value="Recent">Recent Uploads</option>
                  <option value="Most Viewed">Most Viewed</option>
                  <option value="Most Downloaded">Most Downloaded</option>
                </select>
              </section>

              <div className="material-grid">
                {filteredMaterials.map(item => (
                  <button key={item.title} type="button" className="material-card glass-card" onClick={() => setSelectedMaterial(item)}>
                    <div className={`material-type-icon ${normalizeStatusClass(item.type)}`}>
                      {item.type === 'Video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="material-card-body">
                      <span>{item.subject}</span>
                      <h3>{item.title}</h3>
                      <p>{item.type} by {item.uploadedBy}</p>
                      <small>{formatDate(item.uploadDate)} - {item.views} Views - {item.downloads} Downloads</small>
                    </div>
                    <div className="material-rating">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                  </button>
                ))}
              </div>

              <Panel title="Material Details & Discussion" icon={MessageSquare}>
                <div className="material-detail-grid">
                  <div>
                    <h3>{currentMaterial.title}</h3>
                    <p>{currentMaterial.subject} - {currentMaterial.type} - Uploaded by {currentMaterial.uploadedBy}</p>
                    <div className="material-action-row">
                  <button className="btn btn-primary" type="button" onClick={() => handleMaterialActivity('view')}>
                    {currentMaterial.type === 'Video' ? <><PlayCircle size={16} /> Watch Video</> : `Open ${currentMaterial.type}`}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => handleMaterialActivity('download')}><Download size={16} /> Download</button>
                  <button className="btn btn-secondary" type="button" onClick={() => handleMaterialActivity('complete')}><CheckCircle2 size={16} /> Mark Complete</button>
                  <button className="btn btn-secondary" type="button" onClick={() => handleMaterialActivity('bookmark')}><Star size={16} /> {currentMaterial.bookmarked ? 'Unsave' : 'Save'}</button>
                    </div>
                  </div>
                  <div className="discussion-box">
                    <strong>Discussion</strong>
                    <p>Student: Can you explain this topic again?</p>
                    <p>Teacher: Please watch the second example and ask doubts in class.</p>
                    <input className="form-input" placeholder="Ask question..." />
                  </div>
                </div>
              </Panel>
            </main>

            <aside className="materials-right-sidebar">
              <Panel title="Learning Progress" icon={TrendingUp} compact>
                <ProgressRows rows={[
                  ['Materials Completed', completedPercent],
                  ['Videos Watched', videoPercent],
                  ['PDFs Read', pdfPercent]
                ]} />
              </Panel>

              <Panel title="AI Recommended" icon={Award} compact>
                <SimpleList items={['Recommended: Algebra Fundamentals', 'Recommended: English Grammar Basics']} empty="No recommendations." />
              </Panel>

              <Panel title="Learning Streak" icon={Trophy} compact>
                <div className="learning-streak">
                  <strong>12 Days</strong>
                  <span>Current Streak</span>
                </div>
              </Panel>

              <Panel title="Popular Resources" icon={Star} compact>
                <SimpleList items={activeMaterials.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 4).map(item => `${item.title} - ${item.downloads} downloads`)} empty="No popular resources." />
              </Panel>

              <Panel title="Download History" icon={Download} compact>
                <DataRows rows={[
                  ['Algebra Basics', '10 Jun 2026'],
                  ['Geometry Formula Sheet', '09 Jun 2026'],
                  ['Python Loops Tutorial', '08 Jun 2026']
                ]} />
              </Panel>

              <Panel title="Certificates & Resources" icon={Trophy} compact>
                <SimpleList items={['Olympiad Materials', 'Scholarship Materials', 'Competitive Exam Resources']} />
              </Panel>
            </aside>
          </div>
        </div>
      )}

      {activeSection === 'fees' && (
        <div className="fees-module">
          <div className="fees-summary-grid">
            <PortalStat icon={CreditCard} label="Total Fees" value={`${totalFees.toLocaleString()} INR`} status="Academic year" />
            <PortalStat icon={CheckCircle2} label="Paid Amount" value={`${paidFees.toLocaleString()} INR`} status="Received" />
            <PortalStat icon={Bell} label="Pending Amount" value={`${pendingFees.toLocaleString()} INR`} status="Balance due" />
            <PortalStat icon={CalendarDays} label="Next Due Date" value="30 Jun" status="2026" />
          </div>

          <div className="fees-layout">
            <aside className="fees-left-column">
              <Panel title="Fee Structure" icon={FileText}>
                <div className="fee-structure-table">
                  {feeStructure.map(([type, amount]) => (
                    <div key={type}><span>{type}</span><strong>{amount.toLocaleString()} INR</strong></div>
                  ))}
                </div>
              </Panel>

              <Panel title="Upcoming Dues" icon={CalendarDays}>
                <div className="upcoming-dues-card">
                  <strong>Installment 2</strong>
                  <span>Amount: 5,000 INR</span>
                  <span>Due Date: 30 Jun 2026</span>
                  <b>Pending</b>
                </div>
              </Panel>

              <Panel title="Fee Timeline" icon={TrendingUp}>
                <div className="fee-timeline">
                  {[
                    ['Admission Fee Paid', 'done'],
                    ['Term 1 Fee Paid', 'done'],
                    ['Term 2 Fee Pending', 'pending'],
                    ['Final Fee Pending', 'pending']
                  ].map(([label, state]) => (
                    <div key={label} className={state}><i></i><span>{label}</span></div>
                  ))}
                </div>
              </Panel>
            </aside>

            <main className="fees-center-column">
              <Panel title="Payment History" icon={CreditCard}>
                <div className="payment-history-table">
                  <div className="payment-history-head">
                    <span>Receipt No</span><span>Date</span><span>Amount</span><span>Mode</span><span>Status</span>
                  </div>
                  {(student.finance?.paymentHistory?.length ? student.finance.paymentHistory : [
                    { amount: 10000, date: '2026-06-01', paymentMethod: 'UPI', status: 'Success' },
                    { amount: 15000, date: '2026-06-15', paymentMethod: 'Card', status: 'Success' }
                  ]).map((item, index) => (
                    <div key={`${item.date}-${index}`} className="payment-history-row">
                      <span>REC{String(index + 1).padStart(3, '0')}</span>
                      <span>{formatDate(item.date)}</span>
                      <span>{Number(item.amount).toLocaleString()} INR</span>
                      <span>{item.paymentMethod}</span>
                      <span className="payment-success">{item.status === 'Paid' ? 'Success' : item.status}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Payment Methods" icon={CreditCard}>
                <div className="payment-method-grid">
                  {['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Cash (Admin Entry)'].map(method => (
                    <button key={method} type="button" className={paymentForm.paymentMethod === method ? 'active' : ''} onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method }))}>{method}</button>
                  ))}
                </div>
                <div className="fee-payment-form">
                  <input className="form-input" type="number" min="1" max={pendingFees || undefined} placeholder="Enter amount" value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))} />
                  <button className="btn btn-primary" type="button" disabled={!pendingFees || !paymentForm.amount} onClick={handleFeePayment}>Pay Fee</button>
                </div>
              </Panel>

              <Panel title="Download Receipts" icon={Download}>
                <div className="receipt-actions">
                  <button className="btn btn-secondary"><Download size={16} /> PDF Receipt</button>
                  <button className="btn btn-secondary"><Download size={16} /> Fee Statement</button>
                  <button className="btn btn-secondary"><Download size={16} /> Annual Fee Report</button>
                </div>
              </Panel>
            </main>

            <aside className="fees-right-column">
              <Panel title="Fee Status" icon={ShieldCheck} compact>
                <div className={`fee-status-dashboard ${pendingFees > 0 ? 'partial' : 'complete'}`}>
                  <strong>{feeStatus}</strong>
                  <span>Academic Year: 2026-27</span>
                  <div className="completion-track"><i style={{ width: `${paymentProgress}%` }}></i></div>
                  <small>Payment Progress: {paymentProgress}%</small>
                </div>
              </Panel>

              <Panel title="Fee Notifications" icon={Bell} compact>
                <SimpleList items={['Fee Due in 5 Days', 'Payment Successful', 'Pending Fee Reminder']} />
              </Panel>

              <Panel title="Scholarship" icon={Award} compact>
                <ProfileRows rows={[
                  ['Scholarship Type', 'Merit Scholarship'],
                  ['Discount', '20%'],
                  ['Applied Amount', '10,000 INR']
                ]} />
              </Panel>

              <Panel title="Fine / Penalty" icon={Bell} compact>
                <ProfileRows rows={[
                  ['Late Fee Fine', '500 INR'],
                  ['Reason', 'Payment after due date']
                ]} />
              </Panel>

              <Panel title="Parent Fee View" icon={User} compact>
                <ProfileRows rows={[
                  ['Total Fees', `${totalFees.toLocaleString()} INR`],
                  ['Pending Fees', `${pendingFees.toLocaleString()} INR`],
                  ['Due Date', '30 Jun 2026'],
                  ['Receipts', `${student.finance?.paymentHistory?.length || 2} Available`]
                ]} />
              </Panel>
            </aside>
          </div>

          <div className="fees-bottom-grid">
            <Panel title="Paid vs Pending Analytics" icon={Award}>
              <div className="fee-analytics-grid">
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={feeDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="fee-distribution-table">
                  {feeDistribution.map(item => (
                    <div key={item.name}>
                      <span>{item.name}</span>
                      <strong>{item.value.toLocaleString()} INR</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Monthly Payment Trend" icon={TrendingUp}>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyPaymentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Support" icon={MessageSquare}>
              <div className="support-card">
                <strong>Need Help?</strong>
                <span>Contact Accounts Department</span>
                <span>Email: accounts@school.com</span>
                <span>Phone: +91 XXXXX XXXXX</span>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="notifications-module">
          <div className="announcement-banner glass-panel">
            <span>Mid-Term Exams Start From 20 June 2026</span>
          </div>

          <div className="notification-summary-grid">
            <PortalStat icon={Bell} label="Total Notifications" value={notificationStats.total} status="All updates" />
            <PortalStat icon={MessageSquare} label="Unread" value={notificationStats.unread} status="Needs attention" />
            <PortalStat icon={Star} label="Important" value={notificationStats.important} status="Pinned priority" />
            <PortalStat icon={CalendarDays} label="Today" value={notificationStats.today} status="New today" />
          </div>

          <div className="notifications-layout">
            <aside className="notifications-left">
              <Panel title="Categories" icon={ClipboardList} compact>
                <div className="notification-category-list">
                  {['All', 'Academic', 'Fees', 'School', 'Teacher Messages', 'Achievement'].map(category => (
                    <button key={category} className={notificationFilters.category === category ? 'active' : ''} onClick={() => setNotificationFilters(prev => ({ ...prev, category }))}>
                      {category}
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Filters" icon={Search} compact>
                <div className="notification-category-list">
                  {['All', 'Unread', 'Read', 'Important'].map(status => (
                    <button key={status} className={notificationFilters.status === status ? 'active' : ''} onClick={() => setNotificationFilters(prev => ({ ...prev, status }))}>
                      {status}
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Preferences" icon={Bell} compact>
                <div className="notification-preferences">
                  {['Assignment Alerts', 'Exam Alerts', 'Fee Alerts', 'School Notices', 'Teacher Messages'].map(item => (
                    <label key={item}><input type="checkbox" defaultChecked /> <span>{item}</span></label>
                  ))}
                </div>
              </Panel>
            </aside>

            <main className="notifications-center">
              <section className="notification-search-panel glass-panel">
                <div className="material-search-input">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by title, keyword or sender..."
                    value={notificationFilters.search}
                    onChange={(e) => setNotificationFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <button className="btn btn-secondary" onClick={handleMarkAllNotificationsRead}>Mark All as Read</button>
              </section>

              <div className="realtime-strip">
                <span>New Assignment Added</span>
                <span>Result Published</span>
                <span>Teacher Message</span>
                <b>{notificationStats.unread}</b>
              </div>

              <div className="notification-feed">
                {['Today', 'Yesterday', 'This Week', 'This Month', 'Older'].map(group => {
                  const groupItems = filteredNotifications.filter(item => item.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <section key={group}>
                      <h3>{group}</h3>
                      {groupItems.map(item => (
                        <button key={item.id} type="button" className={`notification-feed-item ${item.read ? 'read' : 'unread'} ${item.important ? 'important' : ''}`} onClick={() => { setSelectedNotification(item); handleMarkNotificationRead(item.id); }}>
                          <div className="notification-icon">{item.icon}</div>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.timeAgo}</span>
                            <p>{item.description}</p>
                            <small>Priority: {item.priority}</small>
                          </div>
                        </button>
                      ))}
                    </section>
                  );
                })}
              </div>
            </main>

            <aside className="notifications-right">
              <Panel title="Notification Details" icon={FileText} compact>
                {activeNotification && (
                  <div className="notification-detail-card">
                    <h3>{activeNotification.title}</h3>
                    <p>{activeNotification.description}</p>
                    <ProfileRows rows={[
                      ['Sender', activeNotification.sender],
                      ['Date & Time', activeNotification.dateTime],
                      ['Attachment', activeNotification.attachment || 'None'],
                      ['Priority', activeNotification.priority]
                    ]} />
                    <div className="notification-actions">
                      <button className="btn btn-primary">{activeNotification.action}</button>
                      <button className="btn btn-secondary" onClick={() => handleMarkNotificationRead(activeNotification.id)}>Mark as Read</button>
                      {activeNotification.attachment && <button className="btn btn-secondary"><Download size={16} /> Attachment</button>}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel title="Important Notices" icon={Star} compact>
                <SimpleList items={notificationItems.filter(item => item.important).map(item => item.title)} />
              </Panel>

              <Panel title="Upcoming Events" icon={CalendarDays} compact>
                <SimpleList items={['School Reopens on June 20', 'Sports Day Practice', 'Cultural Program Auditions']} />
              </Panel>

              <Panel title="Achievement Alerts" icon={Trophy} compact>
                <div className="achievement-alerts">
                  <div><strong>Congratulations!</strong><span>You secured Rank 3 in Mathematics Test.</span></div>
                  <div><strong>Attendance Badge Earned</strong><span>95% Attendance Achieved.</span></div>
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      )}
      <Chatbot user={user} role="student" />
    </div>
  );
};

const PortalStat = ({ icon: Icon, label, value, status }) => (
  <div className="portal-stat-card glass-card">
    <Icon size={22} />
    <span>{label}</span>
    <strong>{value}</strong>
    {status && <small>{status}</small>}
  </div>
);

const Panel = ({ title, icon: Icon, children, compact = false }) => (
  <section className={`portal-panel glass-panel ${compact ? 'compact' : ''}`}>
    <h2><Icon size={18} /> {title}</h2>
    {children}
  </section>
);

const SimpleList = ({ items, empty }) => (
  <div className="portal-list">
    {items.length === 0 ? <p>{empty}</p> : items.map((item, index) => <div key={index}><CheckCircle2 size={15} /> <span>{item}</span></div>)}
  </div>
);

const DataRows = ({ rows, empty }) => (
  <div className="portal-data-rows">
    {rows.length === 0 ? <p>{empty}</p> : rows.map((row, index) => (
      <div key={index}>{row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}</div>
    ))}
  </div>
);

const ProfileRows = ({ rows }) => (
  <div className="portal-profile-rows">
    {rows.map(([label, value]) => (
      <div key={label}>
        <span>{label}</span>
        <strong>{value || '-'}</strong>
      </div>
    ))}
  </div>
);

const ProfileMiniCard = ({ title, rows }) => (
  <div className="profile-mini-card">
    <h3>{title}</h3>
    <ProfileRows rows={rows} />
  </div>
);

const ChipList = ({ items, strong = false }) => (
  <div className={`chip-list ${strong ? 'strong' : ''}`}>
    {items.map(item => <span key={item}>{item}</span>)}
  </div>
);

const DocumentRows = ({ docs }) => (
  <div className="document-list">
    {docs.map(doc => (
      <div key={doc}>
        <span>{doc}</span>
        <div>
          <button type="button">View</button>
          <button type="button">Download</button>
        </div>
      </div>
    ))}
  </div>
);

const ProgressRows = ({ rows }) => (
  <div className="learning-progress-list">
    {rows.map(([label, value]) => (
      <div key={label}>
        <div><span>{label}</span><strong>{value}%</strong></div>
        <div className="subject-progress"><i style={{ width: `${value}%` }}></i></div>
      </div>
    ))}
  </div>
);

const QrCodeMatrix = ({ value }) => {
  const cells = Array.from({ length: 121 }, (_, index) => {
    const code = value.charCodeAt(index % value.length) || 0;
    return ((code + index * 7 + Math.floor(index / 3)) % 5) < 2;
  });

  return (
    <div className="qr-matrix" aria-label="Student QR verification code">
      {cells.map((active, index) => <i key={index} className={active ? 'active' : ''}></i>)}
    </div>
  );
};

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleDateString();
};

const calculateProfileCompletion = (student) => {
  const fields = [
    student.name,
    student.email,
    student.phone,
    student.dateOfBirth,
    student.gender,
    student.address,
    student.rollNumber,
    student.registerNumber,
    student.grade,
    student.section,
    student.guardian?.name,
    student.guardian?.phone,
    student.finance,
    student.attendance,
    student.grades?.length
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
};

const buildAttendanceRecords = (student) => {
  // Use student's actual attendance data if available
  if (student && student.attendance && student.attendance.records) {
    return student.attendance.records.map(record => ({
      date: record.date || new Date().toISOString().split('T')[0],
      day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }),
      month: new Date(record.date).toLocaleDateString('en-US', { month: 'short' }),
      status: record.status || 'Present',
      subject: record.subject || 'Class',
      teacher: record.teacher || 'Teacher',
      remarks: record.remarks || (record.status === 'Present' ? 'On time' : record.status === 'Late' ? 'Arrived late' : 'Absent - No leave applied')
    }));
  }

  return [];
};

const buildSubjectAttendance = (records) => {
  const grouped = records.reduce((acc, record) => {
    const subject = record.subject || 'General';
    acc[subject] = acc[subject] || { total: 0, present: 0 };
    acc[subject].total += 1;
    if (record.status === 'Present' || record.status === 'Late') acc[subject].present += 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([subject, value]) => ({
    subject,
    percentage: value.total ? Math.round((value.present / value.total) * 100) : 0
  }));
};

const buildMonthlyAttendance = (records) => {
  if (!records.length) return [];
  const months = records.reduce((acc, record) => {
    const month = record.month || new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = acc[month] || { month, present: 0, absent: 0, late: 0 };
    const key = record.status?.toLowerCase();
    if (key in acc[month]) acc[month][key] += 1;
    return acc;
  }, {});
  return Object.values(months);
};

const buildAttendanceCalendar = (records = []) => {
  if (records.length) {
    return records.slice(0, 30).map(record => ({ date: new Date(record.date).getDate(), status: record.status }));
  }
  return [];
};

const buildCompletedResults = (student) => {
  if (!student || !student.grades || !student.grades.length) {
    return [];
  }

  return student.grades.map((grade, index) => {
    const marks = Number(grade.marks) || 0;
    return {
      examName: grade.term || `Test ${index + 1}`,
      examType: grade.term?.includes('Mid') ? 'Mid Term' : grade.term?.includes('Final') ? 'Final' : 'Unit Test',
      subject: grade.subject,
      date: grade.date || new Date().toISOString().split('T')[0],
      marks: marks,
      totalMarks: grade.totalMarks || 100,
      grade: grade.grade || getGradeLetter(marks),
      gpa: grade.gpa || marks,
      rank: grade.rank || index + 1,
      resultStatus: marks >= 35 ? 'Pass' : 'Fail',
      remarks: marks >= 85 ? 'Excellent performance. Keep it up.' : marks >= 60 ? 'Good work with room to improve.' : 'Needs focused revision and practice.'
    };
  });
};

const buildFallbackExams = () => [
  { name: 'Mid Term', subject: 'Maths', date: '2026-06-20', time: '10:00 AM', duration: '2 Hours', syllabus: 'Algebra', status: 'Upcoming' },
  { name: 'Mid Term', subject: 'Science', date: '2026-06-22', time: '10:00 AM', duration: '2 Hours', syllabus: 'Physics basics', status: 'Upcoming' },
  { name: 'Mid Term', subject: 'English', date: '2026-06-24', time: '10:00 AM', duration: '2 Hours', syllabus: 'Grammar and writing', status: 'Upcoming' }
];

const buildExamCalendar = (upcomingExams) => {
  const examDates = new Set((upcomingExams.length > 0 ? upcomingExams : buildFallbackExams()).map(exam => new Date(exam.date).getDate()));
  return Array.from({ length: 30 }, (_, index) => ({
    date: index + 1,
    hasExam: examDates.has(index + 1)
  }));
};

const buildAssignmentCalendar = (assignmentList) => {
  const dueDates = new Set(assignmentList.map(item => new Date(item.due).getDate()));
  return Array.from({ length: 30 }, (_, index) => ({
    date: index + 1,
    hasDue: dueDates.has(index + 1)
  }));
};

const buildMonthlyPaymentTrend = (paymentHistory) => {
  // If no payment history, generate last 6 months of dummy data
  if (!paymentHistory || !paymentHistory.length) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, idx) => ({
      month,
      amount: [10000, 10000, 0, 10000, 10000, 15000][idx]
    }));
  }

  // Group payments by month
  const totals = {};
  paymentHistory.forEach(item => {
    if (item.date && item.amount) {
      const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
      totals[month] = (totals[month] || 0) + Number(item.amount);
    }
  });

  return Object.entries(totals).map(([month, amount]) => ({ month, amount: Number(amount) })).slice(-6);
};

const buildNotificationItems = (notices = []) => {
  // Convert all notices from backend to notification items
  if (!notices || !notices.length) {
    return [];
  }

  const categoryIcons = {
    'Academic': '📚',
    'Fee': '💰',
    'School': '🏫',
    'Achievement': '🏆',
    'Event': '🎉',
    'Holiday': '🎖️'
  };

  return notices.map((notice, index) => {
    const createdAt = new Date(notice.date || notice.createdAt || Date.now());
    const ageMs = Date.now() - createdAt.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    let group = 'Older';
    if (ageMs < dayMs) group = 'Today';
    else if (ageMs < dayMs * 2) group = 'Yesterday';
    else if (ageMs < dayMs * 7) group = 'This Week';
    else if (ageMs < dayMs * 31) group = 'This Month';

    return {
      id: `notice-${notice._id || index}`,
      icon: categoryIcons[notice.category] || '🏫',
      title: notice.title || 'School Notice',
      description: notice.content || notice.description || 'Important school announcement',
      sender: notice.sender || 'School Admin',
      dateTime: createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeAgo: group,
      category: notice.category || 'School',
      priority: index === 0 ? 'High' : 'Medium',
      important: index < 2,
      read: notice.read || index > 0,
      group,
      attachment: notice.attachment || '',
      action: 'Read Notice'
    };
  });
};

const normalizeNotifications = (items = []) => items.map((item, index) => {
  const createdAt = item.createdAt || item.dateTime || new Date().toISOString();
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const group = item.group || (
    ageMs < dayMs ? 'Today' :
    ageMs < dayMs * 2 ? 'Yesterday' :
    ageMs < dayMs * 7 ? 'This Week' :
    ageMs < dayMs * 31 ? 'This Month' :
    'Older'
  );

  return {
    id: item._id || item.id || `notification-${index}`,
    icon: item.icon || '📢',
    title: item.title,
    description: item.description || item.content || 'School update',
    sender: item.sender || 'School Admin',
    dateTime: item.dateTime || new Date(createdAt).toLocaleString(),
    timeAgo: item.timeAgo || (
      ageMs < 60 * 60 * 1000 ? 'Just now' :
      ageMs < dayMs ? `${Math.max(1, Math.floor(ageMs / (60 * 60 * 1000)))} hours ago` :
      `${Math.max(1, Math.floor(ageMs / dayMs))} days ago`
    ),
    category: item.category || 'School',
    priority: item.priority || 'Medium',
    important: Boolean(item.important),
    read: Boolean(item.read),
    group,
    attachment: item.attachment || '',
    action: item.action || 'Read Notice'
  };
});

const normalizeStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const buildFeedbackRows = (subject) => [
  { question: 'Q1', answer: 'Correct method', correct: 'Correct method', marks: '5/5', feedback: `Strong basics in ${subject}.` },
  { question: 'Q2', answer: 'Partial steps', correct: 'Complete solution', marks: '3/5', feedback: 'Show all steps clearly.' },
  { question: 'Q3', answer: 'Missed keyword', correct: 'Include definition', marks: '2/5', feedback: 'Revise key terms.' },
  { question: 'Q4', answer: 'Correct', correct: 'Correct', marks: '5/5', feedback: 'Well answered.' }
];

const getGradeLetter = (marks) => {
  const score = Number(marks) || 0;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

export default StudentPortal;
