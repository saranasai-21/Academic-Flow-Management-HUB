import { useState } from 'react';
import { Eye, EyeOff, GraduationCap, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import './LoginPage.css';

const roleCards = [
  {
    role: 'admin',
    title: 'Admin',
    subtitle: 'Full school control',
    icon: ShieldCheck,
    email: 'admin@school.edu'
  },
  {
    role: 'teacher',
    title: 'Teacher',
    subtitle: 'Classes, attendance, exams',
    icon: UsersRound,
    email: 'ramesh.babu@school.edu'
  },
  {
    role: 'student',
    title: 'Student',
    subtitle: 'Profile, marks, fees',
    icon: UserRound,
    email: 'aarav.sharma@school.edu'
  }
];

const LoginPage = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const selected = roleCards.find(card => card.role === selectedRole);
  const SelectedIcon = selected.icon;

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({
      role: selectedRole,
      name: selected.title,
      email: selected.email
    });
  };

  return (
    <main className="login-shell">
      <div className="login-bg-shapes">
        <div className="grid-3d"></div>
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="cube cube-1">
          <div className="face front"></div>
          <div className="face back"></div>
          <div className="face left"></div>
          <div className="face right"></div>
          <div className="face top"></div>
          <div className="face bottom"></div>
        </div>
        <div className="cube cube-2">
          <div className="face front"></div>
          <div className="face back"></div>
          <div className="face left"></div>
          <div className="face right"></div>
          <div className="face top"></div>
          <div className="face bottom"></div>
        </div>
      </div>
      <section className="login-brand-panel">
        <div className="login-mark">
          <GraduationCap size={34} />
        </div>
        <h1>Academic Flow</h1>
        <p>One login for Admin, Teacher and Student panels with role-based access.</p>
        <div className="login-feature-row">
          <span>Attendance</span>
          <span>Results</span>
          <span>Fees</span>
          <span>Reports</span>
        </div>
      </section>

      <section className="login-card glass-panel">
        <div className="login-card-header">
          <SelectedIcon size={22} />
          <div>
            <h2>{selected.title} Login</h2>
            <p>Select a role to open the matching portal.</p>
          </div>
        </div>

        <div className="role-picker">
          {roleCards.map(({ role, title, subtitle, icon: Icon }) => (
            <button
              key={role}
              type="button"
              className={`role-card ${selectedRole === role ? 'active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <Icon size={20} />
              <span>{title}</span>
              <small>{subtitle}</small>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={selected.email} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value="password"
                readOnly
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary login-submit-btn">
            Open {selected.title} Panel
          </button>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
