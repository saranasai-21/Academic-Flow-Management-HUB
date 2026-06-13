import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RoleSidebar from './components/RoleSidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentDetails from './pages/StudentDetails';
import StudentForm from './pages/StudentForm';
import ClassManagement from './pages/ClassManagement';
import TakeAttendance from './pages/TakeAttendance';
import TeacherManagement from './pages/TeacherManagement';
import SubjectManagement from './pages/SubjectManagement';
import ExamManagement from './pages/ExamManagement';
import ResultManagement from './pages/ResultManagement';
import FeeManagement from './pages/FeeManagement';
import ParentManagement from './pages/ParentManagement';
import NoticeManagement from './pages/NoticeManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import StudentPortal from './pages/StudentPortal';
import TeacherPortal from './pages/TeacherPortal';

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sms-user')) || null;
  } catch {
    return null;
  }
};

function AppShell() {
  const [user, setUser] = useState(storedUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      localStorage.setItem('sms-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sms-user');
    }
  }, [user]);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    if (nextUser.role === 'admin') navigate('/');
    if (nextUser.role === 'teacher') navigate('/teacher');
    if (nextUser.role === 'student') navigate('/student');
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === 'student') {
    return (
      <div className="app-container">
        <RoleSidebar role="student" user={user} onLogout={handleLogout} />
        <main className="main-content">
          <div className="page-wrapper">
            <TopNavbar role="student" user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/student" element={<StudentPortal section="dashboard" user={user} />} />
              <Route path="/student/profile" element={<StudentPortal section="profile" user={user} />} />
              <Route path="/student/attendance" element={<StudentPortal section="attendance" user={user} />} />
              <Route path="/student/results" element={<StudentPortal section="results" user={user} />} />
              <Route path="/student/assignments" element={<StudentPortal section="assignments" user={user} />} />
              <Route path="/student/materials" element={<StudentPortal section="materials" user={user} />} />
              <Route path="/student/fees" element={<StudentPortal section="fees" user={user} />} />
              <Route path="/student/notifications" element={<StudentPortal section="notifications" user={user} />} />
              <Route path="/login" element={<Navigate to="/student" replace />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  if (user.role === 'teacher') {
    return (
      <div className="app-container">
        <RoleSidebar role="teacher" user={user} onLogout={handleLogout} />
        <main className="main-content">
          <div className="page-wrapper">
            <TopNavbar role="teacher" user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/teacher" element={<TeacherPortal section="dashboard" user={user} />} />
              <Route path="/teacher/profile" element={<TeacherPortal section="profile" user={user} />} />
              <Route path="/teacher/attendance" element={<TeacherPortal section="attendance" user={user} />} />
              <Route path="/teacher/students" element={<TeacherPortal section="students" user={user} />} />
              <Route path="/teacher/assignments" element={<TeacherPortal section="assignments" user={user} />} />
              <Route path="/teacher/exams" element={<TeacherPortal section="exams" user={user} />} />
              <Route path="/teacher/materials" element={<TeacherPortal section="materials" user={user} />} />
              <Route path="/teacher/communication" element={<TeacherPortal section="communication" user={user} />} />
              <Route path="/attendance" element={<TakeAttendance />} />
              <Route path="/exams" element={<ExamManagement />} />
              <Route path="/results" element={<ResultManagement />} />
              <Route path="/notices" element={<NoticeManagement />} />
              <Route path="/login" element={<Navigate to="/teacher" replace />} />
              <Route path="*" element={<Navigate to="/teacher" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-wrapper">
          <TopNavbar role="admin" user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/add-student" element={<StudentForm />} />
            <Route path="/edit-student/:id" element={<StudentForm />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/attendance" element={<TakeAttendance />} />
            <Route path="/teachers" element={<TeacherManagement />} />
            <Route path="/subjects" element={<SubjectManagement />} />
            <Route path="/exams" element={<ExamManagement />} />
            <Route path="/results" element={<ResultManagement />} />
            <Route path="/fees" element={<FeeManagement />} />
            <Route path="/parents" element={<ParentManagement />} />
            <Route path="/notices" element={<NoticeManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
