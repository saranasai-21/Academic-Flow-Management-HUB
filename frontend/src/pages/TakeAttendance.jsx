import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Users, CheckCircle2, AlertTriangle, Save, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './TakeAttendance.css';

const TakeAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> 'Present' | 'Absent'
  
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [attendanceSheet, setAttendanceSheet] = useState(null);

  // Load configured classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await fetch(apiUrl('/classes'));
        if (!response.ok) throw new Error('Failed to load class configuration');
        const data = await response.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedGrade(data[0].name);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch student roster and existing sheet records when selectors change
  const loadAttendanceSheet = async () => {
    if (!selectedGrade || !selectedSection || !selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('');
      setStudents([]);
      setAttendanceRecords({});
      setAttendanceSheet(null);

      // 1. Fetch Students in Class
      const rosterParams = new URLSearchParams({ grade: selectedGrade, section: selectedSection });
      const rosterRes = await fetch(apiUrl(`/attendance/students?${rosterParams.toString()}`));
      if (!rosterRes.ok) throw new Error('Failed to load student roster');
      const rosterData = await rosterRes.json();

      if (rosterData.length === 0) {
        setStudents([]);
        return;
      }

      setStudents(rosterData);

      // 2. Fetch existing sheet for Date
      const sheetParams = new URLSearchParams({ grade: selectedGrade, section: selectedSection, date: selectedDate });
      const sheetRes = await fetch(apiUrl(`/attendance?${sheetParams.toString()}`));
      if (!sheetRes.ok) throw new Error('Failed to check existing attendance log');
      const sheetData = await sheetRes.json();

      const initialRecords = {};
      if (sheetData && sheetData.records) {
        // Pre-fill existing records
        sheetData.records.forEach(rec => {
          const studentId = rec.student?._id || rec.student;
          initialRecords[studentId] = rec.status;
        });
        setAttendanceSheet(sheetData);
        setIsEditMode(true);
      } else {
        // Default everyone to 'Present'
        rosterData.forEach(stud => {
          initialRecords[stud._id] = 'Present';
        });
        setAttendanceSheet(null);
        setIsEditMode(false);
      }

      setAttendanceRecords(initialRecords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceSheet();
  }, [selectedGrade, selectedSection, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleToggleAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (students.length === 0) return;

    // Build payload records array
    const recordsPayload = students.map(s => ({
      student: s._id,
      status: attendanceRecords[s._id] || 'Present'
    }));

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/attendance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          grade: selectedGrade,
          section: selectedSection,
          records: recordsPayload
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit attendance');

      setSuccessMsg(isEditMode ? 'Attendance sheet updated successfully!' : 'Attendance sheet logged successfully!');
      setAttendanceSheet(data.sheet || {
        date: selectedDate,
        grade: selectedGrade,
        section: selectedSection,
        records: recordsPayload,
        updatedAt: new Date().toISOString()
      });
      setIsEditMode(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Summarize stats
  const totalCount = students.length;
  const presentCount = Object.values(attendanceRecords).filter(status => status === 'Present').length;
  const absentCount = totalCount - presentCount;
  const attendanceStatusText = attendanceSheet
    ? `Attendance taken for ${selectedGrade} - Section ${selectedSection}`
    : `Attendance not taken yet for ${selectedGrade} - Section ${selectedSection}`;
  const lastUpdated = attendanceSheet?.updatedAt
    ? new Date(attendanceSheet.updatedAt).toLocaleString()
    : null;

  return (
    <div className="attendance-page-container">
      <header className="attendance-header">
        <div>
          <h1>Daily Roll Call</h1>
          <p>Mark and update present/absent student records for school metrics.</p>
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
      <div className="attendance-filters-bar glass-panel">
        <div className="filter-group">
          <label className="filter-label">Grade / Class</label>
          {loadingClasses ? (
            <span className="loading-txt">Loading...</span>
          ) : classes.length === 0 ? (
            <span className="warning-txt">No Classes!</span>
          ) : (
            <select
              className="form-input selector-input"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {classes.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="filter-group">
          <label className="filter-label">Section</label>
          <select
            className="form-input selector-input"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Date</label>
          <div className="date-input-wrapper">
            <Calendar size={16} className="date-icon" />
            <input
              type="date"
              className="form-input selector-input date-field"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!loading && selectedGrade && selectedSection && selectedDate && (
        <div className={`attendance-status-card glass-panel ${attendanceSheet ? 'taken' : 'pending'}`}>
          <div className="attendance-status-main">
            <div className="attendance-status-icon">
              {attendanceSheet ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <h2>{attendanceSheet ? 'Attendance Taken' : 'Attendance Pending'}</h2>
              <p>{attendanceStatusText} on {new Date(selectedDate).toLocaleDateString()}</p>
              {lastUpdated && <span>Last updated: {lastUpdated}</span>}
            </div>
          </div>
          {students.length > 0 && (
            <div className="attendance-status-counts">
              <span>Total {totalCount}</span>
              <span>Present {presentCount}</span>
              <span>Absent {absentCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="attendance-loading">
          <div className="spinner"></div>
          <p>Loading class roster...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="attendance-empty-panel glass-panel">
          <AlertTriangle size={36} className="warn-icon" />
          <h3>No Classes Configured</h3>
          <p>You must configure classes before taking attendance.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="attendance-empty-panel glass-panel">
          <Users size={36} className="warn-icon" />
          <h3>No Students Found</h3>
          <p>There are no active students registered in <strong>{selectedGrade} - Section {selectedSection}</strong>.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="attendance-sheet-panel glass-panel">
          <div className="sheet-top-actions">
            <div className="status-overview">
              <span className="overview-pill total">Total: {totalCount}</span>
              <span className="overview-pill present">Present: {presentCount}</span>
              <span className="overview-pill absent">Absent: {absentCount}</span>
              {isEditMode && <span className="overview-pill edit-mode-pill">Modifying Log</span>}
            </div>
            
            <div className="toggle-shortcuts">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleToggleAll('Present')}>
                Mark All Present
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleToggleAll('Absent')}>
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="attendance-list-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Register ID</th>
                  <th className="align-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentStatus = attendanceRecords[student._id] || 'Present';
                  return (
                    <tr key={student._id} className={currentStatus === 'Absent' ? 'row-absent' : ''}>
                      <td className="bold-cell">{student.rollNumber}</td>
                      <td className="student-name-cell">{student.name}</td>
                      <td>{student.registerNumber}</td>
                      <td className="align-center">
                        <div className="status-selector-pills">
                          <button
                            type="button"
                            className={`pill-btn present ${currentStatus === 'Present' ? 'active' : ''}`}
                            onClick={() => handleStatusChange(student._id, 'Present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`pill-btn absent ${currentStatus === 'Absent' ? 'active' : ''}`}
                            onClick={() => handleStatusChange(student._id, 'Absent')}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sheet-footer">
            <button type="submit" className="btn btn-primary submit-sheet-btn" disabled={submitting}>
              <Save size={16} />
              <span>{submitting ? 'Recording...' : 'Submit Attendance'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TakeAttendance;
