import { useEffect, useState } from 'react';
import {
  Award, Bell, BookOpen, CalendarCheck, CheckCircle2, ClipboardList,
  FileText, MessageSquare, Plus, Search, TrendingUp, Upload, User, Users
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiUrl } from '../config/api';
import './Portal.css';
import Chatbot from '../components/Chatbot';

const emptyAssignment = { title: '', grade: '', section: 'A', due: '', totalMarks: 20, description: '', instructions: '', attachment: '' };
const emptyExam = { name: '', grade: '', date: '' };
const emptyMaterial = { title: '', grade: '', type: 'PDF', url: '', description: '' };
const emptyNotice = { title: '', content: '', targetAudience: 'Students' };

const TeacherPortal = ({ section = 'dashboard', user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ marks: '', gradeLetter: '', feedback: '' });
  const [examForm, setExamForm] = useState(emptyExam);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marks, setMarks] = useState({});
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [attendanceForm, setAttendanceForm] = useState({ grade: '', section: 'A', date: new Date().toISOString().slice(0, 10) });
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const loadPortal = async () => {
    try {
      const response = await fetch(apiUrl(`/teacher-portal?email=${encodeURIComponent(user?.email || '')}`));
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load teacher portal');
      setData(result);
      const firstClass = result.teacher.assignedClasses?.[0] || '';
      setAssignmentForm(prev => ({ ...prev, grade: prev.grade || firstClass }));
      setExamForm(prev => ({ ...prev, grade: prev.grade || firstClass }));
      setMaterialForm(prev => ({ ...prev, grade: prev.grade || firstClass }));
      setAttendanceForm(prev => ({ ...prev, grade: prev.grade || firstClass }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Portal data is synchronized with the authenticated teacher account.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadPortal(); }, [user?.email]);

  const teacher = data?.teacher;
  const students = data?.students || [];
  const assignments = data?.assignments || [];
  const exams = data?.exams || [];
  const materials = data?.materials || [];
  const dashboard = data?.dashboard || {};
  const classes = teacher?.assignedClasses || [];
  const studentQuery = studentSearch.toLowerCase();
  const filteredStudents = students.filter(item => !studentQuery || [item.name, item.rollNumber, item.grade, item.section].some(value => String(value || '').toLowerCase().includes(studentQuery)));
  const classStudents = students.filter(item => item.grade === attendanceForm.grade && item.section === attendanceForm.section);
  const performanceData = classes.map(grade => {
    const list = students.filter(item => item.grade === grade);
    return {
      grade,
      score: list.length ? Math.round(list.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / list.length) : 0,
      attendance: list.length ? Math.round(list.reduce((sum, item) => sum + Number(item.attendance?.rate || 0), 0) / list.length) : 0
    };
  });
  const upcomingExams = exams.filter(item => new Date(item.date) >= new Date()).slice(0, 6);
  const pendingAssignments = assignments.filter(item => ['Submitted', 'Late Submitted'].includes(item.status));

  const request = async (path, options, successMessage) => {
    const response = await fetch(apiUrl(path), options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Request failed');
    setMessage(successMessage);
    await loadPortal();
    return result;
  };

  const submitAssignment = async event => {
    event.preventDefault();
    try {
      await request('/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignmentForm, subject: teacher.subject, teacher: teacher.name, status: 'Pending' })
      }, 'Assignment created successfully.');
      setAssignmentForm({ ...emptyAssignment, grade: classes[0] || '' });
    } catch (error) { setMessage(error.message); }
  };

  const reviewAssignment = async event => {
    event.preventDefault();
    if (!selectedAssignment) return;
    try {
      await request(`/assignments/${selectedAssignment._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewForm, marks: Number(reviewForm.marks), status: 'Checked', checkedDate: new Date().toISOString() })
      }, 'Assignment review saved.');
      setSelectedAssignment(null);
      setReviewForm({ marks: '', gradeLetter: '', feedback: '' });
    } catch (error) { setMessage(error.message); }
  };

  const submitExam = async event => {
    event.preventDefault();
    try {
      await request('/exams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...examForm, subject: teacher.subject })
      }, 'Exam scheduled successfully.');
      setExamForm({ ...emptyExam, grade: classes[0] || '' });
    } catch (error) { setMessage(error.message); }
  };

  const submitMarks = async event => {
    event.preventDefault();
    if (!selectedExam) return;
    const examStudents = students.filter(item => item.grade === selectedExam.grade);
    try {
      await request('/exams/marks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: selectedExam.name, subject: selectedExam.subject, grade: selectedExam.grade,
          marksRecords: examStudents.filter(item => marks[item._id] !== undefined && marks[item._id] !== '').map(item => ({ studentId: item._id, marks: Number(marks[item._id]) }))
        })
      }, 'Marks uploaded successfully.');
      setMarks({});
    } catch (error) { setMessage(error.message); }
  };

  const submitMaterial = async event => {
    event.preventDefault();
    try {
      await request('/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...materialForm, subject: teacher.subject, uploadedBy: teacher.name, uploadDate: new Date().toISOString() })
      }, 'Study material uploaded.');
      setMaterialForm({ ...emptyMaterial, grade: classes[0] || '' });
    } catch (error) { setMessage(error.message); }
  };

  const submitNotice = async event => {
    event.preventDefault();
    try {
      await request('/notices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noticeForm)
      }, 'Notice published successfully.');
      await fetch(apiUrl('/notifications'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noticeForm.title, description: noticeForm.content, sender: teacher.name, category: 'Teacher Messages', targetRole: 'Student' })
      });
      setNoticeForm(emptyNotice);
    } catch (error) { setMessage(error.message); }
  };

  const loadAttendance = async () => {
    if (!attendanceForm.grade || !attendanceForm.section || !attendanceForm.date) return;
    try {
      const response = await fetch(apiUrl(`/attendance?grade=${encodeURIComponent(attendanceForm.grade)}&section=${attendanceForm.section}&date=${attendanceForm.date}`));
      const sheet = await response.json();
      setAttendanceRecords(classStudents.map(student => ({
        student: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        status: sheet?.records?.find(record => String(record.student?._id || record.student) === student._id)?.status || 'Present',
        subject: teacher.subject,
        teacher: teacher.name,
        remarks: ''
      })));
    } catch (error) { setMessage(error.message); }
  };

  const saveAttendance = async () => {
    try {
      await request('/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attendanceForm,
          records: attendanceRecords.map(record => ({
            student: record.student,
            status: record.status,
            subject: record.subject,
            teacher: record.teacher,
            remarks: record.remarks
          }))
        })
      }, 'Attendance saved successfully.');
    } catch (error) { setMessage(error.message); }
  };

  if (loading) return <div className="portal-loading"><div className="spinner"></div><p>Loading teacher portal...</p></div>;
  if (!teacher) return <div className="portal-empty glass-panel"><h2>Teacher profile not found</h2><p>{message}</p></div>;

  const pageTitle = {
    dashboard: 'Teacher Dashboard', profile: 'My Profile', attendance: 'Attendance Management', students: 'My Students',
    assignments: 'Assignment Management', exams: 'Exams & Results', materials: 'Study Materials', communication: 'Communication'
  }[section] || 'Teacher Dashboard';

  return (
    <div className="portal-container teacher-portal">
      <header className="portal-header"><div><h1>{pageTitle}</h1><p>Welcome back, {teacher.name}. Manage your classes and academic work.</p></div></header>
      {message && <div className="glass-panel portal-action-message">{message}</div>}

      {section === 'dashboard' && <>
        <div className="teacher-summary-grid">
          <PortalStat icon={BookOpen} label="Assigned Classes" value={dashboard.assignedClasses || 0} detail={teacher.subject} />
          <PortalStat icon={Users} label="My Students" value={dashboard.students || 0} detail="Active students" />
          <PortalStat icon={ClipboardList} label="Pending Reviews" value={dashboard.pendingReviews || 0} detail="Need feedback" />
          <PortalStat icon={Award} label="Upcoming Exams" value={dashboard.upcomingExams || 0} detail="Scheduled" />
          <PortalStat icon={CalendarCheck} label="Attendance" value={`${dashboard.averageAttendance || 0}%`} detail="Class average" />
          <PortalStat icon={TrendingUp} label="Average Score" value={`${dashboard.averageScore || 0}%`} detail="Student performance" />
        </div>
        <div className="teacher-dashboard-layout">
          <div className="teacher-column">
            <Panel title="Teacher Profile" icon={User}><div className="teacher-profile-card"><div>{initials(teacher.name)}</div><h3>{teacher.name}</h3><p>{teacher.subject}</p><span>{teacher.email}</span></div></Panel>
            <Panel title="Assigned Classes" icon={BookOpen}><SimpleList items={classes} empty="No assigned classes." /></Panel>
          </div>
          <div className="teacher-column">
            <Panel title="Class Performance" icon={TrendingUp}><div className="chart-box"><ResponsiveContainer width="100%" height={280}><BarChart data={performanceData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)"/><XAxis dataKey="grade" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip/><Bar dataKey="score" fill="#8b5cf6" radius={[6,6,0,0]}/><Bar dataKey="attendance" fill="#06b6d4" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
            <Panel title="Recent Students" icon={Users}><DataRows rows={students.slice(0, 6).map(item => [item.name, `${item.grade}-${item.section}`, `${item.percentage || 0}%`, `${item.attendance?.rate || 0}% attendance`])} empty="No students." /></Panel>
          </div>
          <div className="teacher-column">
            <Panel title="Upcoming Exams" icon={Award}><DataRows rows={upcomingExams.map(item => [item.name, item.grade, formatDate(item.date)])} empty="No upcoming exams." /></Panel>
            <Panel title="Review Queue" icon={ClipboardList}><DataRows rows={pendingAssignments.map(item => [item.title, item.grade, item.status])} empty="No pending reviews." /></Panel>
          </div>
        </div>
      </>}

      {section === 'profile' && <div className="teacher-profile-layout">
        <Panel title="Personal Information" icon={User}><ProfileRows rows={[["Full Name", teacher.name], ["Email", teacher.email], ["Phone", teacher.phone], ["Primary Subject", teacher.subject], ["Employee ID", teacher._id.slice(-8).toUpperCase()]]}/></Panel>
        <Panel title="Academic Responsibility" icon={BookOpen}><ProfileRows rows={[["Assigned Classes", classes.join(', ')], ["Total Students", students.length], ["Assignments", assignments.length], ["Exams", exams.length], ["Materials", materials.length]]}/></Panel>
        <Panel title="Class Performance" icon={TrendingUp}><DataRows rows={performanceData.map(item => [item.grade, `${item.score}% score`, `${item.attendance}% attendance`])} /></Panel>
        <Panel title="Contact & Access" icon={CheckCircle2}><ProfileRows rows={[["Role", "Teacher"], ["Account Status", "Active"], ["Portal Access", "Attendance, Exams, Assignments, Materials"], ["Database", "MongoDB Atlas"]]}/></Panel>
      </div>}

      {section === 'attendance' && <>
        <div className="teacher-summary-grid four"><PortalStat icon={BookOpen} label="Classes" value={classes.length}/><PortalStat icon={Users} label="Students" value={students.length}/><PortalStat icon={CalendarCheck} label="Sheets" value={data.attendanceSheets.length}/><PortalStat icon={TrendingUp} label="Average" value={`${dashboard.averageAttendance || 0}%`}/></div>
        <Panel title="Take Attendance" icon={CalendarCheck}>
          <div className="teacher-form-grid compact"><Select label="Class" value={attendanceForm.grade} onChange={value => setAttendanceForm(prev => ({...prev, grade:value}))} options={classes}/><Field label="Section" value={attendanceForm.section} onChange={value => setAttendanceForm(prev => ({...prev, section:value.toUpperCase()}))}/><Field label="Date" type="date" value={attendanceForm.date} onChange={value => setAttendanceForm(prev => ({...prev, date:value}))}/><button className="btn btn-primary teacher-inline-button" type="button" onClick={loadAttendance}>Load Register</button></div>
          <div className="teacher-register"><div className="teacher-table-head"><span>Roll No</span><span>Student</span><span>Status</span><span>Remarks</span></div>{attendanceRecords.map((record, index) => <div key={record.student} className="teacher-table-row"><span>{record.rollNumber}</span><strong>{record.name}</strong><select className="form-input" value={record.status} onChange={event => setAttendanceRecords(items => items.map((item, i) => i === index ? {...item,status:event.target.value}:item))}>{['Present','Absent','Late','Holiday'].map(value => <option key={value}>{value}</option>)}</select><input className="form-input" value={record.remarks} onChange={event => setAttendanceRecords(items => items.map((item,i) => i===index?{...item,remarks:event.target.value}:item))} placeholder="Remarks"/></div>)}</div>
          {attendanceRecords.length > 0 && <button className="btn btn-primary portal-action-btn" type="button" onClick={saveAttendance}>Save Attendance</button>}
        </Panel>
        <Panel title="Attendance History" icon={FileText}><DataRows rows={data.attendanceSummary.map(item => [item.grade, item.lastMarked ? formatDate(item.lastMarked) : 'Not marked', `${item.present}/${item.total} present`, `${item.sheets} sheets`])}/></Panel>
      </>}

      {section === 'students' && <Panel title="Student Performance" icon={Users}>
        <div className="teacher-search"><Search size={18}/><input value={studentSearch} onChange={event => setStudentSearch(event.target.value)} placeholder="Search student, roll number or class..."/></div>
        <div className="teacher-student-grid">{filteredStudents.map(item => <article key={item._id} className="glass-card teacher-student-card"><div>{initials(item.name)}</div><h3>{item.name}</h3><p>{item.grade} - Section {item.section}</p><span>{item.rollNumber}</span><div><b>{item.percentage || 0}%</b><small>Score</small><b>{item.attendance?.rate || 0}%</b><small>Attendance</small></div></article>)}</div>
      </Panel>}

      {section === 'assignments' && <div className="teacher-management-layout">
        <Panel title="Create Assignment" icon={Plus}><form onSubmit={submitAssignment} className="teacher-form-grid"><Field label="Title" value={assignmentForm.title} onChange={value=>setAssignmentForm(prev=>({...prev,title:value}))} required/><Select label="Class" value={assignmentForm.grade} onChange={value=>setAssignmentForm(prev=>({...prev,grade:value}))} options={classes}/><Field label="Section" value={assignmentForm.section} onChange={value=>setAssignmentForm(prev=>({...prev,section:value.toUpperCase()}))}/><Field label="Due Date" type="date" value={assignmentForm.due} onChange={value=>setAssignmentForm(prev=>({...prev,due:value}))} required/><Field label="Total Marks" type="number" value={assignmentForm.totalMarks} onChange={value=>setAssignmentForm(prev=>({...prev,totalMarks:Number(value)}))}/><Field label="Attachment" value={assignmentForm.attachment} onChange={value=>setAssignmentForm(prev=>({...prev,attachment:value}))}/><TextArea label="Description" value={assignmentForm.description} onChange={value=>setAssignmentForm(prev=>({...prev,description:value}))}/><TextArea label="Instructions" value={assignmentForm.instructions} onChange={value=>setAssignmentForm(prev=>({...prev,instructions:value}))}/><button className="btn btn-primary" type="submit">Create Assignment</button></form></Panel>
        <Panel title="Assignments" icon={ClipboardList}><DataRows rows={assignments.map(item => [item.title, `${item.grade}-${item.section}`, formatDate(item.due), item.status, <button key={item._id} className="btn btn-secondary" type="button" onClick={()=>{setSelectedAssignment(item);setReviewForm({marks:item.marks==='-'?'':item.marks,gradeLetter:item.gradeLetter||'',feedback:item.feedback||''})}}>Review</button>])} empty="No assignments for your subject." /></Panel>
        {selectedAssignment && <Panel title={`Review: ${selectedAssignment.title}`} icon={Award}><form onSubmit={reviewAssignment} className="teacher-form-grid compact"><Field label="Marks" type="number" value={reviewForm.marks} onChange={value=>setReviewForm(prev=>({...prev,marks:value}))} required/><Field label="Grade" value={reviewForm.gradeLetter} onChange={value=>setReviewForm(prev=>({...prev,gradeLetter:value}))}/><TextArea label="Feedback" value={reviewForm.feedback} onChange={value=>setReviewForm(prev=>({...prev,feedback:value}))}/><button className="btn btn-primary" type="submit">Save Review</button></form></Panel>}
      </div>}

      {section === 'exams' && <div className="teacher-management-layout">
        <Panel title="Schedule Exam" icon={Plus}><form onSubmit={submitExam} className="teacher-form-grid compact"><Field label="Exam Name" value={examForm.name} onChange={value=>setExamForm(prev=>({...prev,name:value}))} required/><Select label="Class" value={examForm.grade} onChange={value=>setExamForm(prev=>({...prev,grade:value}))} options={classes}/><Field label="Date" type="date" value={examForm.date} onChange={value=>setExamForm(prev=>({...prev,date:value}))} required/><button className="btn btn-primary" type="submit">Create Exam</button></form></Panel>
        <Panel title="Exam Schedule" icon={Award}><DataRows rows={exams.map(item => [item.name,item.grade,item.subject,formatDate(item.date),<button key={item._id} className="btn btn-secondary" type="button" onClick={()=>setSelectedExam(item)}>Enter Marks</button>])} empty="No exams for your subject." /></Panel>
        {selectedExam && <Panel title={`Marks: ${selectedExam.name} - ${selectedExam.grade}`} icon={Award}><form onSubmit={submitMarks}><div className="teacher-register">{students.filter(item=>item.grade===selectedExam.grade).map(item=><div className="teacher-table-row marks" key={item._id}><span>{item.rollNumber}</span><strong>{item.name}</strong><input className="form-input" type="number" min="0" max="100" value={marks[item._id]??''} onChange={event=>setMarks(prev=>({...prev,[item._id]:event.target.value}))} placeholder="Marks / 100"/></div>)}</div><button className="btn btn-primary portal-action-btn" type="submit">Upload Marks</button></form></Panel>}
      </div>}

      {section === 'materials' && <div className="teacher-management-layout">
        <Panel title="Upload Study Material" icon={Upload}><form onSubmit={submitMaterial} className="teacher-form-grid"><Field label="Title" value={materialForm.title} onChange={value=>setMaterialForm(prev=>({...prev,title:value}))} required/><Select label="Class" value={materialForm.grade} onChange={value=>setMaterialForm(prev=>({...prev,grade:value}))} options={[...classes,'All']}/><Select label="Type" value={materialForm.type} onChange={value=>setMaterialForm(prev=>({...prev,type:value}))} options={['PDF','Video','Notes','E-Book']}/><Field label="File / URL" value={materialForm.url} onChange={value=>setMaterialForm(prev=>({...prev,url:value}))}/><TextArea label="Description" value={materialForm.description} onChange={value=>setMaterialForm(prev=>({...prev,description:value}))}/><button className="btn btn-primary" type="submit">Upload Material</button></form></Panel>
        <Panel title="My Materials" icon={FileText}><div className="teacher-material-grid">{materials.map(item=><article className="glass-card" key={item._id}><FileText size={22}/><span>{item.type}</span><h3>{item.title}</h3><p>{item.grade} - {item.subject}</p><small>{item.views} views - {item.downloads} downloads</small></article>)}</div>{materials.length===0&&<p className="portal-muted">No materials uploaded.</p>}</Panel>
      </div>}

      {section === 'communication' && <div className="teacher-management-layout">
        <Panel title="Send Notice" icon={MessageSquare}><form onSubmit={submitNotice} className="teacher-form-grid compact"><Field label="Title" value={noticeForm.title} onChange={value=>setNoticeForm(prev=>({...prev,title:value}))} required/><Select label="Audience" value={noticeForm.targetAudience} onChange={value=>setNoticeForm(prev=>({...prev,targetAudience:value}))} options={['Students','Parents','Teachers','All']}/><TextArea label="Message" value={noticeForm.content} onChange={value=>setNoticeForm(prev=>({...prev,content:value}))} required/><button className="btn btn-primary" type="submit"><Bell size={16}/> Publish Notice</button></form></Panel>
        <Panel title="Recent Communication" icon={Bell}><DataRows rows={data.notices.map(item=>[item.title,item.targetAudience,formatDate(item.date)])} empty="No notices published." /></Panel>
      </div>}
      <Chatbot user={user} role="teacher" />
    </div>
  );
};

const PortalStat = ({ icon:Icon,label,value,detail }) => <div className="portal-stat-card glass-card"><Icon size={22}/><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>;
const Panel = ({title,icon:Icon,children}) => <section className="portal-panel glass-panel"><h2><Icon size={18}/>{title}</h2>{children}</section>;
const SimpleList = ({items,empty}) => <div className="portal-list">{items.length?items.map(item=><div key={item}><BookOpen size={15}/><span>{item}</span></div>):<p>{empty}</p>}</div>;
const DataRows = ({rows=[],empty='No data available.'}) => <div className="portal-data-rows">{rows.length?rows.map((row,index)=><div key={index}>{row.map((cell,i)=><span key={i}>{cell}</span>)}</div>):<p className="portal-muted">{empty}</p>}</div>;
const ProfileRows = ({rows}) => <div className="portal-profile-rows">{rows.map(([label,value])=><div key={label}><span>{label}</span><strong>{value||'-'}</strong></div>)}</div>;
const Field = ({label,type='text',value,onChange,required}) => <label className="teacher-field"><span>{label}</span><input className="form-input" type={type} value={value} onChange={event=>onChange(event.target.value)} required={required}/></label>;
const Select = ({label,value,onChange,options}) => <label className="teacher-field"><span>{label}</span><select className="form-input" value={value} onChange={event=>onChange(event.target.value)}>{options.map(option=><option key={option} value={option}>{option}</option>)}</select></label>;
const TextArea = ({label,value,onChange,required}) => <label className="teacher-field teacher-field-wide"><span>{label}</span><textarea className="form-input" rows="3" value={value} onChange={event=>onChange(event.target.value)} required={required}/></label>;
const formatDate = value => value ? new Date(value).toLocaleDateString() : '-';
const initials = name => name.split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase();

export default TeacherPortal;
