import React, { useState, useEffect } from 'react';
import { getToken, parseJwt } from '../utils/auth';

function EnhancedDashboardContent() {
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();
        const payload = token ? parseJwt(token) : null;
        const username = payload?.username;
        if (!username) {
          setError('User information not found');
          setLoading(false);
          return;
        }
        // Fetch organization statistics
        const orgResponse = await fetch(`/api/portal_admin/organization_statistics?username=${username}`);
        const orgData = await orgResponse.json();
        if (orgData.success) {
          setStats(orgData); // orgData contains all stats at the top level
        } else {
          setError(orgData.error || 'Failed to fetch statistics');
        }
        // Fetch system-wide statistics (optional, can be removed if not needed)
        // const sysResponse = await fetch(`/api/portal_admin/system_stats?username=${username}`);
        // const sysData = await sysResponse.json();
        // if (sysData.success) setSystemStats(sysData);
      } catch (err) {
        setError('Network error while fetching statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '70vh'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
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
          <div style={{ color: '#6b7280', fontSize: '16px' }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          color: '#dc2626'
        }}>
          <h3 style={{ marginTop: 0 }}>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Dashboard display when stats are loaded
  return (
    <div style={{ padding: '24px' }}>
      {stats ? (
        <>
          {/* Organization Stats Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Total Employees</h3>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.organization.total_employees}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Assigned Courses</h3>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.organization.total_courses}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Overall Completion</h3>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.organization.overall_completion_rate.toFixed(1)}%</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Employees at Risk</h3>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>{stats.organization.employees_at_risk}</div>
            </div>
          </div>
          
          {/* Course Progress Section */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px', fontWeight: '600' }}>
              Course Completion Rates
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stats.course_statistics.map(course => (
                <div key={course.id}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px' 
                  }}>
                    <div style={{ fontWeight: '500' }}>{course.title}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px' 
                    }}>
                      <span>{course.enrolled_count} enrolled</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: course.completion_rate > 75 ? '#10b981' : 
                               course.completion_rate > 40 ? '#3b82f6' : '#f59e0b'
                      }}>
                        {course.completion_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${course.completion_rate}%`,
                      height: '100%',
                      background: course.completion_rate > 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 
                                 course.completion_rate > 40 ? 'linear-gradient(90deg, #3b82f6, #1e40af)' : 
                                 'linear-gradient(90deg, #f59e0b, #d97706)',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Employees at Risk */}
          {stats.employees_at_risk.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px', fontWeight: '600', color: '#dc2626' }}>
                Employees at Risk
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.employees_at_risk.map(emp => (
                  <div key={emp.id} style={{
                    background: '#fff5f5',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #fee2e2'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{emp.username}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{emp.email}</div>
                      </div>
                      <div style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        At Risk
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      Risk courses:
                    </div>
                    
                    {emp.risk_courses.map(course => (
                      <div key={course.course_id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div>{course.title}</div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <span>{course.progress.toFixed(1)}% completed</span>
                          <span style={{ 
                            fontWeight: '600', 
                            color: course.risk_score > 70 ? '#dc2626' : '#f59e0b'
                          }}>
                            Risk: {course.risk_score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          padding: '40px 24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '24px' }}>Welcome to your Dashboard</h2>
          <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
            Loading organization statistics...
          </p>
        </div>
      )}
    </div>
  );
}

export default EnhancedDashboardContent;
//                       Risk courses:
//                     </div>
                    
//                     {emp.risk_courses.map(course => (
//                       <div key={course.course_id} style={{ 
//                         display: 'flex', 
//                         alignItems: 'center', 
//                         justifyContent: 'space-between',
//                         padding: '8px 12px',
//                         background: 'white',
//                         borderRadius: '6px',
//                         marginBottom: '4px',
//                         border: '1px solid #f3f4f6'
//                       }}>
//                         <div>{course.title}</div>
//                         <div style={{ 
//                           display: 'flex', 
//                           alignItems: 'center',
//                           gap: '16px'
//                         }}>
//                           <span>{course.progress.toFixed(1)}% completed</span>
//                           <span style={{ 
//                             fontWeight: '600', 
//                             color: course.risk_score > 70 ? '#dc2626' : '#f59e0b'
//                           }}>
//                             Risk: {course.risk_score}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         <div style={{
//           background: 'white',
//           borderRadius: '12px',
//           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
//           padding: '40px 24px',
//           textAlign: 'center'
//         }}>
//           <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
//           <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '24px' }}>Welcome to your Dashboard</h2>
//           <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
//             Loading organization statistics...
//           </p>
//         </div>
//       )}
      
//       {/* Detail Modal */}
//       {showDetailModal && systemStats && (
//         <div style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           background: 'rgba(0, 0, 0, 0.5)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           zIndex: 1000
//         }} onClick={() => setShowDetailModal(false)}>
//           <div style={{
//             background: 'white',
//             borderRadius: '16px',
//             boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
//             width: '90%',
//             maxWidth: '900px',
//             maxHeight: '80vh',
//             overflow: 'auto',
//             padding: '0',
//             position: 'relative'
//           }} onClick={(e) => e.stopPropagation()}>
//             {/* Modal Header */}
//             <div style={{
//               padding: '24px 32px',
//               borderBottom: '1px solid #e5e7eb',
//               position: 'sticky',
//               top: 0,
//               background: 'white',
//               zIndex: 1,
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center'
//             }}>
//               <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>System Statistics</h2>
//               <button 
//                 style={{
//                   background: 'transparent',
//                   border: 'none',
//                   fontSize: '24px',
//                   cursor: 'pointer',
//                   color: '#6b7280'
//                 }}
//                 onClick={() => setShowDetailModal(false)}
//               >
//                 ×
//               </button>
//             </div>
            
//             {/* Modal Body */}
//             <div style={{ padding: '32px' }}>
//               {/* User Statistics Section */}
//               <div style={{ marginBottom: '40px' }}>
//                 <h3 style={{
//                   fontSize: '20px',
//                   fontWeight: '600',
//                   marginTop: 0,
//                   marginBottom: '20px',
//                   color: '#1f2937',
//                   borderBottom: '2px solid #6366f1',
//                   paddingBottom: '10px',
//                   display: 'inline-block'
//                 }}>
//                   User Statistics
//                 </h3>
                
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//                   gap: '24px',
//                   marginBottom: '24px'
//                 }}>
//                   <div style={{
//                     background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Total Users</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.total_users}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Employees</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.users_by_role.employees}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #ec4899, #db2777)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Admins</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.users_by_role.admins}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Portal Admins</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.users_by_role.portal_admins}</div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Course Statistics Section */}
//               <div style={{ marginBottom: '40px' }}>
//                 <h3 style={{
//                   fontSize: '20px',
//                   fontWeight: '600',
//                   marginTop: 0,
//                   marginBottom: '20px',
//                   color: '#1f2937',
//                   borderBottom: '2px solid #6366f1',
//                   paddingBottom: '10px',
//                   display: 'inline-block'
//                 }}>
//                   Course Statistics
//                 </h3>
                
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//                   gap: '24px',
//                   marginBottom: '24px'
//                 }}>
//                   <div style={{
//                     background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Total Courses</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.courses.total}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #10b981, #059669)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Created This Month</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.courses.created_this_month}</div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Organization Statistics Section */}
//               <div>
//                 <h3 style={{
//                   fontSize: '20px',
//                   fontWeight: '600',
//                   marginTop: 0,
//                   marginBottom: '20px',
//                   color: '#1f2937',
//                   borderBottom: '2px solid #6366f1',
//                   paddingBottom: '10px',
//                   display: 'inline-block'
//                 }}>
//                   Organization Statistics
//                 </h3>
                
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//                   gap: '24px'
//                 }}>
//                   <div style={{
//                     background: 'linear-gradient(135deg, #f59e0b, #d97706)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Total Organizations</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.organizations.total}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #10b981, #059669)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Active Subscriptions</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.organizations.active}</div>
//                   </div>
                  
//                   <div style={{
//                     background: 'linear-gradient(135deg, #ef4444, #dc2626)',
//                     color: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', opacity: 0.9 }}>Inactive Subscriptions</h4>
//                     <div style={{ fontSize: '36px', fontWeight: '700' }}>{systemStats.organizations.inactive}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default EnhancedDashboardContent;
