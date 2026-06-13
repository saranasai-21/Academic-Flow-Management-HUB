import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import './NoticeManagement.css';

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');
  const [formLoading, setFormLoading] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('/notices'));
      if (!response.ok) throw new Error('Failed to retrieve notice board bulletins');
      const data = await response.json();
      setNotices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setFormLoading(true);
      setError(null);
      setSuccessMsg('');

      const response = await fetch(apiUrl('/notices'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetAudience
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to post notice');

      setTitle('');
      setContent('');
      setTargetAudience('All');
      setSuccessMsg('Announcement posted successfully!');
      fetchNotices();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to remove this bulletin board notice?')) return;

    try {
      setError(null);
      const response = await fetch(apiUrl(`/notices/${noticeId}`), {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to remove notice');

      setSuccessMsg('Notice deleted successfully!');
      fetchNotices();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAudienceClass = (aud) => {
    if (aud === 'All') return 'audience-badge all';
    if (aud === 'Parents') return 'audience-badge parents';
    if (aud === 'Teachers') return 'audience-badge teachers';
    return 'audience-badge students';
  };

  return (
    <div className="notice-mgmt-container">
      <header className="notice-header">
        <div>
          <h1>Notice Board Bulletins</h1>
          <p>Broadcast alerts, reminders, and PTA updates to parents, teachers, and students.</p>
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

      <div className="notice-grid">
        {/* Post Notice Form */}
        <div className="glass-panel add-notice-panel">
          <h2>Post Announcement</h2>
          <form onSubmit={handlePostNotice}>
            <div className="form-group">
              <label className="form-label">Notice Title *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Lab Renovation"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience *</label>
              <select
                className="form-input"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              >
                <option value="All">All Audience</option>
                <option value="Parents">Parents Only</option>
                <option value="Teachers">Teachers Only</option>
                <option value="Students">Students Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bulletin Description *</label>
              <textarea
                className="form-input textarea-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Notice description details..."
                rows="6"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={formLoading}>
              <Plus size={16} />
              <span>{formLoading ? 'Posting...' : 'Post Notice'}</span>
            </button>
          </form>
        </div>

        {/* Notice Board List */}
        <div className="glass-panel notice-list-panel">
          <h2>Active Bulletins Board</h2>
          {loading ? (
            <div className="class-loading">
              <div className="spinner"></div>
              <p>Fetching notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="class-empty">
              <p>No active bulletins posted.</p>
              <p className="sub-empty">Use the creation form to broadcast school-wide announcements.</p>
            </div>
          ) : (
            <div className="notices-board-grid">
              {notices.map((n) => (
                <div key={n._id} className="notice-board-card glass-card">
                  <div className="notice-card-header">
                    <h3>{n.title}</h3>
                    <span className={getAudienceClass(n.targetAudience)}>
                      {n.targetAudience}
                    </span>
                  </div>
                  <div className="notice-content">
                    {n.content}
                  </div>
                  <div className="notice-card-footer">
                    <span className="notice-date-txt">{formatDate(n.date)}</span>
                    <button
                      className="action-btn-sm delete"
                      onClick={() => handleDeleteNotice(n._id)}
                      title="Remove Notice"
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

export default NoticeManagement;
