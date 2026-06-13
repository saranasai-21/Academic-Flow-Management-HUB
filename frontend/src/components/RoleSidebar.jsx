import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  User,
  Users
} from 'lucide-react';
import './RoleSidebar.css';

const roleMenu = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/results', label: 'Exams & Results', icon: Award },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/student/fees', label: 'Fees', icon: CreditCard },
    { to: '/student/notifications', label: 'Notifications', icon: Bell }
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/profile', label: 'Profile', icon: User },
    { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/teacher/students', label: 'Students', icon: Users },
    { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/teacher/exams', label: 'Exam Management', icon: Award },
    { to: '/teacher/materials', label: 'Study Materials', icon: FileText },
    { to: '/teacher/communication', label: 'Communication', icon: MessageSquare }
  ]
};

const RoleSidebar = ({ role, user, onLogout }) => {
  const links = roleMenu[role] || [];
  const roleLabel = role === 'teacher' ? 'Teacher\'s Hub' : 'Student\'s Hub';

  return (
    <aside className="role-sidebar glass-panel">
      <div className="role-sidebar-logo">
        <div className="role-logo-icon">
          <GraduationCap size={26} />
        </div>
        <div>
          <h2>{roleLabel}</h2>
          <span>{user?.name || 'School Portal'}</span>
        </div>
      </div>

      <nav className="role-sidebar-menu">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === `/${role}`} className={({ isActive }) => `role-sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="role-logout-btn" onClick={onLogout}>
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default RoleSidebar;
