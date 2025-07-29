import React, { useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import Loader from '../components/Loader';

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function OrganizationList() {
  const [manageOrg, setManageOrg] = useState(null);
  const [manageCourses, setManageCourses] = useState([]);
  const [manageSaving, setManageSaving] = useState(false);
  const [manageError, setManageError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    portal_admin: '',
    org_domain: '',
    assigned_course: '',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [courses, setCourses] = useState([]);
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);

  const fetchOrganizations = () => {
    setLoading(true);
    setError(null);
    fetch('/api/organizations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setOrganizations(data.organizations || []);
        setFilteredOrganizations(data.organizations || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  };

  const fetchCourses = () => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data.courses || []));
  };

  useEffect(() => {
    fetchOrganizations();
    fetchCourses();
  }, []);

  // Filter organizations based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrganizations(organizations);
    } else {
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchTerm, organizations]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    // Validate required fields
    if (!form.name || !form.portal_admin || !form.org_domain || !form.status) {
      setFormError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    try {
      // Get password for portal admin
      const portalAdminPassword = prompt(
        `🔐 Set Password for Portal Admin\n\n` +
        `Username: ${form.portal_admin}\n` +
        `Email: ${form.portal_admin}@${form.org_domain}\n` +
        `Organization: ${form.name}\n\n` +
        `Enter a secure password for the portal admin:`, 
        'portaladmin123'
      );
      if (!portalAdminPassword) {
        setFormError('Portal admin password is required.');
        setSubmitting(false);
        return;
      }

      // Create organization with portal admin user in one call
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          admin_password: portalAdminPassword,
          admin_email: `${form.portal_admin}@${form.org_domain}`,
          admin_designation: 'Portal Administrator'
        }),
      });
      
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Not valid JSON
        if (!res.ok) {
          setFormError('Server error: ' + res.status);
          setSubmitting(false);
          return;
        }
      }
      
      if (!res.ok) throw new Error((data && data.message) || 'Failed to create organization');

      // Show success message with details
      if (data && data.admin_username && data.admin_email) {
        alert(`✅ Organization created successfully!\n\nPortal Admin Details:\nUsername: ${data.admin_username}\nEmail: ${data.admin_email}\nPassword: ${portalAdminPassword}\n\nThe portal admin can now log in with these credentials.`);
      }

      setShowModal(false);
      setForm({ name: '', portal_admin: '', org_domain: '', assigned_course: '', status: 'active' });
      fetchOrganizations();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }
    
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete organization');
      }
      
      // Refresh the list after successful deletion
      fetchOrganizations();
    } catch (err) {
      alert('Error deleting organization: ' + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (statusLoading) return;
    
    setStatusLoading(`${id}-${newStatus}`);
    try {
      const res = await fetch(`/api/organizations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update organization status');
      }
      
      // Refresh the list after successful update
      fetchOrganizations();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setStatusLoading(null);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        minHeight: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)',
        padding: '24px',
      }}
    >
      {/* Add enhanced style tag for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Hide scrollbars but keep functionality */
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: transparent;
        }
        
        /* For Firefox */
        * {
          scrollbar-width: none;
        }
        
        /* For IE and Edge */
        * {
          -ms-overflow-style: none;
        }
      `}</style>
      
      {/* Enhanced Header */}
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 20,
          boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
          borderRadius: '50%',
          opacity: 0.6
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
          borderRadius: '50%',
          opacity: 0.4
        }}></div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 20,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            border: '2px solid rgba(59,130,246,0.2)'
          }}>
            🏢
          </div>
          <div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 8px 0',
                lineHeight: 1.2
              }}
            >
              Organization Management
            </h1>
            <p style={{
              fontSize: 18,
              color: '#64748b',
              margin: 0,
              fontWeight: 500
            }}>
              Create and manage organizations in your learning platform
            </p>
          </div>
        </div>
        
        {/* Right side with Search and Create button */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 'clamp(12px, 2vw, 20px)',
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: '60%',
          minWidth: 0
        }}>
          {/* Search Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: '10px 18px',
            border: '1px solid rgba(226,232,240,0.8)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            minWidth: 'clamp(200px, 25vw, 280px)',
            maxWidth: '100%',
            transition: 'all 0.3s ease',
            flexShrink: 1
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#64748b" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search organizations..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 'clamp(14px, 2vw, 15px)',
                fontWeight: 500,
                color: '#334155',
                width: '100%',
                minWidth: 0,
                padding: '2px 0',
                fontFamily: 'inherit'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'rgba(148,163,184,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(148,163,184,0.2)';
                  e.currentTarget.style.color = '#334155';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          {/* Create Button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 32px)',
              fontWeight: 700,
              fontSize: 'clamp(14px, 2vw, 16px)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              outline: 'none',
              minWidth: 'fit-content'
            }}
            onClick={() => setShowModal(true)}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.4)';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onFocus={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.4)';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FaPlus size={18} />
            <span style={{ display: 'inline-block' }}>
              <span style={{ display: window.innerWidth > 768 ? 'inline' : 'none' }}>Create New Organization</span>
              <span style={{ display: window.innerWidth <= 768 ? 'inline' : 'none' }}>Create</span>
            </span>
          </button>
        </div>
      </div>
      {/* Modal for creating organization */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <form
            onSubmit={handleCreate}
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
              Create Organization
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
                Organization Name*
              </label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter organization name"
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
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Portal Admin*
              </label>
              <input 
                name="portal_admin" 
                value={form.portal_admin} 
                onChange={handleInputChange} 
                required
                placeholder="Enter admin name"
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
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Org Domain*
              </label>
              <input 
                name="org_domain" 
                value={form.org_domain} 
                onChange={handleInputChange} 
                required
                placeholder="e.g. example.com"
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
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            {/* Auto-generated email preview */}
            {form.portal_admin && form.org_domain && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                  Portal Admin Email (Auto-generated)
                </label>
                <div style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e5f3ff', 
                  fontSize: 15,
                  background: '#f0f9ff',
                  color: '#0369a1',
                  fontFamily: 'monospace'
                }}>
                  {form.portal_admin}@{form.org_domain}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Assign Course
              </label>
              <select
                name="assigned_course"
                value={form.assigned_course}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: '#fff',
                }}
              >
                <option value="">-- No course assigned --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>
                Status*
              </label>
              <select 
                name="status" 
                value={form.status} 
                onChange={handleInputChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: 10, 
                  border: '1px solid #e2e8f0', 
                  fontSize: 15,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {formError && (
              <div style={{ 
                color: '#ef4444', 
                fontWeight: 600, 
                background: '#fee2e2', 
                padding: '10px 14px', 
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
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
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: 10, 
                  border: 'none', 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff', 
                  fontWeight: 700, 
                  cursor: submitting ? 'not-allowed' : 'pointer', 
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  if (!submitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {submitting ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Table and content below the top layer */}
      <div
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px' }}>
              <Loader />
            </div>
          ) : error ? (
            <div style={{ 
              color: '#ef4444', 
              fontWeight: 600, 
              fontSize: '18px', 
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                Failed to load organizations: {error}
              </div>
            </div>
          ) : filteredOrganizations.length === 0 && searchTerm ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#64748b',
              fontSize: '18px',
              fontWeight: 500,
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '8px'
              }}>
                🔍
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>No Organizations Found</div>
                <div style={{ fontSize: '16px', opacity: 0.8 }}>
                  No organizations match "{searchTerm}". Try a different search term.
                </div>
              </div>
            </div>
          ) : organizations.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#64748b',
              fontSize: '18px',
              fontWeight: 500,
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '8px'
              }}>
                🏢
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>No Organizations Yet</div>
                <div style={{ fontSize: '16px', opacity: 0.8 }}>Create your first organization to get started</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', height: '100%', overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {filteredOrganizations.map((org, idx) => (
                  <div
                    key={org.id || org.name}
                    style={{
                      padding: '28px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '1px solid rgba(226,232,240,0.6)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* Decorative corner element */}
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      borderRadius: '50%',
                      opacity: 0.1,
                    }}></div>
                    
                    {/* Organization Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '20px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontWeight: 700, 
                          color: '#1e40af', 
                          fontSize: '22px',
                          margin: '0 0 8px 0',
                          lineHeight: '1.3'
                        }}>
                          {org.name}
                        </h3>
                        <p style={{ 
                          color: '#64748b', 
                          fontSize: '14px',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>📅</span>
                          Created: {org.created}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div style={{ 
                        padding: '6px 14px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: getStatusBgColor(org.status),
                        color: getStatusColor(org.status),
                        border: `1px solid ${getStatusColor(org.status)}20`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </div>
                    </div>

                    {/* Status Change Buttons */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#475569', 
                        marginBottom: '12px' 
                      }}>
                        Status Actions:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {org.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(org.id, 'active')}
                            disabled={statusLoading === `${org.id}-active`}
                            style={{
                              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: statusLoading === `${org.id}-active` ? 'not-allowed' : 'pointer',
                              opacity: statusLoading === `${org.id}-active` ? 0.7 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {statusLoading === `${org.id}-active` ? '...' : 'Activate'}
                          </button>
                        )}
                        {org.status !== 'inactive' && (
                          <button
                            onClick={() => handleStatusChange(org.id, 'inactive')}
                            disabled={statusLoading === `${org.id}-inactive`}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: statusLoading === `${org.id}-inactive` ? 'not-allowed' : 'pointer',
                              opacity: statusLoading === `${org.id}-inactive` ? 0.7 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {statusLoading === `${org.id}-inactive` ? '...' : 'Deactivate'}
                          </button>
                        )}
                        {org.status !== 'suspended' && (
                          <button
                            onClick={() => handleStatusChange(org.id, 'suspended')}
                            disabled={statusLoading === `${org.id}-suspended`}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: statusLoading === `${org.id}-suspended` ? 'not-allowed' : 'pointer',
                              opacity: statusLoading === `${org.id}-suspended` ? 0.7 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {statusLoading === `${org.id}-suspended` ? '...' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                      <button
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px 20px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onClick={() => {
                          setManageOrg(org);
                          setManageCourses(org.courses ? org.courses.map(c => c.id) : []);
                          setManageError('');
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ⚙️ Manage
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        disabled={deleteLoading === org.id}
                        style={{
                          background: deleteLoading === org.id 
                            ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' 
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          color: deleteLoading === org.id ? '#94a3b8' : '#dc2626',
                          border: deleteLoading === org.id 
                            ? '1px solid rgba(148,163,184,0.3)' 
                            : '1px solid rgba(220,38,38,0.2)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: deleteLoading === org.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (deleteLoading !== org.id) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deleteLoading !== org.id) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manage Organization Modal */}
      {manageOrg && (
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
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            padding: 36,
            minWidth: 360,
            maxWidth: '90vw',
            width: 480,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            position: 'relative',
            border: '1px solid rgba(226,232,240,0.8)',
          }}>
            <h3 style={{ margin: 0, color: '#1e40af', fontWeight: 800, fontSize: 22 }}>Manage Organization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8, color: '#111' }}>
              <div><b>Name:</b> {manageOrg.name}</div>
              <div><b>Portal Admin:</b> {manageOrg.portal_admin || '-'}</div>
              <div><b>Domain:</b> {manageOrg.org_domain || '-'}</div>
              <div><b>Status:</b> {manageOrg.status}</div>
              <div><b>Created:</b> {manageOrg.created}</div>
            </div>
            <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 4 }}>Assigned Courses</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 8, color: '#111' }}>
              {courses.length === 0 && <span style={{ color: '#111' }}>No courses available.</span>}
              {courses.map(course => (
                <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500, color: '#111' }}>
                  <input
                    type="checkbox"
                    checked={manageCourses.includes(course.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setManageCourses(prev => [...prev, course.id]);
                      } else {
                        setManageCourses(prev => prev.filter(id => id !== course.id));
                      }
                    }}
                  />
                  {course.title}
                  {manageCourses.includes(course.id) && <span style={{ color: '#111', fontSize: 13, marginLeft: 4 }}>(assigned)</span>}
                </label>
              ))}
            </div>
            {manageError && <div style={{ color: '#ef4444', fontWeight: 600 }}>{manageError}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setManageOrg(null)}
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
                type="button"
                disabled={manageSaving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: manageSaving ? 'not-allowed' : 'pointer',
                  opacity: manageSaving ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  fontSize: 15,
                  transition: 'all 0.2s',
                }}
                onClick={async () => {
                  setManageSaving(true);
                  setManageError('');
                  try {
                    const res = await fetch(`/api/organizations/${manageOrg.id}/assign_courses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ course_ids: manageCourses })
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.message || 'Failed to assign courses');
                    }
                    setManageOrg(null);
                    fetchOrganizations();
                  } catch (err) {
                    setManageError(err.message);
                  } finally {
                    setManageSaving(false);
                  }
                }}
              >
                {manageSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown component for assigning course to an organization
function AssignCourseDropdown({ org, courses, fetchOrganizations }) {
  const [selectedCourse, setSelectedCourse] = useState(org.assigned_course || '');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const handleAssign = async () => {
    setAssignError('');
    setAssigning(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}/assign_course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: selectedCourse })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to assign course');
      }
      fetchOrganizations();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={selectedCourse}
        onChange={e => setSelectedCourse(e.target.value)}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          fontSize: 14,
          minWidth: 120
        }}
      >
        <option value="">-- Assign Course --</option>
        {courses.map(course => (
          <option key={course.id} value={course.id}>{course.title}</option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={assigning || !selectedCourse}
        style={{
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
          fontWeight: 600,
          fontSize: 14,
          cursor: assigning || !selectedCourse ? 'not-allowed' : 'pointer',
          opacity: assigning || !selectedCourse ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {assigning ? 'Assigning...' : 'Assign'}
      </button>
      {assignError && <span style={{ color: '#ef4444', fontSize: 13 }}>{assignError}</span>}
    </div>
  );
}


const thStyle = {
  textAlign: 'left',
  padding: 'clamp(10px, 2vw, 16px) clamp(10px, 2vw, 18px)',
  fontWeight: 700,
  color: '#1e293b',
  fontSize: 'clamp(13px, 2vw, 16px)',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: 'clamp(8px, 1.5vw, 14px) clamp(8px, 1.5vw, 18px)',
  fontSize: 'clamp(12px, 2vw, 15px)',
  color: '#374151',
  background: 'none',
  whiteSpace: 'nowrap',
};

function getStatusColor(status) {
  switch (status) {
    case 'active': return '#16a34a';
    case 'inactive': return '#b45309';
    case 'suspended': return '#dc2626';
    default: return '#64748b';
  }
}

function getStatusBgColor(status) {
  switch (status) {
    case 'active': return '#dcfce7';
    case 'inactive': return '#fef3c7';
    case 'suspended': return '#fee2e2';
    default: return '#f1f5f9';
  }
}

export default OrganizationList;
