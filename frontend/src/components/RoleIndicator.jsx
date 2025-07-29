import React from 'react';
import { getToken, parseJwt } from '../utils/auth';

function RoleIndicator() {
  const token = getToken();
  const payload = token ? parseJwt(token) : null;
  
  if (!payload) return null;
  
  const roleColors = {
    'admin': { bg: '#fee2e2', color: '#dc2626', icon: '👑' },
    'portal_admin': { bg: '#ede9fe', color: '#7c3aed', icon: '🏢' },
    'employee': { bg: '#f0fdf4', color: '#166534', icon: '👤' }
  };
  
  const roleInfo = roleColors[payload.role] || { bg: '#f3f4f6', color: '#374151', icon: '❓' };
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: roleInfo.bg,
      color: roleInfo.color,
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      fontWeight: '600',
      border: `2px solid ${roleInfo.color}20`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontSize: '16px' }}>{roleInfo.icon}</span>
      <span>Role: {payload.role.toUpperCase()}</span>
      <span style={{ opacity: 0.7 }}>({payload.username})</span>
    </div>
  );
}

export default RoleIndicator;
