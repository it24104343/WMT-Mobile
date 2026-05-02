import React from 'react';

const StatCard = ({ number, label, icon }) => {
  return (
    <div className="stat-card">
      {icon && <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>}
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;