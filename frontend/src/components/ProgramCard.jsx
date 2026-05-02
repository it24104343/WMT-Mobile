import React from 'react';

const ProgramCard = ({ icon, title, description, link, age }) => {
  return (
    <div className="program-card">
      <div className="program-card-image">
        {icon || '📚'}
      </div>
      <div className="program-card-content">
        {age && <div className="program-card-age">{age}</div>}
        <h3 className="program-card-title">{title}</h3>
        <p className="program-card-desc">{description}</p>
        {link && (
          <a href={link} className="program-card-link">
            Read More →
          </a>
        )}
      </div>
    </div>
  );
};

export default ProgramCard;