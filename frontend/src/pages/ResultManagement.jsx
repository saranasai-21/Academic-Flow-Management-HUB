import { useState, useEffect } from 'react';
import { Save, ShieldAlert, AlertTriangle } from 'lucide-react';
import { apiUrl } from '../config/api';
import './ResultManagement.css';

const ResultManagement = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  
  const [students, setStudents] = useState([]);
  const [marksState, setMarksState] = useState({}); // studentId -> marks (number or string)
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch upcoming scheduled exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoadingExams(true);
        const response = await fetch(apiUrl('/exams'));
        if (!response.ok) throw new Error('Failed to load exam metadata');
        const data = await response.json();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  // Find the selected exam details
  const currentExam = exams.find(e => e._id === selectedExamId);

  // 2. Fetch student roster when selected exam or section changes
  useEffect(() => {
    if (!currentExam) return;

    const fetchRoster = async () => {
      try {
        setLoadingStudents(true);
        setError(null);
        setSuccessMsg('');
        setStudents([]);
        setMarksState({});

        // Fetch full student profiles to retrieve existing grades
        const response = await fetch(apiUrl(`/students?grade=${encodeURIComponent(currentExam.grade)}&section=${selectedSection}`));
        if (!response.ok) throw new Error('Failed to load class roster');
        
        const data = await response.json();
        setStudents(data);

        // Pre-fill with existing marks if found in student grades
        const initialMarks = {};
        data.forEach(student => {
          const matchedGrade = student.grades?.find(
            g => g.term === currentExam.name && g.subject === currentExam.subject
          );
          initialMarks[student._id] = matchedGrade ? matchedGrade.marks : '';
        });
        setMarksState(initialMarks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchRoster();
  }, [selectedExamId, selectedSection, exams, currentExam]);

  const handleMarkChange = (studentId, value) => {
    // Restrict between 0 and 100
    const numericVal = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
    setMarksState(prev => ({
      ...prev,
      [studentId]: numericVal
    }));
  };

  const calculateGradeLetter = (marks) => {
    if (marks === '' || marks === undefined) return '-';
    const m = Number(marks);
    if (m >= 90) return 'A+';
    if (m >= 80) return 'A';
    if (m >= 70) return 'B';
    if (m >= 60) return 'C';
    if (m >= 50) return 'D';
    return 'F';
  };

  const getGradeClass = (letter) => {
    if (letter === 'A+') return 'grade-badge-cell excellent';
    if (letter === 'A' || letter === 'B') return 'grade-badge-cell good';
    if (letter === 'C' || letter === 'D') return 'grade-badge-cell average';
    if (letter === 'F') return 'grade-badge-cell fail';
    return 'grade-badge-cell';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentExam || students.length === 0) return;

    // Validate that marks are provided for all students
    const invalidRecord = Object.values(marksState).some(val => val === '');
    if (invalidRecord) {
      if (!window.confirm('Some students do not have marks entered. They will be recorded as 0/F. Proceed?')) {
        return;
      }
    }

    const marksRecords = students.map(s => ({
      studentId: s._id,
      marks: marksState[s._id] === '' ? 0 : Number(marksState[s._id])
    }));

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/exams/marks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: currentExam.name,
          subject: currentExam.subject,
          grade: currentExam.grade,
          marksRecords
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit marks');

      setSuccessMsg('Gradebook marks recorded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="results-container">
      <header className="results-header">
        <div>
          <h1>Exam Results Gradebook</h1>
          <p>Batch record exam marks and grade listings for academic progress reports.</p>
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

      {/* Selectors Bar */}
      <div className="results-filter-bar glass-panel">
        <div className="form-group">
          <label className="form-label">Active Scheduled Exam</label>
          {loadingExams ? (
            <span className="form-input" style={{ opacity: 0.7 }}>Loading exams...</span>
          ) : exams.length === 0 ? (
            <span className="form-input warning-input" style={{ color: 'var(--accent-warning)', borderColor: 'var(--accent-warning)' }}>
              No exams scheduled yet!
            </span>
          ) : (
            <select
              className="form-input"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {exams.map(e => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.subject} - {e.grade})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Class Section</label>
          <select
            className="form-input"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
        </div>

        <div className="form-group" style={{ justifyContent: 'flex-end', paddingBottom: '20px' }}>
          {currentExam && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              <span style={{ display: 'block' }}>Subject: <strong>{currentExam.subject}</strong></span>
              <span style={{ display: 'block' }}>Class: <strong>{currentExam.grade}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Gradebook Sheet */}
      {loadingStudents ? (
        <div className="class-loading">
          <div className="spinner"></div>
          <p>Loading class roster...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="attendance-empty-panel glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={36} className="warn-icon" style={{ color: 'var(--accent-warning)', marginBottom: '10px' }} />
          <h3>No Scheduled Exams</h3>
          <p>Schedule an exam first in the Exams tab to open the gradebook.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="attendance-empty-panel glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={36} className="warn-icon" style={{ color: 'var(--accent-warning)', marginBottom: '10px' }} />
          <h3>No Registered Students</h3>
          <p>There are no students enrolled in <strong>{currentExam?.grade} - Section {selectedSection}</strong>.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel gradebook-panel">
          <h2>Batch Marks Entry: {currentExam?.name}</h2>
          <div className="gradebook-table-wrapper">
            <table className="gradebook-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Register ID</th>
                  <th style={{ textAlign: 'center' }}>Marks (0-100)</th>
                  <th style={{ textAlign: 'center' }}>Grade Letter</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const val = marksState[student._id] !== undefined ? marksState[student._id] : '';
                  const letter = calculateGradeLetter(val);
                  return (
                    <tr key={student._id}>
                      <td style={{ fontWeight: 600 }}>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      <td>{student.registerNumber}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) => handleMarkChange(student._id, e.target.value)}
                          className="marks-input-field"
                          placeholder="e.g. 85"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }} className={getGradeClass(letter)}>
                        {letter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="gradebook-footer">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} />
              <span>{submitting ? 'Saving...' : 'Submit Grades'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResultManagement;
