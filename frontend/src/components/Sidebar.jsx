import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen,
  CheckSquare, Calendar, Award, CreditCard, Heart, Bell, BarChart3, Sliders, LogOut
} from 'lucide-react';
import { apiUrl } from '../config/api';
import './Sidebar.css';

const Sidebar = ({ onLogout }) => {
  const [apiStatus, setApiStatus] = useState('Checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(apiUrl('/health'));
        setApiStatus(response.ok ? 'Connected' : 'Offline');
      } catch (err) {
        setApiStatus('Offline');
      }
    };

    checkHealth();
  }, []);

  return (
    <aside className="sidebar-container glass-panel">
      <div className="sidebar-logo">
        <div className="logo-icon-wrapper">
          <GraduationCap size={28} className="logo-icon" />
        </div>
        <div className="logo-text">
          <h2>AcademicFlow</h2>
          <span>Edu Admin Hub</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/students"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Students</span>
        </NavLink>

        <NavLink
          to="/teachers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <GraduationCap size={18} />
          <span>Teachers</span>
        </NavLink>

        <NavLink
          to="/classes"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <School size={18} />
          <span>Classes</span>
        </NavLink>

        <NavLink
          to="/subjects"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Subjects</span>
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={18} />
          <span>Attendance</span>
        </NavLink>

        <NavLink
          to="/exams"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Calendar size={18} />
          <span>Exams</span>
        </NavLink>

        <NavLink
          to="/results"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Award size={18} />
          <span>Results</span>
        </NavLink>

        <NavLink
          to="/fees"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <CreditCard size={18} />
          <span>Fees</span>
        </NavLink>

        <NavLink
          to="/parents"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Heart size={18} />
          <span>Parents</span>
        </NavLink>

        <NavLink
          to="/notices"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Bell size={18} />
          <span>Notices</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Sliders size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {onLogout && (
          <button type="button" className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
        <div className="status-indicator">
          <span className="status-dot pulsing"></span>
          <div className="status-details">
            <p>Database Status</p>
            <span>{apiStatus}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
