import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon: Icon, description, gradient, trend }) => {
  return (
    <div className="stats-card-container glass-card" style={{ '--card-gradient': gradient }}>
      <div className="stats-card-content">
        <span className="stats-card-title">{title}</span>
        <h3 className="stats-card-value">{value}</h3>
        {description && <span className="stats-card-desc">{description}</span>}
      </div>
      <div className="stats-card-icon-wrapper">
        <Icon className="stats-card-icon" size={24} />
      </div>
      <div className="stats-card-glow-bg"></div>
    </div>
  );
};

export default StatsCard;
