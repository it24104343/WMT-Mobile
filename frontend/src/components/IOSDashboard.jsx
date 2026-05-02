import React, { useState } from 'react';
import './IOSDashboard.css';

/**
 * iOS-Style Dashboard Component
 * Displays all pages as app icons in a grid layout like iOS home screen
 * 
 * Usage:
 * import IOSDashboard from './components/IOSDashboard';
 * <IOSDashboard />
 */

const IOSDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      color: '#5b7dff',
      badge: null,
      href: '/dashboard'
    },
    {
      id: 'classes',
      label: 'Classes',
      icon: '📚',
      color: '#7b68ee',
      badge: 3,
      href: '/classes'
    },
    {
      id: 'students',
      label: 'Students',
      icon: '👨‍🎓',
      color: '#00d4ff',
      badge: null,
      href: '/students'
    },
    {
      id: 'teachers',
      label: 'Teachers',
      icon: '👨‍🏫',
      color: '#ff6b6b',
      badge: null,
      href: '/teachers'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '✅',
      color: '#51cf66',
      badge: null,
      href: '/attendance'
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: '📝',
      color: '#ffd93d',
      badge: null,
      href: '/exams'
    },
    {
      id: 'materials',
      label: 'Materials',
      icon: '📄',
      color: '#a78bfa',
      badge: null,
      href: '/materials'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: '💳',
      color: '#f87171',
      badge: 1,
      href: '/payments'
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: '📢',
      color: '#38b6ff',
      badge: 2,
      href: '/announcements'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      color: '#a0a0c8',
      badge: null,
      href: '/profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      color: '#666666',
      badge: null,
      href: '/settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      color: '#ff8787',
      badge: 5,
      href: '/notifications'
    },
  ];

  const dockApps = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'Messages', icon: '💬', href: '/messages' },
    { label: 'Profile', icon: '👤', href: '/profile' },
    { label: 'Settings', icon: '⚙️', href: '/settings' },
  ];

  return (
    <div className="ios-dashboard">
      {/* Status Bar */}
      <div className="ios-status-bar">
        <span className="ios-time">{currentTime}</span>
        <span>📶 📡 🔋</span>
      </div>

      {/* Search Bar */}
      <div className="ios-search">
        <input 
          type="text" 
          className="search-input" 
          placeholder="🔍 Search"
        />
      </div>

      {/* App Grid */}
      <div className="ios-icons-grid">
        {apps.map((app) => (
          <a 
            key={app.id}
            href={app.href}
            className="app-icon-card"
            style={{ 
              '--card-color': app.color,
              textDecoration: 'none',
              color: 'inherit'
            }}
            title={app.label}
          >
            {app.badge && (
              <div className="app-badge">{app.badge}</div>
            )}
            <div className="app-icon">{app.icon}</div>
            <div className="app-label">{app.label}</div>
          </a>
        ))}
      </div>

      {/* Dock */}
      <div className="ios-dock">
        {dockApps.map((app, idx) => (
          <a 
            key={idx}
            href={app.href}
            className="dock-icon"
            title={app.label}
            style={{ textDecoration: 'none' }}
          >
            {app.icon}
          </a>
        ))}
      </div>
    </div>
  );
};

export default IOSDashboard;
