import React, { useState, useEffect } from 'react';
import OrganizationList from './OrganizationList';
import CourseList from './CourseList';
import CourseRequestManagement from './CourseRequestManagement';
import OrganizationProgressOverview from './OrganizationProgressOverview';
// QuizManager has been integrated into CourseViewer
import RoleIndicator from '../components/RoleIndicator';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { FaChevronLeft, FaChevronRight, FaBuilding, FaChartBar, FaBook, FaCog, FaCreditCard, FaTachometerAlt, FaShoppingCart, FaQuestionCircle, FaUsers, FaSpinner, FaSave, FaUndo, FaDownload, FaUpload, FaBell, FaEnvelope, FaShieldAlt, FaDatabase, FaCloudUploadAlt } from 'react-icons/fa';
import { getToken, parseJwt } from '../utils/auth';

// Portal Admins List Component
function PortalAdminsList({ username }) {
  const [portalAdmins, setPortalAdmins] = useState([]);
  const [filteredPortalAdmins, setFilteredPortalAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPortalAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/portal_admins?username=${username}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setPortalAdmins(data.portal_admins);
          setFilteredPortalAdmins(data.portal_admins);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch portal admins');
          setPortalAdmins([]);
          setFilteredPortalAdmins([]);
        }
      } catch (err) {
        console.error('Error fetching portal admins:', err);
        setError('Network error when fetching portal admins');
        setPortalAdmins([]);
        setFilteredPortalAdmins([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchPortalAdmins();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPortalAdmins();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [username]);

  // Filter portal admins based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPortalAdmins(portalAdmins);
    } else {
      const filtered = portalAdmins.filter(admin =>
        admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.designation && admin.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.organization && admin.organization.name && admin.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPortalAdmins(filtered);
    }
  }, [searchTerm, portalAdmins]);

  const handleResetPassword = async (adminUsername) => {
    if (!confirm(`Are you sure you want to reset the password for ${adminUsername}?`)) {
      return;
    }

    try {
      setResettingPassword(adminUsername);
      const response = await fetch('/api/admin/reset_portal_admin_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portal_admin_username: adminUsername
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Password reset successfully for ${adminUsername}. ${data.email_sent ? 'Email sent to user.' : 'Email could not be sent.'}`);
      } else {
        alert(`Error: ${data.error || 'Failed to reset password'}`);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Network error when resetting password');
    } finally {
      setResettingPassword(null);
    }
  };

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                margin: 0,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                👨‍💼 Portal Admins
              </h1>
              <p style={{
                color: '#64748b',
                margin: '8px 0 0 0',
                fontSize: '16px'
              }}>
                Manage and view all portal administrators in the system
              </p>
            </div>
            <div style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#3730a3',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              {filteredPortalAdmins.length} of {portalAdmins.length} Total
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px'
            }}>
              <input
                type="text"
                placeholder="🔍 Search portal admins by name, email, designation, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingLeft: '24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)';
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: '#64748b', fontSize: '16px' }}>Loading portal admins...</p>
            </div>
          ) : error ? (
            <div style={{
              background: '#fee2e2',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid #fecaca',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '20px' }}>Error Loading Data</h3>
              <p style={{ marginTop: '12px', color: '#7f1d1d' }}>{error}</p>
            </div>
          ) : filteredPortalAdmins.length === 0 && portalAdmins.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#64748b'
            }}>
              <FaUsers style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>No Portal Admins Found</h3>
              <p style={{ margin: 0, fontSize: '16px' }}>There are currently no portal administrators in the system.</p>
            </div>
          ) : filteredPortalAdmins.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#64748b'
            }}>
              <FaUsers style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>No Results Found</h3>
              <p style={{ margin: 0, fontSize: '16px' }}>No portal admins match your search criteria. Try a different search term.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {filteredPortalAdmins.map((admin) => (
                <div key={admin.id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ec4899, #be185d)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                      marginRight: '16px'
                    }}>
                      {admin.username[0]?.toUpperCase() || 'P'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {admin.username}
                      </h3>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        {admin.designation}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '4px'
                    }}>
                      Email:
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {admin.email}
                    </div>
                  </div>

                  {admin.organization ? (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Organization:
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#1f2937',
                          fontWeight: '500'
                        }}>
                          {admin.organization.name}
                        </div>
                        <div style={{
                          padding: '2px 8px',
                          background: admin.organization.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: admin.organization.status === 'active' ? '#16a34a' : '#dc2626',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {admin.organization.status}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '4px'
                      }}>
                        Domain: {admin.organization.domain}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#92400e',
                        fontWeight: '500'
                      }}>
                        ⚠️ No Organization Assigned
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Created: {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'Unknown'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetPassword(admin.username);
                      }}
                      disabled={resettingPassword === admin.username}
                      style={{
                        padding: '6px 12px',
                        background: resettingPassword === admin.username 
                          ? '#d1d5db' 
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: resettingPassword === admin.username ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        if (resettingPassword !== admin.username) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {resettingPassword === admin.username ? '🔄 Resetting...' : '🔐 Reset Password'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Total Users List Component
function TotalUsersList({ username }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/all_users?username=${username}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setUsers(data.users);
          setFilteredUsers(data.users);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch users');
          setUsers([]);
          setFilteredUsers([]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Network error when fetching users');
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchUsers();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [username]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.designation && user.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.organization && user.organization.name && user.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                margin: 0,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                👥 Total Users
              </h1>
              <p style={{
                color: '#64748b',
                margin: '8px 0 0 0',
                fontSize: '16px'
              }}>
                View and manage all users in the system
              </p>
            </div>
            <div style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#3730a3',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              {filteredUsers.length} of {users.length} Total
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '32px'
          }}>
            <input
              type="text"
              placeholder="Search users by name, email, role, designation, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                background: '#ffffff',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                paddingRight: searchTerm ? '50px' : '20px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#64748b';
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: '#64748b', fontSize: '16px' }}>Loading users...</p>
            </div>
          ) : error ? (
            <div style={{
              background: '#fee2e2',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid #fecaca',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '20px' }}>Error Loading Data</h3>
              <p style={{ marginTop: '12px', color: '#7f1d1d' }}>{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#64748b'
            }}>
              <FaUsers style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                {searchTerm ? 'No Users Found' : 'No Users Found'}
              </h3>
              <p style={{ margin: 0, fontSize: '16px' }}>
                {searchTerm ? 'No users match your search criteria.' : 'There are currently no users in the system.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {filteredUsers.map((user) => (
                <div key={user.id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: user.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                  user.role === 'portal_admin' ? 'linear-gradient(135deg, #ec4899, #be185d)' :
                                  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                      marginRight: '16px'
                    }}>
                      {user.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {user.username}
                      </h3>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        {user.designation || 'No designation'}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: user.role === 'admin' ? '#fee2e2' :
                                  user.role === 'portal_admin' ? '#fce7f3' :
                                  '#dbeafe',
                      color: user.role === 'admin' ? '#dc2626' :
                             user.role === 'portal_admin' ? '#ec4899' :
                             '#3b82f6',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '4px'
                    }}>
                      Email:
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {user.email}
                    </div>
                  </div>

                  {user.organization ? (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Organization:
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#1f2937',
                          fontWeight: '500'
                        }}>
                          {user.organization.name}
                        </div>
                        <div style={{
                          padding: '2px 8px',
                          background: user.organization.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: user.organization.status === 'active' ? '#16a34a' : '#dc2626',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {user.organization.status}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '4px'
                      }}>
                        Domain: {user.organization.domain}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#92400e',
                        fontWeight: '500'
                      }}>
                        ⚠️ No Organization Assigned
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// System Settings Component
function SystemSettings({ username }) {
  const [activeTab, setActiveTab] = useState('system');
  const [settings, setSettings] = useState({});
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    subject: '',
    html_content: '',
    text_content: '',
    variables: []
  });

  useEffect(() => {
    fetchSettings();
    fetchEmailTemplates();
    fetchAnnouncements();
    
    // Set up auto-refresh every 60 seconds for settings
    const interval = setInterval(() => {
      fetchSettings();
      fetchEmailTemplates();
      fetchAnnouncements();
    }, 60000); // 60 seconds for settings (less frequent than main dashboard)
    
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system_settings');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSettings(data.settings);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Network error when fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email_templates');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmailTemplates(data.templates);
      }
    } catch (err) {
      console.error('Error fetching email templates:', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const initializeSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/system_settings/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage(`Initialized ${data.initialized_count} settings`);
        await fetchSettings();
      } else {
        setError(data.error || 'Failed to initialize settings');
      }
    } catch (err) {
      setError('Network error when initializing settings');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/system_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('Settings updated successfully');
        setError(null);
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Network error when updating settings');
    } finally {
      setSaving(false);
    }
  };

  const saveEmailTemplate = async (templateData) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/email_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('Email template saved successfully');
        setError(null);
        await fetchEmailTemplates();
        setEditingTemplate(null);
        setNewTemplate({
          template_name: '',
          subject: '',
          html_content: '',
          text_content: '',
          variables: []
        });
      } else {
        setError(data.error || 'Failed to save email template');
      }
    } catch (err) {
      setError('Network error when saving email template');
    } finally {
      setSaving(false);
    }
  };

  const deleteEmailTemplate = async (templateName) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/email_templates/${templateName}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('Email template deleted successfully');
        setError(null);
        await fetchEmailTemplates();
      } else {
        setError(data.error || 'Failed to delete email template');
      }
    } catch (err) {
      setError('Network error when deleting email template');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value, dataType = 'string') => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category]?.[key],
          value: value,
          data_type: dataType
        }
      }
    }));
  };

  const renderSettingInput = (category, key, setting) => {
    const value = setting.value;
    const dataType = setting.data_type || 'string';
    
    switch (dataType) {
      case 'boolean':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateSetting(category, key, e.target.checked, 'boolean')}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#3b82f6'
              }}
            />
            <span>{value ? 'Enabled' : 'Disabled'}</span>
          </div>
        );
      case 'integer':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => updateSetting(category, key, parseInt(e.target.value) || 0, 'integer')}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        );
      case 'json':
        return (
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateSetting(category, key, parsed, 'json');
              } catch {
                // Invalid JSON, don't update
              }
            }}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateSetting(category, key, e.target.value, 'string')}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        );
    }
  };

  const tabs = [
    { key: 'system', label: 'System', icon: <FaCog />, color: '#6b7280' },
    { key: 'email', label: 'Email', icon: <FaEnvelope />, color: '#3b82f6' },
    { key: 'security', label: 'Security', icon: <FaShieldAlt />, color: '#ef4444' },
    { key: 'organization', label: 'Organizations', icon: <FaBuilding />, color: '#10b981' },
    { key: 'course', label: 'Courses', icon: <FaBook />, color: '#f59e0b' },
    { key: 'file_upload', label: 'File Upload', icon: <FaCloudUploadAlt />, color: '#8b5cf6' },
    { key: 'templates', label: 'Email Templates', icon: <FaBell />, color: '#ec4899' },
    { key: 'announcements', label: 'Announcements', icon: <FaBell />, color: '#06b6d4' }
  ];

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                margin: 0,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ⚙️ System Settings
              </h1>
              <p style={{
                color: '#64748b',
                margin: '8px 0 0 0',
                fontSize: '16px'
              }}>
                Configure system-wide settings and preferences
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={initializeSettings}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <FaSpinner className="spin" /> : <FaDownload />}
                Initialize Defaults
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <FaSpinner className="spin" /> : <FaSave />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              background: '#dcfce7',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #bbf7d0',
              color: '#16a34a'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              background: '#fee2e2',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #fecaca',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '32px',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '16px'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.key 
                    ? `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` 
                    : 'transparent',
                  color: activeTab === tab.key ? '#fff' : '#64748b',
                  border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = `${tab.color}15`;
                    e.currentTarget.style.color = tab.color;
                  }
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <FaSpinner style={{ fontSize: '48px', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
              <p style={{ color: '#64748b', marginTop: '16px' }}>Loading settings...</p>
            </div>
          ) : (
            <div>
              {/* Settings Content */}
              {activeTab !== 'templates' && activeTab !== 'announcements' && settings[activeTab] && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '24px'
                }}>
                  {Object.entries(settings[activeTab]).map(([key, setting]) => (
                    <div key={key} style={{
                      background: '#ffffff',
                      padding: '24px',
                      borderRadius: '16px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <label style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '16px'
                        }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        {setting.description && (
                          <p style={{
                            color: '#64748b',
                            fontSize: '14px',
                            margin: 0
                          }}>
                            {setting.description}
                          </p>
                        )}
                        {renderSettingInput(activeTab, key, setting)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Email Templates */}
              {activeTab === 'templates' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>Email Templates</h3>
                    <button
                      onClick={() => setEditingTemplate('new')}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaUpload />
                      Create New Template
                    </button>
                  </div>

                  {/* Template Editor Modal */}
                  {editingTemplate && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '24px'
                        }}>
                          <h3 style={{ margin: 0, color: '#1f2937' }}>
                            {editingTemplate === 'new' ? 'Create New Template' : 'Edit Template'}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingTemplate(null);
                              setNewTemplate({
                                template_name: '',
                                subject: '',
                                html_content: '',
                                text_content: '',
                                variables: []
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '24px',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                          >
                            ×
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={editingTemplate === 'new' ? newTemplate.template_name : (editingTemplate?.template_name || '')}
                              onChange={(e) => {
                                if (editingTemplate === 'new') {
                                  setNewTemplate(prev => ({ ...prev, template_name: e.target.value }));
                                } else {
                                  setEditingTemplate(prev => ({ ...prev, template_name: e.target.value }));
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                              placeholder="e.g., welcome_email, password_reset"
                            />
                          </div>

                          <div>
                            <label style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                              Subject Line
                            </label>
                            <input
                              type="text"
                              value={editingTemplate === 'new' ? newTemplate.subject : (editingTemplate?.subject || '')}
                              onChange={(e) => {
                                if (editingTemplate === 'new') {
                                  setNewTemplate(prev => ({ ...prev, subject: e.target.value }));
                                } else {
                                  setEditingTemplate(prev => ({ ...prev, subject: e.target.value }));
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                              placeholder="Use {variable_name} for dynamic content"
                            />
                          </div>

                          <div>
                            <label style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                              HTML Content
                            </label>
                            <textarea
                              value={editingTemplate === 'new' ? newTemplate.html_content : (editingTemplate?.html_content || '')}
                              onChange={(e) => {
                                if (editingTemplate === 'new') {
                                  setNewTemplate(prev => ({ ...prev, html_content: e.target.value }));
                                } else {
                                  setEditingTemplate(prev => ({ ...prev, html_content: e.target.value }));
                                }
                              }}
                              rows={12}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                resize: 'vertical'
                              }}
                              placeholder="HTML email template with {variable_name} placeholders"
                            />
                          </div>

                          <div>
                            <label style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                              Plain Text Content (optional)
                            </label>
                            <textarea
                              value={editingTemplate === 'new' ? newTemplate.text_content : (editingTemplate?.text_content || '')}
                              onChange={(e) => {
                                if (editingTemplate === 'new') {
                                  setNewTemplate(prev => ({ ...prev, text_content: e.target.value }));
                                } else {
                                  setEditingTemplate(prev => ({ ...prev, text_content: e.target.value }));
                                }
                              }}
                              rows={6}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                resize: 'vertical'
                              }}
                              placeholder="Plain text fallback for email clients that don't support HTML"
                            />
                          </div>

                          <div>
                            <label style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                              Available Variables (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={editingTemplate === 'new' ? newTemplate.variables.join(', ') : (editingTemplate?.variables?.join(', ') || '')}
                              onChange={(e) => {
                                const variables = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                if (editingTemplate === 'new') {
                                  setNewTemplate(prev => ({ ...prev, variables }));
                                } else {
                                  setEditingTemplate(prev => ({ ...prev, variables }));
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                              placeholder="org_name, user_name, user_email, temp_password"
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                              onClick={() => {
                                setEditingTemplate(null);
                                setNewTemplate({
                                  template_name: '',
                                  subject: '',
                                  html_content: '',
                                  text_content: '',
                                  variables: []
                                });
                              }}
                              style={{
                                padding: '12px 24px',
                                background: '#6b7280',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                const templateData = editingTemplate === 'new' ? newTemplate : editingTemplate;
                                saveEmailTemplate(templateData);
                              }}
                              disabled={saving}
                              style={{
                                padding: '12px 24px',
                                background: saving ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              {saving ? <FaSpinner className="spin" /> : <FaSave />}
                              Save Template
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Templates List */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px'
                  }}>
                    {emailTemplates.map(template => (
                      <div key={template.id} style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '12px'
                        }}>
                          <h4 style={{ margin: 0, color: '#1f2937' }}>{template.template_name}</h4>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setEditingTemplate(template)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEmailTemplate(template.template_name)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 12px 0' }}>
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        <div style={{
                          background: '#f9fafb',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          maxHeight: '200px',
                          overflow: 'auto',
                          marginBottom: '12px'
                        }}>
                          {template.html_content.substring(0, 300)}...
                        </div>
                        {template.variables && template.variables.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                              <strong>Variables:</strong>
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {template.variables.map((variable, index) => (
                                <span key={index} style={{
                                  padding: '2px 8px',
                                  background: '#dbeafe',
                                  color: '#3b82f6',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p style={{ color: '#64748b', fontSize: '12px', margin: '0' }}>
                          Updated: {new Date(template.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Announcements */}
              {activeTab === 'announcements' && (
                <div>
                  <h3 style={{ marginBottom: '24px', color: '#1f2937' }}>System Announcements</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {announcements.map(announcement => (
                      <div key={announcement.id} style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#1f2937' }}>{announcement.title}</h4>
                          <span style={{
                            padding: '4px 12px',
                            background: announcement.announcement_type === 'critical' ? '#fee2e2' : 
                                       announcement.announcement_type === 'warning' ? '#fef3c7' : '#dbeafe',
                            color: announcement.announcement_type === 'critical' ? '#dc2626' : 
                                   announcement.announcement_type === 'warning' ? '#d97706' : '#3b82f6',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {announcement.announcement_type.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.5 }}>{announcement.content}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                          <span>By: {announcement.created_by}</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}


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
  const [refreshInterval, setRefreshInterval] = useState(null);
  
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
  
  useEffect(() => {
    // Initial fetch
    fetchSystemStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStats();
    }, 30000); // 30 seconds
    
    setRefreshInterval(interval);
    
    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [username]);
  
  // Manual refresh function
  const handleManualRefresh = () => {
    fetchSystemStats();
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
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
            { label: 'Organization Progress', icon: <FaChartBar />, color: '#16a34a' },
            { label: 'Portal Admins', icon: <FaUsers />, color: '#ec4899' },
            { label: 'Total Users', icon: <FaUsers />, color: '#3b82f6' },
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
                  background: loading ? 
                    'linear-gradient(135deg, #fbbf24, #f59e0b)' : 
                    'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ffffff',
                  border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease'
                }}>
                  {loading ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '10px' }} />
                      UPDATING
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      LIVE
                    </>
                  )}
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
                <button
                  onClick={handleManualRefresh}
                  style={{
                    padding: '12px',
                    background: loading ? 'linear-gradient(135deg, #6b7280, #9ca3af)' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                  title="Refresh Dashboard (Auto-refreshes every 30s)"
                >
                  {loading ? (
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    '🔄'
                  )}
                </button>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '4px 8px',
                  background: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(107, 114, 128, 0.2)'
                }}>
                  <div>Auto-refresh</div>
                  <div style={{ fontWeight: '600', color: '#10b981' }}>30s</div>
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
                  { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: '#3b82f6', bgColor: '#dbeafe', clickable: true, page: 'Total Users' },
                  { label: 'Portal Admins', value: stats?.total_portal_admins || 0, icon: '👨‍💼', color: '#ec4899', bgColor: '#fce7f3', clickable: true, page: 'Portal Admins' },
                  { label: 'Courses Created', value: stats?.total_courses || 0, icon: '📚', color: '#10b981', bgColor: '#d1fae5', clickable: true, page: 'Courses' },
                  { label: 'Active Organizations', value: stats?.active_organizations || 0, icon: '⚡', color: '#f59e0b', bgColor: '#fef3c7', clickable: true, page: 'Organization list' },
                  { label: 'Total Organizations', value: stats?.total_organizations || 0, icon: '🏢', color: '#8b5cf6', bgColor: '#ede9fe', clickable: true, page: 'Organization list' }
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
                    cursor: stat.clickable ? 'pointer' : 'default',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => stat.clickable && setActivePage(stat.page)}
                  onMouseOver={(e) => {
                    if (stat.clickable) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (stat.clickable) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
                    }
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
        {activePage === 'Organization Progress' && (
          <OrganizationProgressOverview />
        )}
        {activePage === 'Portal Admins' && (
          <PortalAdminsList username={username} />
        )}
        {activePage === 'Total Users' && (
          <TotalUsersList username={username} />
        )}
        {activePage === 'Courses' && (
          <CourseList />
        )}
        {activePage === 'Course Requests' && (
          <CourseRequestManagement />
        )}
        {activePage === 'Settings' && (
          <SystemSettings username={username} />
        )}
        {activePage === 'Analytics' && (
          <AnalyticsDashboard />
        )}
      </main>
    </div>
    </>
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