import { useEffect, useState } from 'react';
import { CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import { apiUrl } from '../config/api';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({ schoolName: '', adminName: '', adminEmail: '', academicYear: '', currency: 'INR', attendanceThreshold: 75 });
  const [diagnostics, setDiagnostics] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl('/settings'));
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSettings(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async event => {
    event.preventDefault();
    setError('');
    const response = await fetch(apiUrl('/settings'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message || 'Unable to save settings');
    setSettings(data);
    setMessage('System settings saved in MongoDB.');
  };

  const runDiagnostics = async () => {
    setError('');
    const response = await fetch(apiUrl('/settings/diagnostics'));
    const data = await response.json();
    if (!response.ok) return setError(data.message || 'Diagnostics failed');
    setDiagnostics(data);
    setMessage('MongoDB diagnostics completed successfully.');
  };

  if (loading) return <div className="class-loading"><div className="spinner"></div><p>Loading system settings...</p></div>;

  return <div className="settings-container">
    <header className="settings-header"><div><h1>System Settings</h1><p>Persistent school configuration and MongoDB diagnostics.</p></div></header>
    {error && <div className="form-error-banner glass-panel">{error}</div>}
    {message && <div className="form-success-banner glass-panel"><CheckCircle2 size={16}/><span>{message}</span></div>}
    <div className="settings-grid">
      <div className="glass-panel settings-panel-card">
        <h2>School Configuration</h2>
        <form onSubmit={handleSave}>
          <SettingField label="School Name" value={settings.schoolName} onChange={value => update('schoolName', value)} />
          <SettingField label="Admin Name" value={settings.adminName} onChange={value => update('adminName', value)} />
          <SettingField label="Admin Email" type="email" value={settings.adminEmail} onChange={value => update('adminEmail', value)} />
          <SettingField label="Academic Year" value={settings.academicYear} onChange={value => update('academicYear', value)} />
          <SettingField label="Currency" value={settings.currency} onChange={value => update('currency', value)} />
          <SettingField label="Attendance Threshold (%)" type="number" value={settings.attendanceThreshold} onChange={value => update('attendanceThreshold', Number(value))} />
          <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Save Configuration</button>
        </form>
      </div>
      <div className="glass-panel settings-panel-card">
        <h2><Database size={19}/> Database Diagnostics</h2>
        <div className="sys-info-row"><span>Database Engine:</span><strong>MongoDB Atlas</strong></div>
        <div className="sys-info-row"><span>API Port:</span><strong>5050</strong></div>
        <div className="sys-info-row"><span>System Status:</span><strong style={{color:'var(--accent-success)'}}>{diagnostics?.status || 'Connected'}</strong></div>
        {diagnostics && <>
          <div className="sys-info-row"><span>Database:</span><strong>{diagnostics.database}</strong></div>
          <div className="sys-info-row"><span>Collections:</span><strong>{diagnostics.collections}</strong></div>
          <div className="sys-info-row"><span>Checked:</span><strong>{new Date(diagnostics.checkedAt).toLocaleString()}</strong></div>
        </>}
        <button type="button" className="btn btn-secondary settings-diagnostic-btn" onClick={runDiagnostics}><ShieldCheck size={16}/> Run MongoDB Diagnostics</button>
      </div>
    </div>
  </div>;
};

const SettingField = ({label,type='text',value,onChange}) => <div className="form-group"><label className="form-label">{label}</label><input className="form-input" type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} required/></div>;

export default Settings;
