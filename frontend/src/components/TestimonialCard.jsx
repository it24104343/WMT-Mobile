import React from 'react';

const TestimonialCard = ({ quote, author, role, avatar, date }) => {
  return (
    <div className="testimonial-card">
      <div className="testimonial-quote">"{quote}"</div>
      <div className="testimonial-author">
        <div className="testimonial-avatar">
          {avatar || author[0]}
        </div>
        <div>
          <div className="testimonial-name">{author}</div>
          <div className="testimonial-role">{role}</div>
          {date && <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>{date}</div>}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;