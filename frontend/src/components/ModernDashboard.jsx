import React, { useState } from 'react';
import './ModernDashboard.css';
import StatCard from './StatCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ModernDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const revenueData = [
    { month: 'Jan', revenue: 4000, students: 240 },
    { month: 'Feb', revenue: 3000, students: 221 },
    { month: 'Mar', revenue: 2000, students: 229 },
    { month: 'Apr', revenue: 2780, students: 200 },
    { month: 'May', revenue: 1890, students: 229 },
    { month: 'Jun', revenue: 2390, students: 200 },
  ];

  const stats = [
    { icon: '📚', label: 'Active Classes', value: '11', change: '+12%', type: 'blue' },
    { icon: '👨‍🎓', label: 'Students', value: '13', change: '+8%', type: 'cyan' },
    { icon: '👨‍🏫', label: 'Teachers', value: '9', change: '+5%', type: 'purple' },
    { icon: '💰', label: 'Total Revenue', value: 'LKR 30.5K', change: '+15%', type: 'green' },
  ];

  const recentEnrollments = [
    { id: 1, student: 'Mahela', class: 'Mathematics - Grade 10', enrollment: '4/5/2026', status: 'Active' },
    { id: 2, student: 'Mahela', class: 'Science - Grade 10', enrollment: '4/5/2026', status: 'Active' },
    { id: 3, student: 'Mahela', class: 'Mathematics - Grade 12', enrollment: '4/5/2026', status: 'Pending' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>🎓 Ceylon Scholars</h2>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <a href="#dashboard" className="sidebar-menu-link active">
              <span className="sidebar-menu-icon">📊</span>
              Dashboard
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#users" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">👥</span>
              Users
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#teachers" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">👨‍🏫</span>
              Teachers
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#assign-teachers" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">📋</span>
              Assign Teachers
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#students" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">👨‍🎓</span>
              Students
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#classes" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">📚</span>
              Classes
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#enrollments" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">📝</span>
              Enrollments
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#payments" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">💳</span>
              Payments
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#exams" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">📄</span>
              Exams
            </a>
          </li>
          <li className="sidebar-menu-item">
            <a href="#requests" className="sidebar-menu-link">
              <span className="sidebar-menu-icon">🎯</span>
              Requests
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-header-subtitle">Welcome back, admin</p>
          </div>
          <div className="header-actions">
            <input type="text" placeholder="Search..." style={{ maxWidth: '300px' }} />
            <button className="btn btn-primary">+ New Class</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-card-label">{stat.label}</div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className={`stat-card-change ${stat.change.startsWith('-') ? 'negative' : ''}`}>
                    {stat.change} from last month
                  </div>
                </div>
                <div className={`stat-card-icon ${stat.type}`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Revenue Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Revenue Trend</h3>
              <p className="chart-card-subtitle">Last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 125, 255, 0.1)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 31, 58, 0.8)', border: 'none', borderRadius: '10px', color: 'white' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#5b7dff" strokeWidth={3} dot={{ fill: '#5b7dff', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollment Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Student Enrollment</h3>
              <p className="chart-card-subtitle">Monthly breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 125, 255, 0.1)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 31, 58, 0.8)', border: 'none', borderRadius: '10px', color: 'white' }}
                />
                <Legend />
                <Bar dataKey="students" fill="#00d4ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Enrollments Table */}
        <div className="data-table">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(91, 125, 255, 0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Recent Enrollments</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Enrollment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEnrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>{enrollment.student}</td>
                  <td>{enrollment.class}</td>
                  <td>{enrollment.enrollment}</td>
                  <td>
                    <span className={`badge ${enrollment.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {enrollment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ModernDashboard;