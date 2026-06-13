import { useState, useEffect } from 'react';
import { Pencil, Plus, Trash2, ShieldAlert, X } from 'lucide-react';
import { apiUrl } from '../config/api';
import './SubjectManagement.css';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('/subjects'));
      if (!response.ok) throw new Error('Failed to retrieve subject list');
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl(editingId ? `/subjects/${editingId}` : '/subjects'), {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add subject');

      setName('');
      setCode('');
      setDescription('');
      setEditingId(null);
      setSuccessMsg(editingId ? 'Subject updated successfully!' : 'Subject configured successfully!');
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = subject => {
    setEditingId(subject._id);
    setName(subject.name);
    setCode(subject.code);
    setDescription(subject.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
  };

  const handleDeleteSubject = async (subjId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This might affect exams or grade history.')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/subjects/${subjId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete subject');

      setSuccessMsg('Subject removed successfully!');
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="subj-mgmt-container">
      <header className="subj-header">
        <div>
          <h1>Curriculum Subjects</h1>
          <p>Add and manage school subjects active in academic grading structures.</p>
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

      <div className="subj-grid">
        {/* Left Side: Create Subject Form */}
        <div className="glass-panel add-subj-panel">
          <h2>{editingId ? 'Edit Subject' : 'Configure Subject'}</h2>
          <form onSubmit={handleAddSubject}>
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. History, Mathematics, Science"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Code *</label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. HIST-10, MATH-SEC"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-input textarea-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief subject syllabus description..."
                rows="4"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={formLoading}>
              <Plus size={16} />
              <span>{formLoading ? 'Saving...' : editingId ? 'Update Subject' : 'Add Subject'}</span>
            </button>
            {editingId && <button type="button" className="btn btn-secondary" style={{width:'100%',marginTop:'10px'}} onClick={cancelEdit}><X size={16}/> Cancel Edit</button>}
          </form>
        </div>

        {/* Right Side: Subjects List */}
        <div className="glass-panel subj-list-panel">
          <h2>Active Curriculum Subjects</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching active subject list...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="class-empty">
              <p>No subjects configured yet.</p>
              <p className="sub-empty">Use the form to configure school curriculum subjects.</p>
            </div>
          ) : (
            <div className="subj-tiles-grid">
              {subjects.map((subj) => (
                <div key={subj._id} className="subj-card glass-card">
                  <div>
                    <div className="subj-card-top">
                      <h3>{subj.name}</h3>
                      <span className="subj-code-badge">{subj.code}</span>
                    </div>
                    {subj.description && <p>{subj.description}</p>}
                  </div>
                  <div className="subj-card-actions">
                    <button className="action-btn-sm" onClick={() => startEdit(subj)} title="Edit Subject"><Pencil size={16}/></button>
                    <button
                      className="action-btn-sm delete"
                      onClick={() => handleDeleteSubject(subj._id)}
                      title="Remove Subject"
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

export default SubjectManagement;
