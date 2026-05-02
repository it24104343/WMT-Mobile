import React from 'react';

const StepCard = ({ number, title, description }) => {
  return (
    <div className="step-card">
      <div className="step-number">{number}</div>
      <h3 className="step-title">{title}</h3>
      <p className="step-desc">{description}</p>
    </div>
  );
};

export default StepCard;