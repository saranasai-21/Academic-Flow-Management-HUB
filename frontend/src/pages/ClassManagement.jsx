import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, ShieldAlert, Sparkles, Edit2, IndianRupee } from 'lucide-react';
import { apiUrl } from '../config/api';
import './ClassManagement.css';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [editingId, setEditingId] = useState(null);
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [sections, setSections] = useState('A, B, C, D');
  const [classSubjects, setClassSubjects] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classResponse, subjectResponse] = await Promise.all([
        fetch(apiUrl('/classes')),
        fetch(apiUrl('/subjects'))
      ]);

      if (!classResponse.ok) throw new Error('Failed to retrieve class list');

      const classData = await classResponse.json();
      setClasses(classData);

      if (subjectResponse.ok) {
        const subjectData = await subjectResponse.json();
        setSubjects(subjectData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setClassName('');
    setClassDesc('');
    setSections('A, B, C, D');
    setClassSubjects('');
    setFeeAmount('');
  };

  const handleEditClass = (cls) => {
    setEditingId(cls._id);
    setClassName(cls.name || '');
    setClassDesc(cls.description || '');
    setSections((cls.sections || ['A']).join(', '));
    setClassSubjects((cls.subjects || []).join(', '));
    setFeeAmount(cls.feeAmount || '');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectQuickAdd = (subjectName) => {
    const current = classSubjects
      .split(',')
      .map(subject => subject.trim())
      .filter(Boolean);

    if (current.includes(subjectName)) {
      setClassSubjects(current.filter(subject => subject !== subjectName).join(', '));
    } else {
      setClassSubjects([...current, subjectName].join(', '));
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const endpoint = editingId
        ? apiUrl(`/classes/${editingId}`)
        : apiUrl('/classes');

      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: className.trim(),
          description: classDesc.trim(),
          sections,
          subjects: classSubjects,
          feeAmount: Number(feeAmount) || 0
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create class');

      resetForm();
      setSuccessMsg(editingId ? 'Class configuration updated successfully!' : 'Class configured successfully!');
      fetchClasses();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleApplyFees = async (classId) => {
    if (!window.confirm('Apply this class fee amount to all students currently registered in this class?')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/classes/${classId}/apply-fees`), {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to apply fee structure');

      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? Any students in this class will need to be re-assigned.')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/classes/${classId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete class');

      setSuccessMsg('Class removed successfully!');
      fetchClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadDefaults = async () => {
    if (!window.confirm('This will reset the class list and load the default Grade 1 to Grade 12 curriculum list. Proceed?')) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/classes/defaults'), {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load defaults');

      setSuccessMsg('Default school grades loaded successfully!');
      fetchClasses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="class-mgmt-container">
      <header className="class-mgmt-header">
        <div>
          <h1>School Grade Configurations</h1>
          <p>Configure grade levels, streams, and class sections active in the school.</p>
        </div>
        <button className="btn btn-secondary load-defaults-btn" onClick={handleLoadDefaults}>
          <Sparkles size={16} />
          <span>Load Default Grades (1-12)</span>
        </button>
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

      <div className="class-mgmt-grid">
        {/* Left Side: Add Class Form */}
        <div className="glass-panel add-class-panel">
          <h2>{editingId ? 'Edit Class Configuration' : 'Create Custom Class'}</h2>
          <form onSubmit={handleAddClass}>
            <div className="form-group">
              <label className="form-label">Class / Grade Name *</label>
              <input
                type="text"
                className="form-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 6, Kindergarten, Class 10 Special"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-input textarea-input"
                value={classDesc}
                onChange={(e) => setClassDesc(e.target.value)}
                placeholder="Brief curriculum description..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sections *</label>
              <input
                type="text"
                className="form-input"
                value={sections}
                onChange={(e) => setSections(e.target.value)}
                placeholder="e.g. A, B, C, D"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Subjects</label>
              <input
                type="text"
                className="form-input"
                value={classSubjects}
                onChange={(e) => setClassSubjects(e.target.value)}
                placeholder="e.g. Mathematics, Science, English"
              />
              {subjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {subjects.map(subject => (
                    <button
                      key={subject._id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSubjectQuickAdd(subject.name)}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Annual Fee Structure (INR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="e.g. 60000"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary submit-class-btn" disabled={formLoading}>
                <Plus size={16} />
                <span>{formLoading ? 'Saving...' : editingId ? 'Update Class' : 'Add Class'}</span>
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Classes List */}
        <div className="glass-panel classes-list-panel">
          <h2>Active Classes</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching active class list...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="class-empty">
              <p>No classes configured yet.</p>
              <p className="sub-empty">Click "Load Default Grades" or use the form to configure classes.</p>
            </div>
          ) : (
            <div className="classes-grid-layout">
              {classes.map((cls) => (
                <div key={cls._id} className="class-tile-card glass-card">
                  <div className="tile-main">
                    <h3>{cls.name}</h3>
                    {cls.description && <p>{cls.description}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {(cls.sections || ['A']).map(section => (
                        <span key={section} className="class-chip">Section {section}</span>
                      ))}
                    </div>
                    {cls.subjects && cls.subjects.length > 0 && (
                      <p style={{ marginTop: '10px' }}>
                        Subjects: {cls.subjects.join(', ')}
                      </p>
                    )}
                    <p style={{ marginTop: '8px', fontWeight: 700 }}>
                      Fee: {(cls.feeAmount || 0).toLocaleString()} INR
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="delete-tile-btn"
                      onClick={() => handleApplyFees(cls._id)}
                      title="Apply Fee Structure"
                    >
                      <IndianRupee size={16} />
                    </button>
                    <button
                      className="delete-tile-btn"
                      onClick={() => handleEditClass(cls)}
                      title="Edit Class"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="delete-tile-btn"
                      onClick={() => handleDeleteClass(cls._id)}
                      title="Remove Class"
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

export default ClassManagement;
