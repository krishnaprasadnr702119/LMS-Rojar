import React, { useState, useEffect } from 'react';
// For email sending, you may need to implement the backend endpoint
import { 
  FaHome, 
  FaUsers, 
  FaGraduationCap, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import PortalAdminCourses from './PortalAdminCourses';
import RoleIndicator from '../components/RoleIndicator';
import { getToken, parseJwt } from '../utils/auth';
import EnhancedDashboardContent from './EnhancedDashboardContent';

function PortalAdminDashboard({ onCreateEmployee }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    username: '',
    password: '',
    email: '',
    designation: '',
  });
  const [employeeError, setEmployeeError] = useState('');
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [employeeListRefresh, setEmployeeListRefresh] = useState(0);

  // Fetch org domain for portal admin
  useEffect(() => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    if (!username) return;
    fetch(`/api/portal_admin/org_domain?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrgDomain(data.org_domain);
      });
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'employees', label: 'Employees', icon: FaUsers },
    { id: 'courses', label: 'Courses', icon: FaGraduationCap },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  // Employee form handlers
  // Clear form and messages when opening modal
  const handleOpenEmployeeModal = () => {
    setEmployeeForm({
      username: '',
      password: '',
      email: '',
      designation: '',
    });
    setEmployeeError('');
    setInviteSuccess('');
    setShowEmployeeModal(true);
  };

  // Clear form and messages when closing modal
  const handleCloseEmployeeModal = () => {
    setEmployeeForm({
      username: '',
      password: '',
      email: '',
      designation: '',
    });
    setEmployeeError('');
    setInviteSuccess('');
    setShowEmployeeModal(false);
  };

  const handleEmployeeInput = (e) => {
    const { name, value } = e.target;
    setEmployeeForm(f => ({ ...f, [name]: value }));
    setEmployeeError('');
    setInviteSuccess('');
  };

  // Email domain validation
  const emailMatchesDomain = (email) => {
    if (!orgDomain) return true; // allow until orgDomain is loaded
    const parts = email.split('@');
    return parts.length === 2 && parts[1].toLowerCase() === orgDomain.toLowerCase();
  };

  // Create employee handler
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setEmployeeError('');
    setInviteSuccess('');
    if (!employeeForm.username || !employeeForm.password || !employeeForm.email || !employeeForm.designation) {
      setEmployeeError('All fields are required.');
      return;
    }
    if (orgDomain && !emailMatchesDomain(employeeForm.email)) {
      setEmployeeError('Email must match your organization domain: ' + orgDomain);
      return;
    }
    setEmployeeSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch('/api/portal_admin/create_employee', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(employeeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create employee');
      // Keep modal open but clear form for next entry
      setEmployeeForm({ username: '', password: '', email: '', designation: '' });
      setInviteSuccess('✅ Employee created successfully! You can add another employee.');
      setEmployeeListRefresh(prev => prev + 1); // Trigger employee list refresh
    } catch (err) {
      setEmployeeError(err.message);
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  // Invite employee handler
  const handleInviteEmployee = async () => {
    setEmployeeError('');
    setInviteSuccess('');
    if (!employeeForm.email) {
      setEmployeeError('Email is required to send invite.');
      return;
    }
    if (orgDomain && !emailMatchesDomain(employeeForm.email)) {
      setEmployeeError('Email must match your organization domain: ' + orgDomain);
      return;
    }
    setInviteSubmitting(true);
    try {
      const res = await fetch('/api/portal_admin/invite_employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: employeeForm.email, designation: employeeForm.designation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send invite');
      
      // Handle different response types
      if (data.email_error) {
        setInviteSuccess(`✅ Account created successfully!\n\nUsername: ${data.username}\nTemporary Password: ${data.temp_password}\n\n⚠️ Email delivery failed. Please provide these credentials to the employee manually.\n\n🔄 You can invite another employee below.`);
      } else {
        setInviteSuccess(`✅ Invitation sent successfully!\n\n📧 Email sent to: ${employeeForm.email}\n👤 Username: ${data.username}\n🏢 Account created for your organization\n\nThe employee will receive login credentials via email.\n\n🔄 You can invite another employee below.`);
      }
      
      // Clear form on success
      setEmployeeForm({ email: '', designation: '' });
      setEmployeeListRefresh(prev => prev + 1); // Trigger employee list refresh
    } catch (err) {
      setEmployeeError(err.message);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnhancedDashboardContent />;
      case 'employees':
        return <EmployeesContent key={employeeListRefresh} />;
      case 'courses':
        return <PortalAdminCourses />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <EnhancedDashboardContent />;
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
    }}>
      <RoleIndicator />
      
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
                🏢 Portal Admin
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                margin: '4px 0 0 0',
                fontWeight: '500'
              }}>
                Management Console
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            {sidebarCollapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: sidebarCollapsed ? '16px 20px' : '16px 24px',
                  background: isActive 
                    ? 'linear-gradient(90deg, rgba(59,130,246,0.2), rgba(139,92,246,0.1))' 
                    : 'transparent',
                  color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.8)',
                  border: 'none',
                  borderRight: isActive ? '3px solid #3b82f6' : 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  }
                }}
              >
                <IconComponent size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '16px',
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
              e.currentTarget.style.color = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <FaSignOutAlt size={18} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226,232,240,0.8)',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 12px rgba(0,0,0,0.05)'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              lineHeight: 1.2
            }}>
              {menuItems.find(item => item.id === activeTab)?.label || 'Portal Admin'}
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: '4px 0 0 0',
              fontWeight: '500'
            }}>
              Manage your organization and resources
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: '#22c55e',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Online
              </span>
            </div>
            {/* Create Employee Button */}
            {activeTab === 'employees' && (
              <button
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                }}
                onClick={handleOpenEmployeeModal}
              >
                ➕ Create/Invite Employee
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 0
        }}>
          {renderContent()}
        </div>
        {/* Employee Modal */}
        {showEmployeeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <form
              onSubmit={handleCreateEmployee}
              style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                padding: 36,
                minWidth: 360,
                maxWidth: '90vw',
                width: 420,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                border: '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <h3 style={{ 
                margin: 0, 
                color: '#1e40af', 
                fontWeight: 800, 
                fontSize: 24, 
                position: 'relative',
                paddingBottom: 14,
                marginBottom: 5
              }}>
                Create / Invite Employee
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: 40,
                  height: 4,
                  background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
                  borderRadius: 2
                }}></div>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  Username*
                </label>
                <input 
                  name="username" 
                  value={employeeForm.username} 
                  onChange={handleEmployeeInput} 
                  required 
                  placeholder="Enter username"
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: 10, 
                    border: '1px solid #e2e8f0', 
                    fontSize: 15,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  Password*
                </label>
                <input 
                  name="password" 
                  type="password"
                  value={employeeForm.password} 
                  onChange={handleEmployeeInput} 
                  required 
                  placeholder="Enter password"
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: 10, 
                    border: '1px solid #e2e8f0', 
                    fontSize: 15,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  Email Address*{orgDomain && ` (must match org domain: ${orgDomain})`}
                </label>
                <input 
                  name="email" 
                  type="email"
                  value={employeeForm.email} 
                  onChange={handleEmployeeInput} 
                  required 
                  placeholder={`e.g. user@${orgDomain}`}
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: 10, 
                    border: '1px solid #e2e8f0', 
                    fontSize: 15,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  Designation*
                </label>
                <input 
                  name="designation" 
                  value={employeeForm.designation} 
                  onChange={handleEmployeeInput} 
                  required 
                  placeholder="e.g. Software Engineer"
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: 10, 
                    border: '1px solid #e2e8f0', 
                    fontSize: 15,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                />
              </div>

              {employeeError && (
                <div style={{ 
                  color: '#ef4444', 
                  fontWeight: 600, 
                  background: '#fee2e2', 
                  padding: '10px 14px', 
                  borderRadius: 8,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {employeeError}
                </div>
              )}
              {inviteSuccess && (
                <div style={{ 
                  color: '#16a34a', 
                  fontWeight: 500, 
                  background: '#dcfce7', 
                  padding: '16px 18px', 
                  borderRadius: 10,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  whiteSpace: 'pre-line',
                  fontFamily: 'monospace',
                  border: '1px solid #86efac'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 12, marginTop: 2, flexShrink: 0}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9 12l2 2l4-4" />
                  </svg>
                  <div style={{flex: 1}}>
                    {inviteSuccess}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleCloseEmployeeModal} 
                  style={{ 
                    padding: '10px 18px', 
                    borderRadius: 10, 
                    border: '1px solid #e2e8f0', 
                    background: 'white', 
                    color: '#475569', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: 15,
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={employeeSubmitting} 
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: 10, 
                    border: 'none', 
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff', 
                    fontWeight: 700, 
                    cursor: employeeSubmitting ? 'not-allowed' : 'pointer', 
                    opacity: employeeSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                    fontSize: 15,
                    transition: 'all 0.2s',
                  }}
                >
                  {employeeSubmitting ? 'Creating...' : 'Create Employee'}
                </button>
                <button
                  type="button"
                  disabled={inviteSubmitting}
                  onClick={handleInviteEmployee}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: inviteSubmitting ? 'not-allowed' : 'pointer',
                    opacity: inviteSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                    fontSize: 15,
                    transition: 'all 0.2s',
                  }}
                >
                  {inviteSubmitting ? 'Inviting...' : 'Invite Employee'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Legacy Dashboard Content Component - Replaced by EnhancedDashboardContent
// This component has been replaced by EnhancedDashboardContent which
// fetches real data from the API and displays dynamic progress statistics

// Placeholder components for other sections
function EmployeesContent() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Fetch organization info and employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const payload = token ? parseJwt(token) : null;
        const username = payload?.username;
        if (!username) {
          setError('No username found');
          return;
        }
        // First get the organization info
        const orgRes = await fetch(`/api/portal_admin/org_domain?username=${username}`);
        const orgData = await orgRes.json();
        if (!orgRes.ok || !orgData.success) {
          setError('Failed to fetch organization info');
          return;
        }
        setOrganizationInfo(orgData);
        // Then fetch employees for this organization
        const empRes = await fetch(`/api/portal_admin/organizations/${orgData.organization_id}/employees`);
        const empData = await empRes.json();
        if (!empRes.ok) {
          setError(empData.error || 'Failed to fetch employees');
          return;
        }
        setEmployees(empData.employees || []);
        setOrganizationInfo(prev => ({ ...prev, ...empData.organization }));
      } catch (err) {
        setError('Error fetching employees: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch courses for assignment when modal opens
  const openAssignModal = async (employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
    setAssignError('');
    setAssignSuccess('');
    setSelectedCourseId('');
    if (organizationInfo?.organization_id) {
      try {
        setAssignLoading(true);
        const res = await fetch(`/api/portal_admin/organizations/${organizationInfo.organization_id}/courses`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
          setAssignError('Failed to fetch courses');
        }
      } catch (err) {
        setCourses([]);
        setAssignError('Error fetching courses');
      } finally {
        setAssignLoading(false);
      }
    }
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedEmployee(null);
    setCourses([]);
    setSelectedCourseId('');
    setAssignError('');
    setAssignSuccess('');
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    if (!selectedCourseId) {
      setAssignError('Please select a course');
      return;
    }
    setAssignLoading(true);
    try {
      const res = await fetch('/api/portal_admin/assign_course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: selectedEmployee.id, course_id: selectedCourseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign course');
      setAssignSuccess('Course assigned successfully!');
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete employee "${employeeName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/portal_admin/employees/${employeeId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete employee');
      }

      // Remove employee from local state
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      alert('Employee deleted successfully');
      
    } catch (err) {
      alert('Error deleting employee: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            👥 Employee Management
          </h2>
          {organizationInfo && (
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              margin: 0
            }}>
              Organization: <strong>{organizationInfo.organization_name || organizationInfo.name}</strong> • 
              Total Employees: <strong>{employees.length}</strong>
            </p>
          )}
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {employees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0' }}>No employees found</h3>
            <p style={{ margin: 0 }}>Start by inviting or creating employees using the dashboard.</p>
          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#f8fafc',
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr auto',
              gap: '16px',
              fontWeight: '600',
              color: '#475569'
            }}>
              <div>Name</div>
              <div>Email</div>
              <div>Designation</div>
              <div>Actions</div>
            </div>
            {employees.map((employee, index) => (
              <div key={employee.id} style={{
                padding: '20px 24px',
                borderBottom: index < employees.length - 1 ? '1px solid #f1f5f9' : 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '16px',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{employee.name}</div>
                <div style={{ color: '#64748b' }}>{employee.email}</div>
                <div style={{ color: '#64748b' }}>{employee.designation}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#dc2626'}
                    onMouseOut={(e) => e.target.style.background = '#ef4444'}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => openAssignModal(employee)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#2563eb'}
                    onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                  >
                    Assign Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Assign Course Modal */}
        {showAssignModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <form
              onSubmit={handleAssignCourse}
              style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                padding: 36,
                minWidth: 320,
                maxWidth: '90vw',
                width: 380,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                position: 'relative',
                border: '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <h3 style={{ margin: 0, color: '#1e40af', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                Assign Course to {selectedEmployee?.name}
              </h3>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15, marginBottom: 4 }}>
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 15,
                  marginBottom: 8
                }}
                disabled={assignLoading}
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course.id || course.course_id} value={course.id || course.course_id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {assignError && (
                <div style={{ color: '#ef4444', background: '#fee2e2', padding: '8px 12px', borderRadius: 8, fontSize: 14 }}>
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div style={{ color: '#16a34a', background: '#dcfce7', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  {assignSuccess}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closeAssignModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedCourseId}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: assignLoading ? 'not-allowed' : 'pointer',
                    opacity: assignLoading ? 0.7 : 1,
                    fontSize: 15,
                  }}
                >
                  {assignLoading ? 'Assigning...' : 'Assign Course'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch organization statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const payload = token ? parseJwt(token) : null;
        const username = payload?.username;
        
        if (!username) {
          setError('User information not found');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/portal_admin/organization_statistics?username=${username}`);
        const data = await response.json();
        
        if (data.success) {
          setStats(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch statistics');
        }
      } catch (err) {
        setError('Network error while fetching statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div style={{ 
        padding: '32px', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
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
            Loading organization statistics...
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{
          background: '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          color: '#b91c1c',
          fontSize: '16px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          textAlign: 'center'
        }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!stats) {
    return (
      <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📊</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0 0 16px 0'
          }}>
            Analytics & Reports
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            margin: 0
          }}>
            No statistics available yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to render progress bar
  const renderProgressBar = (percentage, color = 'linear-gradient(90deg, #3b82f6, #8b5cf6)') => (
    <div style={{
      width: '100%',
      height: '8px',
      background: '#f3f4f6',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        background: color,
        borderRadius: '4px'
      }}></div>
    </div>
  );

  // Tabs for different analytics views
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Course Analytics' },
    { id: 'employees', label: 'Employee Progress' },
    { id: 'risk', label: 'Risk Assessment' }
  ];

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Organization header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 8px 0'
        }}>
          {stats.organization.name} - Analytics Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          margin: '0 0 24px 0'
        }}>
          Real-time insights into your organization's learning progress
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.organization.total_employees}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Employees</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.organization.total_courses}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Courses</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.organization.overall_completion_rate.toFixed(1)}%</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completion Rate</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: stats.organization.employees_at_risk > 0 ? '#fbbf24' : 'white' }}>
              {stats.organization.employees_at_risk}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Employees at Risk</div>
          </div>
        </div>
      </div>
      
      {/* Analytics Tabs */}
      <div style={{
        display: 'flex',
        gap: '2px',
        background: '#e5e7eb',
        borderRadius: '10px',
        padding: '4px',
        marginBottom: '24px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? '#1e40af' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Course Completion Rates */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '20px' }}>
                Course Completion Rates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.completion_by_course.map(course => (
                  <div key={course.course_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '500' }}>{course.title}</div>
                      <div>{course.completion_rate.toFixed(1)}%</div>
                    </div>
                    {renderProgressBar(course.completion_rate)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Performing Employees */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '20px' }}>
                Top Performing Employees
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.employee_statistics
                  .filter(emp => emp.assigned_count > 0)
                  .sort((a, b) => b.avg_progress - a.avg_progress)
                  .slice(0, 5)
                  .map(emp => (
                    <div key={emp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '500' }}>{emp.username}</div>
                        <div>{emp.avg_progress.toFixed(1)}%</div>
                      </div>
                      {renderProgressBar(emp.avg_progress)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Course Analytics Tab */}
        {activeTab === 'courses' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '20px' }}>
              Course Performance Analysis
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600' }}>Course Name</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Enrolled</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Completed</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Completion Rate</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Avg Progress</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>At Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.course_statistics.map(course => (
                    <tr key={course.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{course.title}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>{course.enrolled_count}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>{course.completed_count}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                        {course.completion_rate.toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                        {course.avg_progress.toFixed(1)}%
                      </td>
                      <td style={{ 
                        textAlign: 'center', 
                        padding: '12px 16px',
                        color: course.at_risk_count > 0 ? '#dc2626' : 'inherit',
                        fontWeight: course.at_risk_count > 0 ? '600' : 'inherit'
                      }}>
                        {course.at_risk_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Employee Progress Tab */}
        {activeTab === 'employees' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '20px' }}>
              Employee Progress Summary
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600' }}>Employee</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600' }}>Designation</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Assigned</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Completed</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>Avg Progress</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600' }}>High Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.employee_statistics.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                        <div>{emp.username}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{emp.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{emp.designation || 'N/A'}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>{emp.assigned_count}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>{emp.completed_count}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                        {emp.avg_progress.toFixed(1)}%
                      </td>
                      <td style={{ 
                        textAlign: 'center', 
                        padding: '12px 16px',
                        color: emp.high_risk_count > 0 ? '#dc2626' : 'inherit',
                        fontWeight: emp.high_risk_count > 0 ? '600' : 'inherit'
                      }}>
                        {emp.high_risk_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Risk Assessment Tab */}
        {activeTab === 'risk' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '20px' }}>
              Risk Assessment
            </h3>
            
            {stats.employees_at_risk.length === 0 ? (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                color: '#10b981',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <p>Great news! No employees are currently at risk.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {stats.employees_at_risk.map(emp => (
                  <div key={emp.id} style={{
                    border: '1px solid #fee2e2',
                    borderRadius: '12px',
                    padding: '20px',
                    background: '#fef2f2'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>{emp.username}</h4>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>{emp.email}</div>
                      </div>
                      <div style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        At Risk
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>
                      Risk Courses:
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {emp.risk_courses.map(course => (
                        <div key={course.course_id} style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500' }}>{course.title}</div>
                            <div style={{
                              color: course.risk_score > 70 ? '#dc2626' : '#f59e0b',
                              fontWeight: '600'
                            }}>
                              Risk Score: {course.risk_score}
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                            Current progress: {course.progress.toFixed(1)}%
                          </div>
                          
                          {renderProgressBar(course.progress, 
                            course.risk_score > 70 
                              ? 'linear-gradient(90deg, #ef4444, #f59e0b)' 
                              : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsContent() {
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  const username = payload?.username || 'Unknown';
  const [resettingPassword, setResettingPassword] = useState(false);
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);

  const handleSelfPasswordReset = async () => {
    if (!confirm('Are you sure you want to reset your password? A new password will be sent to your email.')) {
      return;
    }

    try {
      setResettingPassword(true);
      const response = await fetch('/api/portal_admin/reset_my_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Password reset successfully! Check your email for the new password.');
      } else {
        alert(`Error: ${data.error || 'Failed to reset password'}`);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Network error when resetting password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (changePassword.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangePasswordSubmitting(true);
      const response = await fetch('/api/change_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          current_password: changePassword.currentPassword,
          new_password: changePassword.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Password changed successfully!');
        setChangePassword({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(`Error: ${data.error || 'Failed to change password'}`);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      alert('Network error when changing password');
    } finally {
      setChangePasswordSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ⚙️ Settings & Security
        </h1>

        {/* Password Management Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🔐 Password Management
          </h2>

          {/* Quick Password Reset */}
          <div style={{
            padding: '24px',
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#dc2626',
              marginBottom: '12px'
            }}>
              Quick Password Reset
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              Forgot your password? Generate a new temporary password that will be sent to your email address.
            </p>
            <button
              onClick={handleSelfPasswordReset}
              disabled={resettingPassword}
              style={{
                padding: '12px 24px',
                background: resettingPassword 
                  ? '#d1d5db' 
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: resettingPassword ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {resettingPassword ? '🔄 Sending Reset Email...' : '📧 Reset Password via Email'}
            </button>
          </div>

          {/* Change Password Form */}
          <div style={{
            padding: '24px',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '12px'
            }}>
              Change Password
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Update your password by providing your current password and choosing a new one.
            </p>
            
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={changePassword.currentPassword}
                  onChange={(e) => setChangePassword({...changePassword, currentPassword: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={changePassword.newPassword}
                  onChange={(e) => setChangePassword({...changePassword, newPassword: e.target.value})}
                  required
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={changePassword.confirmPassword}
                  onChange={(e) => setChangePassword({...changePassword, confirmPassword: e.target.value})}
                  required
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={changePasswordSubmitting}
                style={{
                  padding: '12px 24px',
                  background: changePasswordSubmitting
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: changePasswordSubmitting ? 'not-allowed' : 'pointer',
                  alignSelf: 'flex-start'
                }}
              >
                {changePasswordSubmitting ? '🔄 Updating Password...' : '🔐 Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Account Information Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            👤 Account Information
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              padding: '20px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#10b981',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Username
              </div>
              <div style={{
                fontSize: '18px',
                color: '#1e293b',
                fontWeight: '700'
              }}>
                {username}
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#8b5cf6',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Role
              </div>
              <div style={{
                fontSize: '18px',
                color: '#1e293b',
                fontWeight: '700'
              }}>
                Portal Administrator
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalAdminDashboard;
