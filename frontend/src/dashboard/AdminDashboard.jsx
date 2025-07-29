import React, { useState, useEffect } from 'react';
import OrganizationList from './OrganizationList';
import CourseList from './CourseList';
import CourseRequestManagement from './CourseRequestManagement';
// QuizManager has been integrated into CourseViewer
import RoleIndicator from '../components/RoleIndicator';
import { FaChevronLeft, FaChevronRight, FaBuilding, FaChartBar, FaBook, FaCog, FaCreditCard, FaTachometerAlt, FaShoppingCart, FaQuestionCircle } from 'react-icons/fa';
import { getToken, parseJwt } from '../utils/auth';


function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  const username = payload?.username || 'Unknown';
  const userRole = payload?.role || 'unknown';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/system_stats?username=${username}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStats(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch system statistics');
          setStats(null);
        }
      } catch (err) {
        console.error('Error fetching system stats:', err);
        setError('Network error when fetching system statistics');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystemStats();
  }, [username]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      background: '#f8fafc'
    }}>
      <RoleIndicator />
      {/* Sidebar */}
      <aside style={{
        width: 280,
        background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0',
        boxShadow: '4px 0 32px rgba(0,0,0,0.12)',
        borderRight: 'none',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : -300,
        height: '100vh',
        flexShrink: 0,
        zIndex: 120,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 280,
        maxWidth: 280,
      }}>
        <div style={{ 
          fontWeight: 900, 
          fontSize: 32, 
          textAlign: 'center', 
          marginBottom: 48, 
          color: '#f8fafc', 
          letterSpacing: -0.5,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎓 Impact
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
          {[
            { label: 'Dashboard', icon: <FaTachometerAlt />, color: '#3b82f6' },
            { label: 'Organization list', icon: <FaBuilding />, color: '#10b981' },
            { label: 'Courses', icon: <FaBook />, color: '#f59e0b' },
            { label: 'Course Requests', icon: <FaShoppingCart />, color: '#ec4899' },
            { label: 'Analytics', icon: <FaChartBar />, color: '#8b5cf6' },
            { label: 'Settings', icon: <FaCog />, color: '#6b7280' },
            { label: 'Payment', icon: <FaCreditCard />, color: '#ef4444' }
          ].map((item, idx) => (
            <button
              key={item.label}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                justifyContent: 'flex-start',
                height: 52,
                width: '100%',
                background: activePage === item.label 
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' 
                  : 'transparent',
                color: activePage === item.label ? '#f8fafc' : '#cbd5e1',
                fontWeight: activePage === item.label ? 700 : 500,
                fontSize: 15,
                border: activePage === item.label ? '1px solid rgba(59,130,246,0.3)' : 'none',
                borderRadius: 12,
                transition: 'all 0.3s ease',
                marginBottom: 4,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: activePage === item.label ? '0 8px 24px rgba(59,130,246,0.2)' : 'none',
                letterSpacing: 0.3,
                padding: '0 16px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => setActivePage(item.label)}
              onMouseOver={e => {
                if (activePage !== item.label) {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseOut={e => {
                if (activePage !== item.label) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              {activePage === item.label && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)',
                  borderRadius: '0 4px 4px 0'
                }}></div>
              )}
              <span style={{ 
                fontSize: 18, 
                display: 'flex', 
                alignItems: 'center',
                color: activePage === item.label ? item.color : 'inherit'
              }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ 
          textAlign: 'center', 
          fontSize: 13, 
          color: '#64748b', 
          opacity: 0.7, 
          marginBottom: 16,
          padding: '0 24px'
        }}>
          <div style={{ 
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            © 2025 LMS Platform
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
        overflowY: 'auto',
        marginLeft: sidebarOpen ? 280 : 0,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '100vh',
      }}>
        {activePage === 'Dashboard' && (
          <>
            {/* Header */}
            <header style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
              padding: '0 48px',
              height: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16 
              }}>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  📊 Admin Dashboard
                </div>
                <div style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#3730a3',
                  border: '1px solid rgba(59,130,246,0.2)'
                }}>
                  LIVE
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ 
                  fontWeight: 600, 
                  color: '#374151', 
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 16px',
                  background: 'rgba(59,130,246,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59,130,246,0.1)'
                }}>
                  <span style={{ color: '#64748b', fontWeight: 400 }}>Welcome back,</span>
                  <span style={{ 
                    color: '#3b82f6',
                    fontWeight: 700
                  }}>
                    {username}
                  </span>
                </div>
                <div style={{
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center', 
                  fontWeight: 800, 
                  fontSize: 20,
                  boxShadow: '0 8px 24px rgba(102,126,234,0.3)',
                  border: '3px solid rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102,126,234,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)';
                }}
                >
                  {username[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </header>

            {/* Dashboard Content */}
            <section style={{
              flex: 1,
              padding: '40px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              width: '100%'
            }}>
              {/* Analytics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                width: '100%'
              }}>
                {loading ? (
                  // Loading skeletons
                  Array(4).fill().map((_, i) => (
                    <div key={i} style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      padding: '32px 28px',
                      borderRadius: 20,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      minHeight: 160,
                      border: '1px solid rgba(255,255,255,0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}>
                      <div style={{ width: '80%', height: 24, background: '#eaeaea', borderRadius: 12, marginBottom: 20 }} />
                      <div style={{ width: '50%', height: 40, background: '#eaeaea', borderRadius: 12 }} />
                    </div>
                  ))
                ) : error ? (
                  // Error state
                  <div style={{
                    gridColumn: '1 / -1',
                    background: '#fee2e2',
                    padding: '32px 28px',
                    borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    border: '1px solid #fecaca'
                  }}>
                    <h3 style={{ margin: 0, color: '#dc2626', fontSize: 20 }}>Error Loading Data</h3>
                    <p style={{ marginTop: 12, color: '#7f1d1d' }}>{error}</p>
                  </div>
                ) : userRole === 'admin' ? [
                  // Superadmin stats
                  { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: '#3b82f6', bgColor: '#dbeafe' },
                  { label: 'Courses Created', value: stats?.total_courses || 0, icon: '📚', color: '#10b981', bgColor: '#d1fae5' },
                  { label: 'Active Organizations', value: stats?.active_organizations || 0, icon: '⚡', color: '#f59e0b', bgColor: '#fef3c7' },
                  { label: 'Total Organizations', value: stats?.total_organizations || 0, icon: '🏢', color: '#8b5cf6', bgColor: '#ede9fe' }
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    padding: '32px 28px',
                    borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    minHeight: 160,
                    border: '1px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100px',
                      background: `linear-gradient(135deg, ${stat.bgColor}, ${stat.color}20)`,
                      borderRadius: '50%',
                      transform: 'translate(30px, -30px)',
                      opacity: 0.3
                    }}></div>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: stat.bgColor,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      marginBottom: '16px',
                      border: `2px solid ${stat.color}20`
                    }}>
                      {stat.icon}
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 42, 
                        fontWeight: 900, 
                        color: stat.color,
                        lineHeight: 1,
                        marginBottom: '8px'
                      }}>
                        {stat.value.toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: 16, 
                        color: '#64748b', 
                        fontWeight: 600,
                        letterSpacing: 0.5
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                )) : [
                  // Portal admin stats
                  { label: 'Employee Count', value: stats?.employee_count || 0, icon: '👥', color: '#3b82f6', bgColor: '#dbeafe' },
                  { label: 'Courses Created', value: stats?.total_courses || 0, icon: '📚', color: '#10b981', bgColor: '#d1fae5' },
                  { label: 'Active Courses', value: stats?.active_courses || 0, icon: '🔍', color: '#f59e0b', bgColor: '#fef3c7' },
                  { label: 'Course Completion', value: stats?.completion_rate ? `${stats.completion_rate}%` : '0%', icon: '📊', color: '#8b5cf6', bgColor: '#ede9fe' }
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    padding: '32px 28px',
                    borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    minHeight: 160,
                    border: '1px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
                  }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100px',
                      background: `linear-gradient(135deg, ${stat.bgColor}, ${stat.color}20)`,
                      borderRadius: '50%',
                      transform: 'translate(30px, -30px)',
                      opacity: 0.3
                    }}></div>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: stat.bgColor,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      marginBottom: '16px',
                      border: `2px solid ${stat.color}20`
                    }}>
                      {stat.icon}
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 42, 
                        fontWeight: 900, 
                        color: stat.color,
                        lineHeight: 1,
                        marginBottom: '8px'
                      }}>
                        {stat.value.toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: 16, 
                        color: '#64748b', 
                        fontWeight: 600,
                        letterSpacing: 0.5
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Welcome Section */}
              <div style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 24,
                boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
                padding: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                  borderRadius: '50%',
                  opacity: 0.6
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '-30px',
                  width: '150px',
                  height: '150px',
                  background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
                  borderRadius: '50%',
                  opacity: 0.4
                }}></div>
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: '64px',
                    marginBottom: '24px'
                  }}>
                    🎉
                  </div>
                  <h2 style={{ 
                    fontSize: 36, 
                    fontWeight: 900, 
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 16,
                    lineHeight: 1.2
                  }}>
                    Welcome back, {username}!
                  </h2>
                  <p style={{ 
                    fontSize: 20, 
                    color: '#64748b', 
                    marginBottom: 32,
                    lineHeight: 1.6,
                    maxWidth: '600px'
                  }}>
                    Manage your organization, users, and settings from this powerful dashboard. Everything you need is just a click away.
                    {userRole === 'admin' && stats && !loading && (
                      <span style={{ 
                        display: 'block', 
                        marginTop: 16, 
                        fontSize: 16, 
                        background: 'rgba(243, 244, 246, 0.7)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        textAlign: 'left'
                      }}>
                        <strong style={{ color: '#3b82f6' }}>{stats.recent_users || 0}</strong> new users joined in the last 30 days.<br />
                        <strong style={{ color: '#10b981' }}>{stats.recent_courses || 0}</strong> new courses were created recently.
                      </span>
                    )}
                    {userRole === 'portal_admin' && stats && !loading && (
                      <span style={{ 
                        display: 'block', 
                        marginTop: 16, 
                        fontSize: 16, 
                        background: 'rgba(243, 244, 246, 0.7)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        textAlign: 'left'
                      }}>
                        You have <strong style={{ color: '#3b82f6' }}>{stats.employee_count || 0}</strong> employees in your organization.<br />
                        Course completion rate: <strong style={{ color: '#10b981' }}>{stats.completion_rate || 0}%</strong>
                      </span>
                    )}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.3)';
                    }}
                    >
                      🚀 Quick Actions
                    </button>
                    <button style={{
                      padding: '14px 28px',
                      background: 'transparent',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.color = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#64748b';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    >
                      📊 View Reports
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Organizations - Only for superadmin */}
              {userRole === 'admin' && stats && stats.recent_organizations && stats.recent_organizations.length > 0 && (
                <div style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: 24,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
                  padding: '32px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <h3 style={{ 
                    margin: '0 0 24px 0', 
                    fontSize: '24px', 
                    fontWeight: '800',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🏢</span> Recent Organizations
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {stats.recent_organizations.map((org, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: 'rgba(243, 244, 246, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '18px', color: '#1e293b' }}>{org.name}</div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>Created on: {new Date(org.created).toLocaleDateString()}</div>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          background: org.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: org.status === 'active' ? '#16a34a' : '#dc2626',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
        {activePage === 'Organization list' && (
          <OrganizationList />
        )}
        {activePage === 'Courses' && (
          <CourseList />
        )}
        {activePage === 'Course Requests' && (
          <CourseRequestManagement />
        )}
      </main>
    </div>
  );
}

const navLink = (active) => ({
  color: '#fff',
  fontWeight: active ? 600 : 500,
  fontSize: 16,
  textDecoration: 'none',
  opacity: active ? 1 : 0.8
});

const statCardStyle = {
  background: '#fff',
  padding: '24px',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(102,126,234,0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 120
};

export default AdminDashboard;