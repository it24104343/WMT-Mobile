import React from 'react';
import './Hero.css';

const Hero = ({ title, subtitle, image, ctaText, ctaLink, children }) => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
        {children}
        {ctaText && (
          <a href={ctaLink || '#'} className="btn btn-primary">
            {ctaText}
          </a>
        )}
      </div>
      {image && <div className="hero-image">{image}</div>}
    </div>
  );
};

export default Hero;