import React from 'react';

const TeacherCard = ({ name, role, bio, email, avatar }) => {
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <div className="teacher-card">
      <div className="teacher-avatar">
        {avatar || initials}
      </div>
      <div className="teacher-info">
        <div className="teacher-name">{name}</div>
        <div className="teacher-role">{role}</div>
        <p className="teacher-bio">{bio}</p>
        <a href={`mailto:${email}`} className="teacher-email">
          {email}
        </a>
      </div>
    </div>
  );
};

export default TeacherCard;