import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './TeacherManagement.css';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tRes, cRes] = await Promise.all([
        fetch(apiUrl('/teachers')),
        fetch(apiUrl('/classes'))
      ]);

      if (!tRes.ok || !cRes.ok) throw new Error('Failed to load data from server');

      const tData = await tRes.json();
      const cData = await cRes.json();

      setTeachers(tData);
      setClasses(cData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCheckboxChange = (className) => {
    setSelectedClasses(prev => 
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setSelectedClasses([]);
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !subject) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const url = isEditing
        ? apiUrl(`/teachers/${editId}`)
        : apiUrl('/teachers');
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          assignedClasses: selectedClasses
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Action failed');

      setSuccessMsg(isEditing ? 'Teacher profile updated successfully!' : 'Teacher added successfully!');
      handleResetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (teacher) => {
    setIsEditing(true);
    setEditId(teacher._id);
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setSubject(teacher.subject);
    setSelectedClasses(teacher.assignedClasses || []);
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher record?')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/teachers/${teacherId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Delete failed');

      setSuccessMsg('Teacher deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper to generate initials for avatar
  const getInitials = (tName) => {
    return String(tName || 'Teacher')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, var(--accent-purple), hsl(265, 80%, 60%))',
      'linear-gradient(135deg, var(--accent-cyan), hsl(200, 80%, 50%))',
      'linear-gradient(135deg, hsl(340, 75%, 50%), var(--accent-danger))'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="teacher-mgmt-container">
      <header className="teacher-header">
        <div>
          <h1>Teacher Management</h1>
          <p>Register instructors and assign classes and subjects to school faculty.</p>
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

      <div className="teacher-grid">
        {/* Editor Form Panel */}
        <div className="glass-panel editor-panel">
          <h2>{isEditing ? 'Edit Teacher Record' : 'Register New Faculty'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Babu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@school.edu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Subject *</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Science"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Grades / Classes</label>
              <div className="assigned-classes-selector">
                {classes.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No classes configured yet.</span>
                ) : (
                  classes.map(c => (
                    <label key={c._id}>
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(c.name)}
                        onChange={() => handleCheckboxChange(c.name)}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                <Plus size={16} />
                <span>{formLoading ? 'Saving...' : isEditing ? 'Update Teacher' : 'Add Teacher'}</span>
              </button>
              {isEditing && (
                <button type="button" className="btn btn-secondary" onClick={handleResetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Teachers Directory */}
        <div className="glass-panel list-panel">
          <h2>Active Faculty Directory</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching teacher list...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="class-empty">
              <p>No teachers registered yet.</p>
              <p className="sub-empty">Use the form to register new faculty.</p>
            </div>
          ) : (
            <div className="teachers-list">
              {teachers.map((teacher, index) => (
                <div key={teacher._id} className="teacher-card glass-card">
                  <div className="teacher-card-header">
                    <div className="teacher-initials" style={{ background: getAvatarGradient(index) }}>
                      {getInitials(teacher.name)}
                    </div>
                    <div className="teacher-meta">
                      <h3>{teacher.name}</h3>
                      <span>{teacher.subject} Teacher</span>
                    </div>
                  </div>

                  <div className="teacher-details-list">
                    <p><Mail size={14} /> <strong>Email:</strong> {teacher.email}</p>
                    <p><Phone size={14} /> <strong>Phone:</strong> {teacher.phone}</p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ASSIGNED CLASSES</span>
                    <div className="teacher-classes">
                      {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                        teacher.assignedClasses.map((cl, cidx) => (
                          <span key={cidx} className="class-chip">{cl}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None Assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="action-btn-sm edit" onClick={() => handleEditClick(teacher)} title="Edit Teacher">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn-sm delete" onClick={() => handleDeleteClick(teacher._id)} title="Delete Teacher">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
