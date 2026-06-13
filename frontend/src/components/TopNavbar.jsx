import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, LogOut, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import './TopNavbar.css';

const roleCopy = {
  admin: {
    title: 'Admin Control Center',
    subtitle: 'Manage school operations, reports and communication',
    badge: 'Admin'
  },
  teacher: {
    title: 'Teacher Workspace',
    subtitle: 'Classes, attendance, exams and student updates',
    badge: 'Teacher'
  },
  student: {
    title: 'Student Learning Portal',
    subtitle: 'Attendance, assignments, results, fees and notices',
    badge: 'Student'
  }
};

const TopNavbar = ({ role = 'admin', user, onLogout }) => {
  const copy = roleCopy[role] || roleCopy.admin;
  const [theme, setTheme] = useState(() => localStorage.getItem('sms-theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('sms-theme', theme);
  }, [theme]);

  return (
    <header className="top-navbar glass-panel">
      <div className="top-navbar-title">
        <span className="top-navbar-role"><ShieldCheck size={14} /> {copy.badge}</span>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="top-navbar-actions">
        <button
          type="button"
          className="top-icon-btn"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="top-date-pill">
          <CalendarDays size={16} />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <button type="button" className="top-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="top-badge">{role === 'admin' ? 9 : role === 'teacher' ? 5 : 12}</span>
        </button>

        <div className="top-user-pill">
          <div className="top-user-avatar">
            <UserRound size={17} />
          </div>
          <div>
            <strong>{user?.name || copy.badge}</strong>
            <span>{user?.email || `${role}@school.edu`}</span>
          </div>
        </div>

        {onLogout && (
          <button type="button" className="top-logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
