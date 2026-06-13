import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, SlidersHorizontal, BookOpen, GraduationCap, X } from 'lucide-react';
import { apiUrl } from '../config/api';
import './StudentList.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  // Load configured classes dynamically
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(apiUrl('/classes'));
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Build API query string
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (deptFilter !== 'All') params.append('grade', deptFilter);
      if (semFilter !== 'All') params.append('section', semFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      
      const response = await fetch(apiUrl(`/students?${params.toString()}`));
      if (!response.ok) {
        throw new Error('Failed to load student profiles');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input or fetch instantly on filter change
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, deptFilter, semFilter, statusFilter]);

  // Utility to generate initial initials for student avatars
  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to generate a unique gradient background for each profile card based on index
  const getAvatarGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #a855f7, #6366f1)',
      'linear-gradient(135deg, #06b6d4, #3b82f6)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #10b981, #14b8a6)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #6366f1, #3b82f6)'
    ];
    return gradients[index % gradients.length];
  };

  // Helper to map DB status string to matching CSS class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'badge-active';
      case 'Suspended': return 'badge-suspended';
      case 'Graduated': return 'badge-graduated';
      default: return 'badge-inactive';
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDeptFilter('All');
    setSemFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="directory-container">
      <header className="directory-header">
        <div>
          <h1>Student Directory</h1>
          <p>Search, filter, and view detailed information on all enrolled students</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/add-student')}>
          <UserPlus size={18} />
          <span>Register Student</span>
        </button>
      </header>

      {/* Search & Action Bar */}
      <div className="search-actions-bar glass-panel">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search by student name, roll number, registration ID or email..."
            className="directory-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className={`btn btn-secondary filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
          {(deptFilter !== 'All' || semFilter !== 'All' || statusFilter !== 'All') && (
            <span className="active-filters-badge"></span>
          )}
        </button>
      </div>

      {/* Floating Filter Options */}
      {showFilters && (
        <div className="filters-panel glass-panel animated-dropdown">
          <div className="filters-grid">
            <div className="form-group">
              <label className="form-label">Grade / Class</label>
              <select 
                className="form-input"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="All">All Grades</option>
                {classes.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section</label>
              <select 
                className="form-input"
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Status</label>
              <select 
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="filters-footer">
            <button className="btn btn-secondary btn-sm" onClick={clearAllFilters}>Reset Filters</button>
          </div>
        </div>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="directory-loading">
          <div className="spinner"></div>
          <p>Fetching matching student profiles...</p>
        </div>
      ) : error ? (
        <div className="directory-error glass-panel">
          <h3>Failed to retrieve records</h3>
          <p>{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="directory-empty glass-panel">
          <h3>No Student Records Found</h3>
          <p>Try refining your search terms or clearing the filter controls.</p>
          <button className="btn btn-secondary" onClick={clearAllFilters}>Clear Filters</button>
        </div>
      ) : (
        <div className="students-cards-grid">
          {students.map((student, index) => (
            <div 
              key={student._id} 
              className="student-card glass-card"
              onClick={() => navigate(`/students/${student._id}`)}
            >
              <div className="card-top">
                <div 
                  className="student-avatar" 
                  style={{ background: getAvatarGradient(index) }}
                >
                  {getInitials(student.name)}
                </div>
                <div className={`badge ${getStatusClass(student.status)} card-status-badge`}>
                  {student.status}
                </div>
              </div>

              <div className="card-middle">
                <h3>{student.name}</h3>
                <span className="card-roll-number">{student.rollNumber}</span>
                <div className="card-academic-details">
                  <div className="academic-stat">
                    <BookOpen size={14} className="stat-icon" />
                    <span>{student.grade}</span>
                  </div>
                  <div className="academic-stat">
                    <GraduationCap size={14} className="stat-icon" />
                    <span>Section {student.section}</span>
                  </div>
                </div>
              </div>

              <div className="card-bottom-bar">
                <div className="gpa-container">
                  <span className="gpa-label">Academic Score</span>
                  <div className="gpa-metric-wrapper">
                    <div className="gpa-bar-bg">
                      <div 
                        className="gpa-bar-fill" 
                        style={{ 
                          width: `${student.percentage || 0}%`,
                          background: (student.percentage || 0) >= 85 
                            ? 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))'
                            : (student.percentage || 0) >= 65 
                            ? 'linear-gradient(90deg, var(--accent-warning), var(--accent-cyan))'
                            : 'linear-gradient(90deg, var(--accent-danger), var(--accent-warning))'
                        }}
                      ></div>
                    </div>
                    <span className="gpa-value">{student.percentage ? `${student.percentage}%` : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentList;
