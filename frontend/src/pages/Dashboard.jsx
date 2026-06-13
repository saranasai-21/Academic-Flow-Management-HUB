import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, School, Clock, IndianRupee, Award, ArrowRight, UserPlus, FileSpreadsheet, CalendarDays, CreditCard, Settings } from 'lucide-react';
import { apiUrl } from '../config/api';
import StatsCard from '../components/StatsCard';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(apiUrl('/students/stats'));
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }
        const data = await response.ok ? await response.json() : null;
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

if (loading) {
  return (
    <div className="dashboard-loading-container">
      <div className="spinner"></div>
      <p>Loading dashboard metrics...</p>
    </div>
  );
}

if (error) {
  return (
    <div className="dashboard-error-container glass-panel">
      <h3>Error Loading Data</h3>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}

// Calculate highest count for SVG Chart scaling
const maxDeptCount = stats?.departmentDistribution?.length > 0
  ? Math.max(...stats.departmentDistribution.map(d => d.count))
  : 1;

return (
  <div className="dashboard-container">
    <header className="dashboard-header">
      <div>
        <h1>Academic Dashboard</h1>
        <p>Real-time analytics and management overview</p>
      </div>
      <div className="header-date">
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </header>

    {/* Stats Cards Grid */}
    <div className="stats-grid">
      <StatsCard
        title="Total Students"
        value={stats?.totalStudents || 0}
        icon={Users}
        description="Enrolled in active classes"
        gradient="linear-gradient(135deg, #8b5cf6, #3b82f6)"
      />
      <StatsCard 
        title="Total Teachers" 
        value={stats?.totalTeachers || 0}
        icon={GraduationCap}
        description="Assigned academic staff"
        gradient="linear-gradient(135deg, #3b82f6, #06b6d4)"
      />
      <StatsCard
        title="Total Classes"
        value={stats?.totalClasses || 0}
        icon={School}
        description="Active grade levels and sections"
        gradient="linear-gradient(135deg, #10b981, #06b6d4)"
      />
      <StatsCard
        title="Average Attendance"
        value={`${stats?.avgAttendance || 0}%`}
        icon={Clock}
        description="Monthly school-wide rate"
        gradient="linear-gradient(135deg, #06b6d4, #8b5cf6)"
      />
      <StatsCard
        title="Fee Arrears Count"
        value={stats?.pendingFeesCount || 0}
        icon={IndianRupee}
        description={`Outstanding: ₹${(stats?.financials?.outstandingFees || 0).toLocaleString()}`}
        gradient="linear-gradient(135deg, #f59e0b, #ec4899)"
      />
      <StatsCard 
        title="Average Score" 
        value={`${stats?.avgGpa || 0}%`}
        icon={Award}
        description="Cumulative gradebook average"
        gradient="linear-gradient(135deg, #ec4899, #8b5cf6)"
      />
    </div>

    {/* Main Charts & Feeds Section */}
    <div className="dashboard-body-grid">

        {/* SVG Grade Chart Card */}
        <div className="dashboard-card glass-panel chart-card-container">
          <div className="card-header">
            <h3>Student Count by Grade</h3>
            <span className="card-subtitle">Enrollment volume per class level</span>
          </div>

        <div className="chart-canvas">
          {stats?.departmentDistribution?.length === 0 ? (
            <div className="no-data">No department data available</div>
          ) : (
            <div className="svg-bar-chart-container">
              <svg viewBox="0 0 500 240" className="bar-chart-svg">
                {/* Grid lines */}
                <line x1="50" y1="30" x2="480" y2="30" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="50" y1="95" x2="480" y2="95" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="50" y1="160" x2="480" y2="160" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="50" y1="210" x2="480" y2="210" stroke="var(--text-muted)" strokeWidth="1" />

                {stats?.departmentDistribution?.map((dept, index) => {
                  const barWidth = 32;
                  const spacing = 80;
                  const startX = 75 + index * spacing;
                  // Calculate height based on percentage of max count
                  const maxBarHeight = 150;
                  const barHeight = (dept.count / maxDeptCount) * maxBarHeight;
                  const startY = 210 - barHeight;

                  return (
                    <g key={dept.name} className="chart-bar-group">
                      <defs>
                        <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-purple)" />
                          <stop offset="100%" stopColor="var(--accent-cyan)" />
                        </linearGradient>
                      </defs>
                      {/* Hover helper background */}
                      <rect
                        x={startX - 10}
                        y="20"
                        width={barWidth + 20}
                        height="190"
                        fill="transparent"
                        className="hover-trigger-rect"
                      />
                      {/* The visible bar */}
                      <rect
                        x={startX}
                        y={startY}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={`url(#grad-${index})`}
                        className="animated-bar"
                      />
                      {/* Text Value */}
                      <text
                        x={startX + barWidth / 2}
                        y={startY - 8}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {dept.count}
                      </text>
                      {/* Department Label */}
                      <text
                        x={startX + barWidth / 2}
                        y="226"
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize="9"
                        fontWeight="500"
                        transform={`rotate(-15, ${startX + barWidth / 2}, 226)`}
                      >
                        {dept.name.length > 12 ? `${dept.name.slice(0, 10)}..` : dept.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar widgets */}
      <div className="dashboard-sidebar-widgets">

        {/* Quick Actions Card */}
        <div className="dashboard-card glass-panel quick-actions-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions-list">
            <button className="action-tile" onClick={() => navigate('/add-student')}>
              <div className="tile-icon-bg primary">
                <UserPlus size={20} />
              </div>
              <div className="tile-info">
                <h4>New Registration</h4>
                <span>Add a new student profile</span>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button className="action-tile" onClick={() => navigate('/students')}>
              <div className="tile-icon-bg success">
                <FileSpreadsheet size={20} />
              </div>
              <div className="tile-info">
                <h4>Manage Records</h4>
                <span>View and filter all registers</span>
              </div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button className="action-tile" onClick={() => navigate('/exams')}>
              <div className="tile-icon-bg primary"><CalendarDays size={20}/></div>
              <div className="tile-info"><h4>Schedule Exam</h4><span>Create and manage examinations</span></div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button className="action-tile" onClick={() => navigate('/fees')}>
              <div className="tile-icon-bg success"><CreditCard size={20}/></div>
              <div className="tile-info"><h4>Collect Fees</h4><span>Payments and outstanding balances</span></div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>

            <button className="action-tile" onClick={() => navigate('/settings')}>
              <div className="tile-icon-bg primary"><Settings size={20}/></div>
              <div className="tile-info"><h4>System Settings</h4><span>School profile and diagnostics</span></div>
              <ArrowRight size={16} className="tile-arrow" />
            </button>
          </div>
        </div>

        {/* Activity Feed Widget */}
        <div className="dashboard-card glass-panel feed-card">
          <h3>System Activity</h3>
          <div className="feed-list">
            {stats?.recentActivities?.length === 0 ? (
              <p className="no-feed">No recent events logged</p>
            ) : (
              stats?.recentActivities?.map((act, i) => (
                <div key={i} className="feed-item" onClick={() => navigate(`/students/${act.id}`)}>
                  <div className={`feed-indicator ${act.type}`}></div>
                  <div className="feed-content">
                    <p>{act.text}</p>
                    <span>{act.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  </div>
);
};

export default Dashboard;
