import React, { useEffect, useState } from 'react';
import { getToken, parseJwt } from '../utils/auth';
import PurchaseRequestStatus from './PurchaseRequestStatus';
import CourseEmployeeAssignment from './CourseEmployeeAssignment';

function PortalAdminCourses() {
  const [allCourses, setAllCourses] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedCourseForAssignment, setSelectedCourseForAssignment] = useState(null);

  const fetchCourses = async () => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    
    // Debug logging
    console.log('🔍 Debug Info:');
    console.log('Token exists:', !!token);
    console.log('Payload:', payload);
    console.log('Username from token:', username);
    
    if (!username) {
      setError('No username found in token. Please log in again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = `/api/portal_admin/all_courses?username=${username}`;
      console.log('🚀 Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('📥 API Response:', data);
      
      if (data.success) {
        setAllCourses(data.all_courses);
        setAssignedCourses(data.assigned_courses);
        setOrganizationInfo(data.organization);
        setError(null);
        console.log('✅ Courses loaded successfully');
      } else {
        const errorMsg = data.error || 'Failed to fetch courses';
        console.log('❌ API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.log('🚨 Network Error:', err);
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAssignCourse = async (courseId, courseTitle) => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    if (!username) return;

    setActionLoading(courseId);
    try {
      const response = await fetch('/api/portal_admin/assign_course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, course_id: courseId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Successfully assigned "${courseTitle}" to your organization!`);
        await fetchCourses(); // Refresh the course list
      } else {
        alert(`❌ Failed to assign course: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Network error while assigning course');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchaseRequest = async (courseId, courseTitle, price) => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    if (!username) return;

    const confirmed = window.confirm(
      `Are you sure you want to request to purchase "${courseTitle}" for $${price}?\n\nThis will send a purchase request to the admin for approval.`
    );
    
    if (!confirmed) return;

    setActionLoading(courseId);
    try {
      const response = await fetch('/api/portal_admin/request_course_purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          course_id: courseId,
          payment_amount: price
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Purchase request submitted for "${courseTitle}"!\n\nYour request will be reviewed by the admin. You'll be notified once approved.`);
        await fetchCourses(); // Refresh the course list
      } else {
        alert(`❌ Failed to submit purchase request: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Network error while submitting purchase request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnassignCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${courseTitle}" from your organization?`)) {
      return;
    }

    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    if (!username) return;

    setActionLoading(courseId);
    try {
      const response = await fetch('/api/portal_admin/unassign_course', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, course_id: courseId })
      });

      const data = await response.json();
      
      if (data.success) {
        const employeesText = data.employees_updated 
          ? `and removed from ${data.employees_updated} employee${data.employees_updated === 1 ? '' : 's'}`
          : '';
        alert(`✅ Successfully removed "${courseTitle}" from your organization ${employeesText}!`);
        await fetchCourses(); // Refresh the course list
      } else {
        alert(`❌ Failed to remove course: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Network error while removing course');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
      fontSize: '18px',
      color: '#6b7280'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #764ba2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading courses...
      </div>
    </div>
  );
  
  if (error) return (
    <div style={{ 
      background: '#fef2f2', 
      border: '1px solid #fecaca', 
      borderRadius: '8px', 
      padding: '16px', 
      color: '#dc2626',
      fontSize: '16px',
      fontWeight: '500'
    }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* Purchase Request Status */}
      <PurchaseRequestStatus />
      
      {/* All Courses Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        padding: '32px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🛒 Course Marketplace
          </h2>
          <div style={{
            background: '#f3f4f6',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#6b7280'
          }}>
            {allCourses.length} courses available
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '32px', justifyContent: 'center' }}>
          {allCourses.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280',
              fontSize: '16px'
            }}>
              📚 No courses available yet
            </div>
          ) : (
            allCourses.map(course => (
              <div key={course.id} style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderRadius: '12px', 
                padding: '24px', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '4px',
                  background: course.can_buy 
                    ? 'linear-gradient(90deg, #667eea, #764ba2)' 
                    : 'linear-gradient(90deg, #10b981, #059669)'
                }}></div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 12px 0',
                  lineHeight: '1.3'
                }}>
                  {course.title}
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: '0 0 20px 0',
                  minHeight: '42px'
                }}>
                  {course.description || 'No description available'}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      📚 {course.module_count} module{course.module_count !== 1 ? 's' : ''}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#059669',
                      fontWeight: '700'
                    }}>
                      💰 ${course.price}
                    </div>
                  </div>
                  
                  {course.is_assigned ? (
                    <div style={{ 
                      background: '#dcfce7', 
                      color: '#166534', 
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      ✅ Assigned
                    </div>
                  ) : course.is_pending_request ? (
                    <div style={{ 
                      background: '#fef3c7', 
                      color: '#d97706', 
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      ⏳ Pending Approval
                    </div>
                  ) : (
                    <button 
                      onClick={() => handlePurchaseRequest(course.id, course.title, course.price)}
                      disabled={actionLoading === course.id}
                      style={{ 
                        background: actionLoading === course.id 
                          ? '#9ca3af' 
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '10px 20px', 
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: actionLoading === course.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        minWidth: '140px'
                      }}
                      onMouseOver={(e) => {
                        if (actionLoading !== course.id) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (actionLoading !== course.id) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                        }
                      }}
                    >
                      {actionLoading === course.id ? '⏳ Requesting...' : '� Request Purchase'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assigned Courses Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        padding: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📖 My Assigned Courses
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {organizationInfo && (
              <div style={{
                background: '#ede9fe',
                color: '#7c3aed',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                🏢 {organizationInfo.name}
              </div>
            )}
            <div style={{
              background: '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280'
            }}>
              {assignedCourses.length} courses assigned
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px 10px',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          {assignedCourses.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: '30px', 
              color: '#6b7280',
              fontSize: '16px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              📚 No courses assigned yet. Assign some from the marketplace above!
            </div>
          ) : (
            assignedCourses.map(course => (
              <div key={course.id} style={{
                background: 'linear-gradient(135deg, #f0fdfa 0%, #d1fae5 100%)',
                borderRadius: '18px',
                padding: '36px 36px 30px 36px',
                boxShadow: '0 6px 24px 0 rgba(16,185,129,0.10)',
                border: '2px solid #5eead4',
                minWidth: '400px',
                maxWidth: '620px',
                flex: '1 1 420px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                margin: '0',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '5px',
                  background: 'linear-gradient(90deg, #10b981, #059669)'
                }}></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '18px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #34d399 60%, #10b981 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '26px',
                    boxShadow: '0 2px 8px #a7f3d0',
                    border: '2px solid #a7f3d0',
                  }}>
                    {course.title && typeof course.title === 'string' && course.title.length > 0
                      ? course.title.charAt(0).toUpperCase()
                      : '📚'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: '800',
                      color: '#134e4a',
                      margin: '0 0 6px 0',
                      lineHeight: '1.2',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}>{course.title}</h3>
                    <div style={{
                      color: '#0f766e',
                      fontSize: '15px',
                      fontWeight: 600,
                      marginBottom: '2px',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}>{organizationInfo?.name || ''}</div>
                  </div>
                </div>
                <p style={{
                  color: '#6b7280',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: '0 0 24px 0',
                  minHeight: '42px',
                  fontWeight: 500,
                }}>
                  {course.description || 'No description available'}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '18px',
                  marginTop: 'auto',
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#0d9488',
                    fontWeight: '700',
                    background: '#ccfbf1',
                    padding: '8px 18px',
                    borderRadius: '16px',
                  }}>
                    📚 {course.module_count} module{course.module_count !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 4px #bbf7d0',
                    }}>
                      ✅ Active
                    </div>
                    <button
                      onClick={() => setSelectedCourseForAssignment(course)}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.18)',
                        minWidth: '140px',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.22)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.18)';
                      }}
                    >
                      👥 Assign to Employees
                    </button>
                    <button
                      onClick={() => handleUnassignCourse(course.id, course.title)}
                      disabled={actionLoading === course.id}
                      style={{
                        background: actionLoading === course.id
                          ? '#9ca3af'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: actionLoading === course.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.18)',
                        minWidth: '100px',
                      }}
                      onMouseOver={(e) => {
                        if (actionLoading !== course.id) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.22)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (actionLoading !== course.id) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.18)';
                        }
                      }}
                    >
                      {actionLoading === course.id ? '⏳...' : '🗑️ Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Course Employee Assignment Modal */}
      {selectedCourseForAssignment && (
        <CourseEmployeeAssignment
          course={{
            ...selectedCourseForAssignment,
            organization_id: selectedCourseForAssignment.organization_id || (organizationInfo && (organizationInfo.id || organizationInfo.organization_id))
          }}
          onClose={() => setSelectedCourseForAssignment(null)}
        />
      )}
    </div>
  );
}

export default PortalAdminCourses;
