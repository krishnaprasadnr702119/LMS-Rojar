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
  FaQuestionCircle,
  FaChartLine,
  FaCertificate
} from 'react-icons/fa';

function EmployeeDashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [coursesFetched, setCoursesFetched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      setUserInfo(payload);
    }
  }, []);
  
  // Fetch courses when userInfo is set
  useEffect(() => {
    if (userInfo?.username && !coursesFetched) {
      fetchCourses();
    }
  }, [userInfo, coursesFetched]);

  // Handle section-specific data fetching
  useEffect(() => {
    if (activeSection === 'progress' && userInfo?.username && courses.length > 0) {
      fetchProgressData();
    } else if (activeSection === 'certificates' && userInfo?.user_id) {
      fetchCertificates();
    }
  }, [activeSection, courses]);
  
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/employee/my_courses?username=${userInfo.username}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.courses);
        setCoursesFetched(true);
      } else {
        setError(data.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Network error while fetching courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressData = () => {
    // Create mock progress data based on current courses
    const totalCourses = courses.length;
    const completedCourses = courses.filter(course => course.progress >= 100).length;
    const inProgressCourses = courses.filter(course => course.progress > 0 && course.progress < 100).length;
    const totalModules = courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
    const completedModules = courses.reduce((sum, course) => 
      sum + (course.modules?.filter(module => module.completed).length || 0), 0);
    
    setProgressData({
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalModules,
      completedModules,
      averageProgress: totalCourses > 0 ? Math.round(courses.reduce((sum, course) => sum + (course.progress || 0), 0) / totalCourses) : 0,
      totalLearningHours: Math.round(completedModules * 1.5), // Assume 1.5 hours per module
      streakDays: Math.floor(Math.random() * 7) + 1, // Mock streak
      recentActivity: courses.slice(0, 3).map(course => ({
        type: 'course_progress',
        title: course.title,
        progress: course.progress || 0,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    });
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/employee/my_certificates?username=${userInfo.username}`);
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.certificates);
      } else {
        setError(data.error || 'Failed to fetch certificates');
      }
    } catch (err) {
      setError('Network error while fetching certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId) => {
    try {
      const response = await fetch(`/api/employee/download_certificate/${certificateId}?username=${userInfo.username}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `certificate_${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to download certificate');
      }
    } catch (err) {
      setError('Network error while downloading certificate');
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
          <button 
            onClick={() => {
              setCoursesFetched(false);
              setError(null);
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    if (coursesFetched && courses.length === 0) {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>No courses assigned yet</h3>
          <p style={{ margin: '0 0 16px 0' }}>Courses assigned to you will appear here.</p>
          <button 
            onClick={() => {
              setCoursesFetched(false);
              setError(null);
            }}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
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
              
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleCourseClick(course.id);
                }}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {course.progress === 100 ? '🎯 View Certificate' : 
                 course.progress > 0 ? '📚 Continue Learning' : '🚀 Start Learning'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProgressSection = () => {
    if (!progressData) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No Progress Data</h3>
          <p style={{ margin: 0 }}>Complete the "My Courses" section first to see your progress analytics.</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 20px' }}>
        {/* Overview Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {[
            { title: 'Total Courses', value: progressData.totalCourses, icon: '📚', color: '#3b82f6' },
            { title: 'Completed', value: progressData.completedCourses, icon: '✅', color: '#10b981' },
            { title: 'In Progress', value: progressData.inProgressCourses, icon: '⏳', color: '#f59e0b' },
            { title: 'Learning Hours', value: `${progressData.totalLearningHours}h`, icon: '⏰', color: '#8b5cf6' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${stat.color}20`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Progress Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Course Completion Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
              Overall Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(#10b981 0deg ${(progressData.averageProgress / 100) * 360}deg, #e5e7eb ${(progressData.averageProgress / 100) * 360}deg 360deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {progressData.averageProgress}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Stats */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
              Learning Statistics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                  {progressData.completedModules}/{progressData.totalModules}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Modules Completed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                  {progressData.streakDays}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Day Streak</div>
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '16px'
            }}>
              <div style={{
                width: `${progressData.totalModules > 0 ? (progressData.completedModules / progressData.totalModules) * 100 : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Recent Learning Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {progressData.recentActivity?.length > 0 ? (
              progressData.recentActivity.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ marginRight: '12px', fontSize: '20px' }}>📚</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Progress: {activity.progress}% • {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '4px',
                    background: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${activity.progress}%`,
                      height: '100%',
                      background: activity.progress === 100 ? '#10b981' : '#3b82f6'
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                <div>No recent activity</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCertificatesSection = () => {
    if (loading) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Loading Certificates...</h3>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#fef2f2',
          border: '2px solid #fecaca',
          color: '#b91c1c',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchCertificates();
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    if (certificates.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No Certificates Yet</h3>
          <p style={{ margin: 0 }}>Complete courses to earn certificates!</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {certificates.map((certificate) => (
            <div key={certificate.id} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '3px solid #10b981',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Certificate Header with Course Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#10b981',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaCertificate style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}>
                    CERTIFICATE OF COMPLETION
                  </div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1f2937',
                    lineHeight: '1.2'
                  }}>
                    {certificate.course_title}
                  </h3>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Certificate #{certificate.certificate_number}
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div style={{ marginBottom: '24px' }}>
                {/* Course Description */}
                {certificate.course_description && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '600',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Course Description
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.5'
                    }}>
                      {certificate.course_description}
                    </div>
                  </div>
                )}
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px'
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '10px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ color: '#065f46', marginBottom: '4px', fontWeight: '600' }}>Completion Date</div>
                    <div style={{ fontWeight: '700', color: '#047857', fontSize: '16px' }}>
                      {new Date(certificate.completion_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: certificate.final_score >= 80 ? '#f0fdf4' : certificate.final_score >= 70 ? '#fffbeb' : '#fef2f2',
                    borderRadius: '10px',
                    border: `1px solid ${certificate.final_score >= 80 ? '#bbf7d0' : certificate.final_score >= 70 ? '#fed7aa' : '#fecaca'}`
                  }}>
                    <div style={{ 
                      color: certificate.final_score >= 80 ? '#065f46' : certificate.final_score >= 70 ? '#92400e' : '#991b1b', 
                      marginBottom: '4px', 
                      fontWeight: '600' 
                    }}>Final Score</div>
                    <div style={{ 
                      fontWeight: '700', 
                      color: certificate.final_score >= 80 ? '#047857' : certificate.final_score >= 70 ? '#d97706' : '#dc2626',
                      fontSize: '20px'
                    }}>
                      {certificate.final_score}%
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1'
                  }}>
                    <div style={{ color: '#475569', marginBottom: '4px', fontWeight: '600' }}>Issued Date</div>
                    <div style={{ fontWeight: '700', color: '#334155', fontSize: '16px' }}>
                      {new Date(certificate.issued_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '10px',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ color: '#0c4a6e', marginBottom: '4px', fontWeight: '600' }}>Status</div>
                    <div style={{
                      fontWeight: '700',
                      color: certificate.status === 'active' ? '#0369a1' : '#6b7280',
                      textTransform: 'capitalize',
                      fontSize: '16px'
                    }}>
                      {certificate.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <button
                  onClick={() => downloadCertificate(certificate.id)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <FaFilePdf style={{ fontSize: '16px' }} />
                  Download Certificate
                </button>
                <button
                  onClick={() => window.open(`/api/verify_certificate?certificate_number=${certificate.certificate_number}&verification_hash=${certificate.verification_hash}`, '_blank')}
                  style={{
                    padding: '14px 20px',
                    background: '#ffffff',
                    color: '#374151',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.color = '#10b981';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.color = '#374151';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Verify Online
                </button>
              </div>

              {/* Certificate decorative elements */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                opacity: '0.1'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                left: '-5px',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(225deg, #10b981, #059669)',
                borderRadius: '50%',
                opacity: '0.08'
              }} />
              
              {/* Achievement badge for high scores */}
              {certificate.final_score >= 90 && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: '#fbbf24',
                  color: '#92400e',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Excellence
                </div>
              )}
            </div>
          ))}
        </div>
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
            { id: 'progress', label: 'Progress Tracking', icon: FaChartLine },
            { id: 'certificates', label: 'My Certificates', icon: FaCertificate },
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
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return '🌅 Good Morning!';
                if (hour < 17) return '☀️ Good Afternoon!';
                return '🌙 Good Evening!';
              })()} Welcome to Your Learning Portal!
            </h1>
            {userInfo && (
              <>
                {/* Quick Stats Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '20px',
                  margin: '32px 0',
                  maxWidth: '100%'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{courses.length}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Total Courses</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                      {courses.filter(course => course.progress >= 100).length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Completed</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                      {courses.filter(course => course.progress > 0 && course.progress < 100).length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>In Progress</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                      {courses.reduce((sum, course) => sum + (course.module_count || 0), 0)}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Total Modules</div>
                  </div>
                </div>

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
              </>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '0 0 24px 0',
              padding: '0 20px'
            }}>
              <button
                onClick={() => setActiveSection('dashboard')}
                style={{
                  background: 'none',
                  border: '2px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#3b82f6';
                }}
              >
                ← Back
              </button>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                <FaBook style={{ marginRight: '12px', verticalAlign: 'middle' }} />
                My Courses
              </h1>
            </div>
            {renderCoursesSection()}
          </div>
        )}

        {activeSection === 'progress' && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '0 0 24px 0',
              padding: '0 20px'
            }}>
              <button
                onClick={() => setActiveSection('dashboard')}
                style={{
                  background: 'none',
                  border: '2px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#3b82f6';
                }}
              >
                ← Back
              </button>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                📈 Progress Tracking
              </h1>
            </div>
            {renderProgressSection()}
          </div>
        )}

        {activeSection === 'certificates' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '1000px',
            margin: '0 auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                backgroundColor: '#10b981',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaCertificate style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                My Certificates
              </h1>
            </div>
            {renderCertificatesSection()}
          </div>
        )}

        {activeSection === 'profile' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '1000px',
            margin: '0 auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => setActiveSection('dashboard')}
                style={{
                  background: 'none',
                  border: '2px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#3b82f6';
                }}
              >
                ← Back
              </button>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                <FaUser style={{ marginRight: '12px', verticalAlign: 'middle' }} />
                Profile Settings
              </h1>
            </div>
            
            {userInfo && (
              <div>
                {/* Profile Header Section */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: '20px'
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
                      color: 'white',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      {userInfo.username?.substring(0, 1).toUpperCase() || '?'}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        background: '#10b981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        border: '3px solid white'
                      }}>
                        📷
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: '0 0 8px 0'
                      }}>
                        {userInfo.username}
                      </h2>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          background: '#eff6ff',
                          color: '#3b82f6',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {userInfo.role}
                        </div>
                        <div style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          ● Active
                        </div>
                      </div>
                      <p style={{
                        color: '#6b7280',
                        margin: '0 0 16px 0',
                        fontSize: '16px'
                      }}>
                        Member since {new Date().getFullYear()} • ID: {userInfo.user_id}
                        <br />
                        <span style={{ 
                          fontSize: '14px',
                          background: '#f0fdf4',
                          color: '#16a34a',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          🟢 Last login: Today
                        </span>
                      </p>
                    </div>
                    <button style={{
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Edit Profile Photo
                    </button>
                  </div>
                </div>

                {/* Settings Sections */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                  gap: '24px'
                }}>
                  
                  {/* Personal Information */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 20px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      👤 Personal Information
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
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
                            fontSize: '16px',
                            color: '#6b7280'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Learning Preferences */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 20px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🎯 Learning Preferences
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Preferred Learning Style
                        </label>
                        <select style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          fontSize: '16px'
                        }}>
                          <option>Visual Learning</option>
                          <option>Audio Learning</option>
                          <option>Reading/Writing</option>
                          <option>Kinesthetic Learning</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Daily Learning Goal (minutes)
                        </label>
                        <input
                          type="number"
                          placeholder="30"
                          min="15"
                          max="300"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '10px'
                        }}>
                          Interested Topics
                        </label>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {['Technology', 'Business', 'Design', 'Marketing', 'Leadership', 'Communication'].map((topic, index) => (
                            <div 
                              key={index} 
                              onClick={() => {
                                console.log(`Selected topic: ${topic}`);
                              }}
                              style={{
                                background: index % 2 === 0 ? '#eff6ff' : '#f3f4f6',
                                border: index % 2 === 0 ? '1px solid #3b82f6' : '1px solid #d1d5db',
                                color: index % 2 === 0 ? '#3b82f6' : '#6b7280',
                                borderRadius: '20px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#3b82f6';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = index % 2 === 0 ? '#eff6ff' : '#f3f4f6';
                                e.currentTarget.style.color = index % 2 === 0 ? '#3b82f6' : '#6b7280';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              {topic}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 20px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔔 Notification Settings
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { title: 'Course Reminders', desc: 'Get reminded about upcoming courses and deadlines', enabled: true },
                        { title: 'Progress Updates', desc: 'Receive notifications about your learning progress', enabled: true },
                        { title: 'New Course Assignments', desc: 'Be notified when new courses are assigned to you', enabled: false },
                        { title: 'Achievement Badges', desc: 'Get notified when you earn new badges or certificates', enabled: true }
                      ].map((setting, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: index < 3 ? '1px solid #f3f4f6' : 'none'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1e293b',
                              marginBottom: '4px'
                            }}>
                              {setting.title}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              {setting.desc}
                            </div>
                          </div>
                          <div 
                            onClick={() => {
                              // Toggle functionality placeholder
                              console.log(`Toggled ${setting.title}`);
                            }}
                            style={{
                              width: '44px',
                              height: '24px',
                              background: setting.enabled ? '#10b981' : '#9ca3af',
                              borderRadius: '12px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              background: 'white',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '2px',
                              left: setting.enabled ? '22px' : '2px',
                              transition: 'all 0.2s'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy & Security */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 20px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔒 Privacy & Security
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        Change Password
                        <span style={{ fontSize: '16px' }}>→</span>
                      </button>
                      
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        Two-Factor Authentication
                        <span style={{ fontSize: '16px' }}>→</span>
                      </button>
                      
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        Download My Data
                        <span style={{ fontSize: '16px' }}>→</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '32px',
                  padding: '20px 0',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button style={{
                    background: 'none',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Reset All Settings
                  </button>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
                      background: 'none',
                      border: '1px solid #d1d5db',
                      color: '#6b7280',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Cancel
                    </button>
                    
                    <button style={{
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
