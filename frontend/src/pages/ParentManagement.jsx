import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, Mail, Phone, Briefcase, Link, X, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './ParentManagement.css';

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for creating parent
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Link student selector state (parentId -> studentId)
  const [linkSelectors, setLinkSelectors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pRes, sRes] = await Promise.all([
        fetch(apiUrl('/parents')),
        fetch(apiUrl('/students'))
      ]);

      if (!pRes.ok || !sRes.ok) throw new Error('Failed to retrieve parent data');

      const pData = await pRes.json();
      const sData = await sRes.json();

      setParents(pData);
      setStudents(sData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddParent = async (e) => {
    e.preventDefault();
    if (!fatherName.trim() || !motherName.trim() || !phone.trim() || !emergencyContact.trim()) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/parents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          occupation: occupation.trim(),
          emergencyContact: emergencyContact.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create parent profile');

      setFatherName('');
      setMotherName('');
      setPhone('');
      setEmail('');
      setOccupation('');
      setEmergencyContact('');
      setSuccessMsg('Parent profile created successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm('Are you sure you want to delete this parent profile? Student profile emergency contacts will be unlinked.')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/parents/${parentId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete parent');

      setSuccessMsg('Parent profile removed successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLinkStudent = async (parentId) => {
    const studentId = linkSelectors[parentId];
    if (!studentId) return;

    try {
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/parents/link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, studentId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Linking failed');

      setSuccessMsg('Student linked to parent successfully!');
      setLinkSelectors(prev => ({ ...prev, [parentId]: '' }));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnlinkStudent = async (parentId, studentId) => {
    if (!window.confirm('Unlink this student from the parent profile?')) return;

    try {
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/parents/unlink'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, studentId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unlinking failed');

      setSuccessMsg('Student unlinked successfully!');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectLinkChange = (parentId, studentId) => {
    setLinkSelectors(prev => ({
      ...prev,
      [parentId]: studentId
    }));
  };

  // Helper: Get student detail name/roll from ID
  const getStudentDisplay = (sId) => {
    const student = students.find(s => s._id === sId);
    if (!student) return 'Unknown Student';
    return `${student.name} (${student.rollNumber} - ${student.grade})`;
  };

  return (
    <div className="parents-container">
      <header className="parents-header">
        <div>
          <h1>Parent Management</h1>
          <p>Register parent profiles and link family files directly to enrolled students.</p>
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

      <div className="parents-grid">
        {/* Add Parent Form */}
        <div className="glass-panel parents-editor">
          <h2>Create Parent Account</h2>
          <form onSubmit={handleAddParent}>
            <div className="form-group">
              <label className="form-label">Father Name *</label>
              <input
                type="text"
                className="form-input"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mother Name *</label>
              <input
                type="text"
                className="form-input"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="e.g. Sunita Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Phone *</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43219"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rajesh@gmail.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Father Occupation</label>
              <input
                type="text"
                className="form-input"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Engineer, Business"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Phone *</label>
              <input
                type="text"
                className="form-input"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. +91 98765 43211"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={formLoading}>
              <Plus size={16} />
              <span>{formLoading ? 'Creating...' : 'Create Parent'}</span>
            </button>
          </form>
        </div>

        {/* Parents Directory list */}
        <div className="glass-panel parents-list-panel">
          <h2>Family Accounts Directory</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching parent records...</p>
            </div>
          ) : parents.length === 0 ? (
            <div className="class-empty">
              <p>No parent accounts registered yet.</p>
              <p className="sub-empty">Use the form to configure new family folders.</p>
            </div>
          ) : (
            <div className="parents-directory">
              {parents.map((parent) => (
                <div key={parent._id} className="parent-card glass-card">
                  <div className="parent-card-header">
                    <h3>Father: {parent.fatherName}</h3>
                    <h3>Mother: {parent.motherName}</h3>
                    <span>Family ID: {parent._id.slice(0, 8)}</span>
                  </div>

                  <div className="parent-info-rows">
                    <p><Phone size={14} /> <strong>Primary Phone:</strong> {parent.phone}</p>
                    {parent.email && <p><Mail size={14} /> <strong>Email:</strong> {parent.email}</p>}
                    {parent.occupation && <p><Briefcase size={14} /> <strong>Occupation:</strong> {parent.occupation}</p>}
                    <p><Phone size={14} style={{ color: 'var(--accent-danger)' }} /> <strong>Emergency Contact:</strong> {parent.emergencyContact}</p>
                  </div>

                  {/* Linked Students List */}
                  <div className="linked-students-section">
                    <h4>Linked Students</h4>
                    {parent.linkedStudents && parent.linkedStudents.length > 0 ? (
                      parent.linkedStudents.map((sId) => (
                        <div key={sId} className="linked-student-row">
                          <span>{getStudentDisplay(sId)}</span>
                          <button
                            type="button"
                            className="action-btn-sm delete"
                            onClick={() => handleUnlinkStudent(parent._id, sId)}
                            title="Unlink student"
                            style={{ padding: '2px', borderRadius: '50%' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No students linked to this folder yet.</span>
                    )}

                    {/* Inline Link Form */}
                    <div className="link-student-inline-form">
                      <select
                        className="form-input link-student-select"
                        value={linkSelectors[parent._id] || ''}
                        onChange={(e) => handleSelectLinkChange(parent._id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <option value="">-- Select Student to Link --</option>
                        {students
                          .filter(s => !parent.linkedStudents.includes(s._id))
                          .map(s => (
                            <option key={s._id} value={s._id}>
                              {s.name} ({s.rollNumber} - {s.grade})
                            </option>
                          ))
                        }
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleLinkStudent(parent._id)}
                        disabled={!linkSelectors[parent._id]}
                        style={{ padding: '8px 12px', height: '34px', fontSize: '0.8rem' }}
                      >
                        <Link size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="card-actions" style={{ marginTop: 0 }}>
                    <button
                      className="action-btn-sm delete"
                      onClick={() => handleDeleteParent(parent._id)}
                      title="Delete Parent Profile"
                    >
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

export default ParentManagement;
