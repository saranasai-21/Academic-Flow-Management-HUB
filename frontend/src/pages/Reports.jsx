import React, { useState, useEffect } from 'react';
import { BarChart3, Coins, Award, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './Reports.css';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('/reports'));
      if (!response.ok) throw new Error('Failed to fetch reports analytics');
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="class-loading" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>Compiling school analytics reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-error-container glass-panel" style={{ padding: '40px' }}>
        <ShieldAlert size={48} className="error-icon" style={{ color: 'var(--accent-danger)' }} />
        <h3>Failed to Compile Reports</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchReports}>Retry Compilation</button>
      </div>
    );
  }

  const { feePendingStudents, classReports, topStudents, summary } = data;

  // Compute overall collection rate
  const expectedTotal = feePendingStudents.reduce((sum, s) => sum + s.totalFees, 0);
  const paidTotal = feePendingStudents.reduce((sum, s) => sum + s.feesPaid, 0);
  const rate = expectedTotal > 0 ? Math.round((paidTotal / expectedTotal) * 100) : 100;

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div>
          <h1>School Reports & Analytics</h1>
          <p>Comparative curriculum analytics, attendance registers, and pending balances summaries.</p>
        </div>
      </header>

      {/* Main Reports Grid */}
      <div className="reports-dashboard-grid">
        
        {/* Left Side: Class Performance and Dues */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Academic & Attendance Performance by Class */}
          <div className="glass-panel report-panel-card">
            <h2><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-cyan)' }} /> Class-wise Academic & Attendance Analytics</h2>
            {classReports.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No data compiled yet.</p>
            ) : (
              <div className="gradebook-table-wrapper">
                <table className="gradebook-table">
                  <thead>
                    <tr>
                      <th>Class Grade</th>
                      <th style={{ textAlign: 'center' }}>Students</th>
                      <th>Avg Academic Score (%)</th>
                      <th>Avg Attendance Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classReports.map((report, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{report.className}</td>
                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{report.studentCount}</td>
                        <td>
                          <div className="metric-bar-item">
                            <div className="metric-bar-label">
                              <span>{report.avgPercentage}%</span>
                            </div>
                            <div className="metric-bar-wrapper">
                              <div 
                                className="metric-bar-fill" 
                                style={{ 
                                  width: `${report.avgPercentage}%`,
                                  background: report.avgPercentage >= 85 
                                    ? 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))'
                                    : report.avgPercentage >= 65 
                                    ? 'linear-gradient(90deg, var(--accent-warning), var(--accent-cyan))'
                                    : 'linear-gradient(90deg, var(--accent-danger), var(--accent-warning))'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="metric-bar-item">
                            <div className="metric-bar-label">
                              <span>{report.avgAttendance}%</span>
                            </div>
                            <div className="metric-bar-wrapper">
                              <div 
                                className="metric-bar-fill" 
                                style={{ 
                                  width: `${report.avgAttendance}%`,
                                  background: report.avgAttendance >= 80 
                                    ? 'var(--accent-success)' 
                                    : report.avgAttendance >= 65 
                                    ? 'var(--accent-warning)' 
                                    : 'var(--accent-danger)'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Outstanding Fee Arrears Ledger */}
          <div className="glass-panel report-panel-card">
            <h2><Coins size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-danger)' }} /> Fee Arrears Outstanding Register</h2>
            {feePendingStudents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-success)' }}>
                <strong>No Fee Arrears Outstanding! All student billing profiles are settled.</strong>
              </div>
            ) : (
              <div className="gradebook-table-wrapper">
                <table className="gradebook-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Grade</th>
                      <th style={{ textAlign: 'right' }}>Total Fee (INR)</th>
                      <th style={{ textAlign: 'right' }}>Paid (INR)</th>
                      <th style={{ textAlign: 'right' }}>Arrears (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feePendingStudents.map((s) => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 600 }}>{s.rollNumber}</td>
                        <td>{s.name}</td>
                        <td>{s.grade} - {s.section}</td>
                        <td style={{ textAlign: 'right' }}>{s.totalFees.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-success)' }}>{s.feesPaid.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-danger)', fontWeight: 600 }}>{s.pending.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Faculty details, top students, etc */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Scorer Achievers */}
          <div className="glass-panel report-panel-card">
            <h2><Award size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-warning)' }} /> Top Performing Students</h2>
            {topStudents.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No graded profiles active.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topStudents.map((stud, sidx) => (
                  <div key={stud._id} className="top-student-row">
                    <div>
                      <span className="top-student-name">{stud.name}</span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {stud.rollNumber} • {stud.grade} Section {stud.section}
                      </span>
                    </div>
                    <span className="top-student-score">{stud.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* School-wide Metrics summary */}
          <div className="glass-panel report-panel-card">
            <h2><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-purple)' }} /> School Summary Totals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Enrolled Students:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{summary.totalStudents}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Teachers/Faculty:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{summary.totalTeachers}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Configured Classes:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{summary.totalClasses}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Accounts in Arrears:</span>
                <strong style={{ color: 'var(--accent-danger)' }}>{summary.pendingFeesCount}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Reports;
