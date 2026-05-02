import React, { useState, useEffect } from 'react';

/**
 * Modern Theme Switcher Component
 * Allows users to switch between 6 modern themes
 * 
 * Usage in App.jsx:
 * import ThemeSwitcher from './components/ThemeSwitcher';
 * <ThemeSwitcher />
 */

const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState('theme-tech-blue.css');

  const themes = [
    // Original 8 Themes
    {
      id: 'modern-dashboard',
      name: '🎨 Modern Dashboard',
      file: 'theme-modern-dashboard.css',
      description: 'Sophisticated blue/purple with 3D effects',
      colors: ['#5b7dff', '#7b68ee', '#00d4ff'],
    },
    {
      id: 'education-center',
      name: '🎓 Education Center',
      file: 'theme-education-center.css',
      description: 'Modern education-focused with warm, welcoming colors',
      colors: ['#6366f1', '#ec4899', '#f59e0b'],
    },
    {
      id: 'tech-blue',
      name: '💎 Tech Blue & Purple',
      file: 'theme-tech-blue.css',
      description: 'Modern tech-focused with blue and purple gradients',
      colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    },
    {
      id: 'fresh-green',
      name: '🌿 Fresh Green & Teal',
      file: 'theme-fresh-green.css',
      description: 'Clean and fresh nature-inspired theme',
      colors: ['#10b981', '#06b6d4', '#14b8a6'],
    },
    {
      id: 'dark-gold',
      name: '✨ Elegant Dark Gold',
      file: 'theme-dark-gold.css',
      description: 'Premium dark theme with gold accents',
      colors: ['#d97706', '#f59e0b', '#fcd34d'],
    },
    {
      id: 'vibrant-coral',
      name: '🌊 Vibrant Coral & Orange',
      file: 'theme-vibrant-coral.css',
      description: 'Energetic and warm creative theme',
      colors: ['#ff6b6b', '#ff8c42', '#ffb703'],
    },
    {
      id: 'minimalist-slate',
      name: '📐 Minimalist Slate & Cyan',
      file: 'theme-minimalist-slate.css',
      description: 'Clean minimal design with cyan accents',
      colors: ['#0891b2', '#06b6d4', '#22d3ee'],
    },
    {
      id: 'sunset-pink',
      name: '🌅 Sunset Purple & Pink',
      file: 'theme-sunset-pink.css',
      description: 'Warm creative theme with sunset colors',
      colors: ['#a855f7', '#ec4899', '#f472b6'],
    },
    
    // New Premium Dark Themes
    {
      id: 'dark-teal-cyan',
      name: '🌊 Dark Teal & Cyan (ZeBeyond)',
      file: 'theme-dark-teal-cyan.css',
      description: 'ZeBeyond-inspired with bright cyan accents and dark teal backgrounds',
      colors: ['#00d9d9', '#0a5f5f', '#14f195'],
    },
    {
      id: 'dark-noir',
      name: '🌙 Dark Noir (Cyberpunk)',
      file: 'theme-dark-noir.css',
      description: 'High-contrast cyberpunk with neon magenta and cyan',
      colors: ['#ff00ff', '#00ffff', '#1a1a2e'],
    },
    {
      id: 'neon-purple',
      name: '💜 Neon Purple & Dark',
      file: 'theme-neon-purple.css',
      description: 'Premium luxury theme with vibrant purple and cyan tech accents',
      colors: ['#b733d0', '#00d4ff', '#2d1b4e'],
    },
    {
      id: 'volcano-orange',
      name: '🔥 Volcano Orange & Dark',
      file: 'theme-volcano-orange.css',
      description: 'Warm energetic theme with volcanic orange and golden accents',
      colors: ['#ff6b35', '#ffb703', '#2c1810'],
    },
    {
      id: 'ocean-blue',
      name: '🌊 Ocean Deep Blue & Aqua',
      file: 'theme-ocean-blue.css',
      description: 'Calm professional theme inspired by deep ocean waters',
      colors: ['#0099ff', '#00ffff', '#001a4d'],
    },
    {
      id: 'ios-dashboard',
      name: '📱 iOS Home Screen',
      file: 'theme-ios-dashboard.css',
      description: 'iOS-style app grid layout with home screen aesthetic',
      colors: ['#5b7dff', '#7b68ee', '#00d4ff'],
    },
  ];

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('preferredTheme') || 'theme-modern-dashboard.css';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName) => {
    let link = document.getElementById('theme-link');
    
    if (!link) {
      link = document.createElement('link');
      link.id = 'theme-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    link.href = `/styles/${themeName}`;
    setCurrentTheme(themeName);
    localStorage.setItem('preferredTheme', themeName);
  };

  return (
    <div className="theme-switcher">
      {/* Floating Theme Selector - Compact Version */}
      <div className="theme-switcher-compact">
        <label className="theme-label">🎨 Theme:</label>
        <select 
          value={currentTheme}
          onChange={(e) => applyTheme(e.target.value)}
          className="theme-select"
        >
          {themes.map(theme => (
            <option key={theme.id} value={theme.file}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        .theme-switcher {
          --tw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .theme-switcher-compact {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          gap: 10px;
          align-items: center;
          z-index: 999;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .theme-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .theme-select {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .theme-select:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .theme-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @media (max-width: 640px) {
          .theme-switcher-compact {
            top: auto;
            bottom: 20px;
            right: 20px;
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
          }

          .theme-label {
            font-size: 0.85rem;
          }

          .theme-select {
            width: 100%;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ThemeSwitcher;

/**
 * INSTALLATION INSTRUCTIONS:
 * 
 * 1. Copy this file to: src/components/ThemeSwitcher.jsx
 * 
 * 2. In App.jsx, add these imports:
 *    import ThemeSwitcher from './components/ThemeSwitcher';
 * 
 * 3. Add component to your layout (usually at the very top or in a layout wrapper):
 *    <ThemeSwitcher />
 * 
 * 4. Make sure your styles folder is in public/ or served correctly:
 *    public/styles/theme-tech-blue.css
 *    public/styles/theme-fresh-green.css
 *    etc...
 * 
 * 5. The component will:
 *    - Load previously selected theme from localStorage
 *    - Allow users to switch themes dynamically
 *    - Save theme preference for future sessions
 *    - Display as a compact selector in the top-right corner
 */