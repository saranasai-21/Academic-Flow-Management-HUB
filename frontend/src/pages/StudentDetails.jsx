import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Edit2, Trash2, 
  BookOpen, CalendarDays, Award, Wallet, ShieldAlert, ChevronLeft
} from 'lucide-react';
import { apiUrl } from '../config/api';
import './StudentDetails.css';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('academic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl(`/students/${id}`));
        if (!response.ok) {
          if (response.status === 404) throw new Error('Student profile not found');
          throw new Error('Failed to load student details');
        }
        const data = await response.json();
        setStudent(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      const response = await fetch(apiUrl(`/students/${id}`), {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Could not delete student record');
      
      // Redirect back to list
      navigate('/students');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="details-loading-container">
        <div className="spinner"></div>
        <p>Loading student folder...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-error-container glass-panel">
        <ShieldAlert size={48} className="error-icon" />
        <h3>Profile Retrieval Failed</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/students')}>
          Back to Directory
        </button>
      </div>
    );
  }

  // Get initials for profile picture
  const getInitials = (name) => {
    return name.trim().split(' ).map(n => n[0]).join(').toUpperCase();
  };

  // Convert dates nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'badge-active';
      case 'Suspended': return 'badge-suspended';
      case 'Graduated': return 'badge-graduated';
      default: return 'badge-inactive';
    }
  };

  // Calculate SVG Attendance Circle parameters
  const attendanceRate = student?.attendance?.rate || 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return (
    <div className="details-container">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate('/students')}>
        <ChevronLeft size={16} />
        <span>Back to Directory</span>
      </button>

      <div className="details-layout-grid">
        {/* Left Side: Personal Overview Card */}
        <div className="personal-panel-card glass-panel">
          <div className="avatar-header-section">
            <div className="detail-avatar" style={{ overflow: 'hidden' }}>
              {student.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="avatar-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                getInitials(student.name)
              )}
            </div>
            <h2>{student.name}</h2>
            <span className="detail-roll">{student.rollNumber}</span>
            <div className={`badge ${getStatusClass(student.status)}`}>
              {student.status}
            </div>
          </div>

          <div className="personal-details-list">
            <h3>Contact & Personal Info</h3>
            
            <div className="info-item">
              <Mail size={16} className="info-icon" />
              <div>
                <span className="info-label">Email Address</span>
                <p className="info-val">{student.email}</p>
              </div>
            </div>

            <div className="info-item">
              <Phone size={16} className="info-icon" />
              <div>
                <span className="info-label">Phone Number</span>
                <p className="info-val">{student.phone}</p>
              </div>
            </div>

            <div className="info-item">
              <Calendar size={16} className="info-icon" />
              <div>
                <span className="info-label">Date of Birth</span>
                <p className="info-val">{formatDate(student.dateOfBirth)}</p>
              </div>
            </div>

            <div className="info-item">
              <User size={16} className="info-icon" />
              <div>
                <span className="info-label">Gender</span>
                <p className="info-val">{student.gender}</p>
              </div>
            </div>

            <div className="info-item">
              <MapPin size={16} className="info-icon" />
              <div>
                <span className="info-label">Address</span>
                <p className="info-val address-txt">{student.address}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-secondary edit-profile-btn" onClick={() => navigate(`/edit-student/${student._id}`)}>
              <Edit2 size={16} />
              <span>Edit Folder</span>
            </button>
            <button className="btn btn-danger delete-profile-btn" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} />
              <span>Delete Record</span>
            </button>
          </div>
        </div>

        {/* Right Side: Academic details and logs */}
        <div className="academic-tabs-panel glass-panel">
          <nav className="tabs-header">
            <button 
              className={`tab-link ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              <BookOpen size={16} />
              <span>Academics</span>
            </button>
            <button 
              className={`tab-link ${activeTab === 'guardian' ? 'active' : ''}`}
              onClick={() => setActiveTab('guardian')}
            >
              <User size={16} />
              <span>Guardian</span>
            </button>
            <button 
              className={`tab-link ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              <Wallet size={16} />
              <span>Finance</span>
            </button>
            <button 
              className={`tab-link ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <Award size={16} />
              <span>Performance</span>
            </button>
          </nav>

          <div className="tab-content-container">
            {/* Tab: Academic details */}
            {activeTab === 'academic' && (
              <div className="tab-pane animated-fade-in">
                <div className="academic-overview-grid">
                  <div className="academic-metrics">
                    <div className="academic-metric-card">
                      <span className="academic-label">Grade / Class</span>
                      <p className="academic-value">{student.grade}</p>
                    </div>
                    <div className="academic-metric-card">
                      <span className="academic-label">Registration ID</span>
                      <p className="academic-value">{student.registerNumber}</p>
                    </div>
                    <div className="academic-metric-card">
                      <span className="academic-label">Class Section</span>
                      <p className="academic-value">Section {student.section}</p>
                    </div>
                    <div className="academic-metric-card">
                      <span className="academic-label">Enrollment Date</span>
                      <p className="academic-value">{formatDate(student.enrollmentDate)}</p>
                    </div>
                    <div className="academic-metric-card">
                      <span className="academic-label">Admission Number</span>
                      <p className="academic-value">{student.admissionNumber || 'N/A'}</p>
                    </div>
                    <div className="academic-metric-card">
                      <span className="academic-label">Admission Date</span>
                      <p className="academic-value">{formatDate(student.admissionDate)}</p>
                    </div>
                  </div>

                  {/* SVG Attendance Gauge */}
                  <div className="attendance-gauge-card glass-panel">
                    <h3>Attendance Rate</h3>
                    <div className="gauge-visualization">
                      <svg width="120" height="120" className="progress-circle-svg">
                        <circle 
                          cx="60" 
                          cy="60" 
                          r={radius} 
                          className="circle-bg" 
                        />
                        <circle 
                          cx="60" 
                          cy="60" 
                          r={radius} 
                          className="circle-progress" 
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            stroke: attendanceRate >= 80 
                              ? 'var(--accent-success)' 
                              : attendanceRate >= 65 
                              ? 'var(--accent-warning)' 
                              : 'var(--accent-danger)'
                          }}
                        />
                        <text x="60" y="65" textAnchor="middle" className="gauge-text">
                          {attendanceRate}%
                        </text>
                      </svg>
                    </div>
                    <div className="attendance-summary-text">
                      <p>Present: <strong>{student.attendance?.presentDays}</strong> days</p>
                      <p>Total Class: <strong>{student.attendance?.totalDays}</strong> days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Guardian details */}
            {activeTab === 'guardian' && (
              <div className="tab-pane animated-fade-in guardian-tab">
                {student.parent ? (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Linked Parent Account</h3>
                    <div className="guardian-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Father Name</span>
                        <p className="tile-value">{student.parent.fatherName || 'N/A'}</p>
                      </div>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Mother Name</span>
                        <p className="tile-value">{student.parent.motherName || 'N/A'}</p>
                      </div>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Parent Phone</span>
                        <p className="tile-value">{student.parent.phone || 'N/A'}</p>
                      </div>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Parent Email</span>
                        <p className="tile-value">{student.parent.email || 'N/A'}</p>
                      </div>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Occupation</span>
                        <p className="tile-value">{student.parent.occupation || 'N/A'}</p>
                      </div>
                      <div className="guardian-detail-tile">
                        <span className="tile-label">Emergency Contact</span>
                        <p className="tile-value">{student.parent.emergencyContact || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', borderRadius: 'var(--border-radius-sm)', background: 'hsla(350, 80%, 55%, 0.05)', border: '1px solid hsla(350, 80%, 55%, 0.2)' }}>
                    <p style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', margin: 0 }}>No formal Parent profile linked to this student yet.</p>
                  </div>
                )}

                <h3>Student Emergency Contact</h3>
                <div className="guardian-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="guardian-detail-tile">
                    <span className="tile-label">Full Name</span>
                    <p className="tile-value">{student.guardian?.name}</p>
                  </div>
                  <div className="guardian-detail-tile">
                    <span className="tile-label">Relationship</span>
                    <p className="tile-value">{student.guardian?.relationship}</p>
                  </div>
                  <div className="guardian-detail-tile" style={{ gridColumn: 'span 2' }}>
                    <span className="tile-label">Contact Phone</span>
                    <p className="tile-value">{student.guardian?.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Finance details */}
            {activeTab === 'finance' && (
              <div className="tab-pane animated-fade-in finance-tab">
                <div className="finance-header-grid">
                  <div className="finance-metric-box primary">
                    <span>Total Net Fees</span>
                    <h4>₹{(student.finance?.totalFees || 0).toLocaleString()}</h4>
                  </div>
                  <div className="finance-metric-box success">
                    <span>Fees Paid</span>
                    <h4>₹{(student.finance?.feesPaid || 0).toLocaleString()}</h4>
                  </div>
                  <div className="finance-metric-box danger">
                    <span>Outstanding Dues</span>
                    <h4>₹{(student.finance?.outstandingBalance || 0).toLocaleString()}</h4>
                  </div>
                </div>

                <div className="transactions-section">
                  <h3>Payment History</h3>
                  <div className="table-responsive">
                    {student.finance?.paymentHistory?.length === 0 ? (
                      <p className="no-transactions">No records of payments on file</p>
                    ) : (
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.finance?.paymentHistory?.map((pay, index) => (
                            <tr key={index}>
                              <td>{formatDate(pay.date)}</td>
                              <td>₹{pay.amount.toLocaleString()}</td>
                              <td>{pay.paymentMethod}</td>
                              <td>
                                <span className={`badge ${pay.status === 'Paid' ? 'badge-active' : pay.status === 'Failed' ? 'badge-suspended' : 'badge-warning'}`}>
                                  {pay.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Academic Grades & Performance */}
            {activeTab === 'performance' && (
              <div className="tab-pane animated-fade-in performance-tab">
                <div className="gpa-card-large">
                  <span className="gpa-large-label">Overall Performance Score</span>
                  <div className="gpa-badge-display">
                    <h3>{student.percentage ? `${student.percentage}%` : '0%'}</h3>
                  </div>
                </div>

                <div className="grades-section">
                  <h3>Report Card Details</h3>
                  <div className="table-responsive">
                    {student.grades?.length === 0 ? (
                      <p className="no-grades">No graded courses registered yet</p>
                    ) : (
                      <table className="grades-table">
                        <thead>
                          <tr>
                            <th>Term</th>
                            <th>Subject</th>
                            <th>Marks (%)</th>
                            <th>Grade Letter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.grades?.map((g, index) => (
                            <tr key={index}>
                              <td>{g.term}</td>
                              <td className="subject-name">{g.subject}</td>
                              <td className="grade-gpa">{g.marks}%</td>
                              <td>
                                <span className="grade-badge">{g.grade}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animated-dropdown">
            <h3>Delete Student Record?</h3>
            <p>Are you sure you want to permanently delete the profile for <strong>{student.name}</strong>? This operation cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
