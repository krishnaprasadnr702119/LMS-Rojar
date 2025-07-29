import React, { useState } from 'react';
import { getToken, parseJwt } from '../utils/auth';

function PasswordReset() {
  const [activeTab, setActiveTab] = useState('change'); // 'change', 'reset-employee', 'reset-admin'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get current user info from token
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  const currentUser = payload?.username;
  const currentRole = payload?.role;

  // Self-service password change form data
  const [changePasswordData, setChangePasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Employee password reset form data (for portal admin)
  const [employeeResetData, setEmployeeResetData] = useState({
    employee_username: ''
  });

  // Portal admin password reset form data (for admin)
  const [adminResetData, setAdminResetData] = useState({
    portal_admin_username: ''
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (changePasswordData.new_password !== changePasswordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (changePasswordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          current_password: changePasswordData.current_password,
          new_password: changePasswordData.new_password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Password changed successfully!');
        setChangePasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(`❌ ${data.error}`);
      }
    } catch (err) {
      setError('❌ Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmployeePassword = async (e) => {
    e.preventDefault();
    
    if (!employeeResetData.employee_username.trim()) {
      setError('Employee username is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/portal_admin/reset_employee_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_admin_username: currentUser,
          employee_username: employeeResetData.employee_username
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Employee password reset successfully! Email sent to: ${data.employee_email}`);
        setEmployeeResetData({ employee_username: '' });
      } else {
        setError(`❌ ${data.error}`);
      }
    } catch (err) {
      setError('❌ Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdminPassword = async (e) => {
    e.preventDefault();
    
    if (!adminResetData.portal_admin_username.trim()) {
      setError('Portal admin username is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/reset_portal_admin_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_admin_username: adminResetData.portal_admin_username
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Portal admin password reset successfully! New password: ${data.new_password}`);
        setAdminResetData({ portal_admin_username: '' });
      } else {
        setError(`❌ ${data.error}`);
      }
    } catch (err) {
      setError('❌ Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#3b82f6' : '#f3f4f6',
    color: isActive ? '#fff' : '#374151',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', 
        padding: '32px'
      }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          🔐 Password Management
        </h2>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('change')}
            style={tabStyle(activeTab === 'change')}
          >
            Change My Password
          </button>
          
          {currentRole === 'portal_admin' && (
            <button 
              onClick={() => setActiveTab('reset-employee')}
              style={tabStyle(activeTab === 'reset-employee')}
            >
              Reset Employee Password
            </button>
          )}
          
          {currentRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('reset-admin')}
              style={tabStyle(activeTab === 'reset-admin')}
            >
              Reset Portal Admin Password
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '24px',
            color: '#166534',
            fontSize: '16px'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Change Password Form */}
        {activeTab === 'change' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Current Password
              </label>
              <input
                type="password"
                value={changePasswordData.current_password}
                onChange={(e) => setChangePasswordData({...changePasswordData, current_password: e.target.value})}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                New Password
              </label>
              <input
                type="password"
                value={changePasswordData.new_password}
                onChange={(e) => setChangePasswordData({...changePasswordData, new_password: e.target.value})}
                style={inputStyle}
                required
                minLength="6"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={changePasswordData.confirm_password}
                onChange={(e) => setChangePasswordData({...changePasswordData, confirm_password: e.target.value})}
                style={inputStyle}
                required
              />
            </div>

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? '🔄 Changing Password...' : '🔐 Change Password'}
            </button>
          </form>
        )}

        {/* Reset Employee Password Form */}
        {activeTab === 'reset-employee' && currentRole === 'portal_admin' && (
          <form onSubmit={handleResetEmployeePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Employee Username
              </label>
              <input
                type="text"
                value={employeeResetData.employee_username}
                onChange={(e) => setEmployeeResetData({...employeeResetData, employee_username: e.target.value})}
                style={inputStyle}
                placeholder="Enter employee username"
                required
              />
            </div>

            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '8px', 
              padding: '16px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              ⚠️ This will generate a new temporary password and send it to the employee's email address.
            </div>

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? '🔄 Resetting Password...' : '🔑 Reset Employee Password'}
            </button>
          </form>
        )}

        {/* Reset Portal Admin Password Form */}
        {activeTab === 'reset-admin' && currentRole === 'admin' && (
          <form onSubmit={handleResetAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Portal Admin Username
              </label>
              <input
                type="text"
                value={adminResetData.portal_admin_username}
                onChange={(e) => setAdminResetData({...adminResetData, portal_admin_username: e.target.value})}
                style={inputStyle}
                placeholder="Enter portal admin username"
                required
              />
            </div>

            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '8px', 
              padding: '16px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              ⚠️ This will generate a new temporary password and send it to the portal admin's email address.
            </div>

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? '🔄 Resetting Password...' : '🔑 Reset Portal Admin Password'}
            </button>
          </form>
        )}

        {/* User Info */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <strong>Current User:</strong> {currentUser} ({currentRole})
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
