import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, parseJwt, removeToken } from '../utils/auth';
import { 
  FaHome, 
  FaBook, 
  FaUser, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaVideo,
  FaFilePdf,
  FaQuestionCircle
} from 'react-icons/fa';

function EmployeeDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      setUserInfo(payload);
    }
  }, []);
  
  // Always fetch courses when userInfo is set, and also when switching to courses tab
  useEffect(() => {
    if (userInfo?.username) {
      fetchCourses();
    }
  }, [userInfo]);

  useEffect(() => {
    if (activeSection === 'courses' && userInfo?.username) {
      fetchCourses();
    }
    // Reset error and courses when switching away from courses
    if (activeSection !== 'courses') {
      setCourses([]);
      setError(null);
    }
  }, [activeSection, userInfo]);
  
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/my_courses?username=${userInfo.username}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.courses);
      } else {
        setError(data.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Network error while fetching courses');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };
  
  const renderContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FaVideo size={18} style={{ color: '#3b82f6' }} />;
      case 'pdf':
        return <FaFilePdf size={18} style={{ color: '#ef4444' }} />;
      case 'quiz':
        return <FaQuestionCircle size={18} style={{ color: '#8b5cf6' }} />;
      default:
        return <FaBook size={18} style={{ color: '#10b981' }} />;
    }
  };
  
  const handleCourseClick = (courseId) => {
    navigate(`/employee/course/${courseId}`);
  };

  const renderCoursesSection = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            border: '3px solid #f3f4f6',
            borderTopColor: '#3b82f6',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading your courses...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          maxWidth: '800px', 
          margin: '40px auto', 
          padding: '20px', 
          background: '#fef2f2', 
          color: '#b91c1c',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (courses.length === 0) {
      return (
        <div style={{ 
          background: '#f9fafb',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280',
          maxWidth: '800px',
          margin: '40px auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>No courses assigned yet</h3>
          <p>Courses assigned to you will appear here.</p>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px',
        padding: '20px'
      }}>
        {courses.map(course => (
          <div 
            key={course.id} 
            onClick={() => handleCourseClick(course.id)}
            style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e5e7eb'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
          >
            <div style={{ 
              height: '140px', 
              background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '40px'
            }}>
              {/* Course thumbnail or icon */}
              📚
            </div>
            
            <div style={{ padding: '20px' }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#1f2937'
              }}>{course.title}</h3>
              
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px', 
                margin: '0 0 16px 0',
                minHeight: '40px'
              }}>
                {course.description?.substring(0, 100) || 'No description available'}
                {course.description?.length > 100 ? '...' : ''}
              </p>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {course.module_count} {course.module_count === 1 ? 'Module' : 'Modules'}
                </div>
                
                <div style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  ✅ Active
                </div>
              </div>
              
              {/* Module types preview */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {course.modules.some(m => m.contents.some(c => c.content_type === 'video')) && (
                  <div title="Video content" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <FaVideo />
                    <span>Videos</span>
                  </div>
                )}
                
                {course.modules.some(m => m.contents.some(c => c.content_type === 'pdf')) && (
                  <div title="PDF content" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <FaFilePdf />
                    <span>PDFs</span>
                  </div>
                )}
                
                {course.modules.some(m => m.contents.some(c => c.content_type === 'quiz')) && (
                  <div title="Quiz content" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <FaQuestionCircle />
                    <span>Quizzes</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: '#f3f4f6',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${course.progress || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '4px'
                }}></div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                color: '#6b7280',
                fontSize: '12px'
              }}>
                <span>Progress: {course.progress ? Math.round(course.progress) : 0}%</span>
                <span>{course.completed_modules || 0}/{course.module_count} modules</span>
              </div>
              
              {/* Status badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '12px'
              }}>
                {course.progress === 100 ? (
                  <div style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✓ Completed
                  </div>
                ) : course.progress > 0 ? (
                  <div style={{
                    background: '#eff6ff',
                    color: '#3b82f6',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ↻ In Progress
                  </div>
                ) : (
                  <div style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⊕ Not Started
                  </div>
                )}
              </div>
              
              <button style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}>
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '70px' : '280px',
        background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
        transition: 'all 0.3s ease',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div>
              <h2 style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: '800',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                👨‍💼 Employee Portal
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                margin: '4px 0 0 0',
                fontWeight: '500'
              }}>
                Learning Dashboard
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
          >
            {sidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, padding: '20px 0' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FaHome },
            { id: 'courses', label: 'My Courses', icon: FaBook },
            { id: 'profile', label: 'Profile', icon: FaUser },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                padding: '12px 20px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backgroundColor: activeSection === item.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                margin: '4px 12px',
                borderRadius: '8px'
              }}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaSignOutAlt />
            {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>
        {activeSection === 'dashboard' && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            padding: '48px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎓</div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Welcome to Your Learning Portal!
            </h1>
            {userInfo && (
              <div style={{
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                borderRadius: '12px',
                padding: '24px',
                margin: '24px 0',
                textAlign: 'left'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 16px 0'
                }}>
                  Your Profile Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong style={{ color: '#374151' }}>Username:</strong>
                    <p style={{ margin: '4px 0', color: '#1e293b', fontWeight: '600' }}>{userInfo.username}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Role:</strong>
                    <p style={{ margin: '4px 0', color: '#1e293b', fontWeight: '600' }}>{userInfo.role}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>User ID:</strong>
                    <p style={{ margin: '4px 0', color: '#1e293b', fontWeight: '600' }}>{userInfo.user_id}</p>
                  </div>
                </div>
              </div>
            )}
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              margin: '0 0 32px 0'
            }}>
              Access your courses, track progress, and enhance your skills with our comprehensive learning management system.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginTop: '32px'
            }}>
              {[
                { title: 'My Courses', desc: 'Access assigned courses', icon: '📚', color: '#3b82f6', section: 'courses' },
                { title: 'Progress Tracking', desc: 'Monitor your learning', icon: '📈', color: '#10b981', section: 'progress' },
                { title: 'Certificates', desc: 'View achievements', icon: '🏆', color: '#f59e0b', section: 'certificates' },
              ].map((card, index) => (
                <div 
                  key={index} 
                  onClick={() => setActiveSection(card.section)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    border: `2px solid ${card.color}20`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = `${card.color}40`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = `${card.color}20`;
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    {card.title}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                  }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'courses' && (
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 24px 0',
              padding: '0 20px'
            }}>
              <FaBook style={{ marginRight: '12px', verticalAlign: 'middle' }} />
              My Courses
            </h1>
            {renderCoursesSection()}
          </div>
        )}

        {activeSection === 'profile' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 24px 0'
            }}>
              <FaUser style={{ marginRight: '12px', verticalAlign: 'middle' }} />
              Profile Settings
            </h1>
            
            {userInfo && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    color: 'white'
                  }}>
                    {userInfo.username?.substring(0, 1).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      {userInfo.username}
                    </h2>
                    <p style={{
                      fontSize: '16px',
                      color: '#6b7280',
                      margin: '0 0 12px 0'
                    }}>
                      Role: {userInfo.role}
                    </p>
                    <button style={{
                      background: 'none',
                      border: '1px solid #3b82f6',
                      color: '#3b82f6',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Change Avatar
                    </button>
                  </div>
                </div>
                
                {/* Profile details form */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4b5563',
                      marginBottom: '8px'
                    }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={userInfo.username}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4b5563',
                      marginBottom: '8px'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>
                
                <button style={{
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '16px'
                }}>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
