import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './ExamManagement.css';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [exRes, clRes, subRes] = await Promise.all([
        fetch(apiUrl('/exams')),
        fetch(apiUrl('/classes')),
        fetch(apiUrl('/subjects'))
      ]);

      if (!exRes.ok || !clRes.ok || !subRes.ok) throw new Error('Failed to retrieve exams metadata');

      const exData = await exRes.json();
      const clData = await clRes.json();
      const subData = await subRes.json();

      setExams(exData);
      setClasses(clData);
      setSubjects(subData);

      // Pre-select first values in form if available
      if (clData.length > 0) setGrade(clData[0].name);
      if (subData.length > 0) setSubject(subData[0].name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date || !grade || !subject) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/exams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          date,
          grade,
          subject
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to schedule exam');

      setName('');
      setDate('');
      setSuccessMsg('Exam scheduled successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled exam?')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/exams/${examId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete exam');

      setSuccessMsg('Exam schedule deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper date parsing formatting
  const parseExamDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '??', month: '??' };
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    return { day, month };
  };

  return (
    <div className="exam-mgmt-container">
      <header className="exam-header">
        <div>
          <h1>Exam Scheduling</h1>
          <p>Schedule tests and quarterly reviews, and manage active exam dates.</p>
        </div>
      </header>

      {error && (
        <div className="form-error-banner glass-panel">
          <ShieldAlert size={20} className="error-banner-icon" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="form-success-banner glass-panel">
          <span>{successMsg}</span>
        </div>
      )}

      <div className="exam-grid">
        {/* Schedule Exam form */}
        <div className="glass-panel add-exam-panel">
          <h2>Schedule Exam</h2>
          <form onSubmit={handleAddExam}>
            <div className="form-group">
              <label className="form-label">Exam Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Term 1 Finals, Unit Test 2"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Grade / Class *</label>
              {classes.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-warning)' }}>Configure classes first.</span>
              ) : (
                <select
                  className="form-input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Exam Subject *</label>
              {subjects.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-warning)' }}>Configure subjects first.</span>
              ) : (
                <select
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={formLoading || classes.length === 0 || subjects.length === 0}>
              <Plus size={16} />
              <span>{formLoading ? 'Scheduling...' : 'Schedule Exam'}</span>
            </button>
          </form>
        </div>

        {/* Scheduled Exams Timeline */}
        <div className="glass-panel exam-list-panel">
          <h2>Scheduled Exams List</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching scheduled exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="class-empty">
              <p>No exams scheduled yet.</p>
              <p className="sub-empty">Use the scheduling form to post new upcoming tests.</p>
            </div>
          ) : (
            <div className="exams-timeline-list">
              {exams.map((ex) => {
                const { day, month } = parseExamDate(ex.date);
                return (
                  <div key={ex._id} className="exam-timeline-item glass-card">
                    <div className="exam-item-details">
                      <div className="exam-date-box">
                        <span className="exam-date-day">{day}</span>
                        <span className="exam-date-month">{month}</span>
                      </div>
                      <div className="exam-info-main">
                        <h3>{ex.name}</h3>
                        <div className="exam-meta-pills">
                          <span className="exam-pill grade">{ex.grade}</span>
                          <span className="exam-pill subject">{ex.subject}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="action-btn-sm delete"
                      onClick={() => handleDeleteExam(ex._id)}
                      title="Cancel Exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
