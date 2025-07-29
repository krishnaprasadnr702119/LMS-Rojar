import React, { useState } from 'react';
import { getToken, parseJwt } from '../utils/auth';

function LoginDebug() {
  const [loginData, setLoginData] = useState({
    username: 'krishnaprasad.nr',
    password: 'portaladmin123'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get current token info
  const token = getToken();
  const payload = token ? parseJwt(token) : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setMessage(`✅ Login successful! Token saved. Role: ${data.role}`);
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Login failed: ${data.message}`);
      }
    } catch (err) {
      setMessage('❌ Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setMessage('✅ Logged out successfully');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const testAPI = async () => {
    if (!payload?.username) {
      setMessage('❌ No username in token');
      return;
    }

    console.log('🔍 Testing API with user:', payload);

    try {
      // Test multiple endpoints to identify the issue
      const endpoints = [
        `/api/hello`,
       // `/api/portal_admin/system_stats?username=${payload.username}`,
       // `/api/debug/portal_admin/${payload.username}`
      ];

      for (const endpoint of endpoints) {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log(`${endpoint} Response:`, {
          status: response.status,
          data: data
        });
      }
      
      setMessage(`✅ API tests completed! Check browser console (F12) for detailed results.`);
    } catch (err) {
      console.error('API Test Error:', err);
      setMessage('❌ API test failed with network error');
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      background: '#fff', 
      border: '2px solid #e5e7eb', 
      borderRadius: '12px', 
      padding: '20px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 1000
    }}>

      {/* Login Form */}
      {!payload && (
        <form onSubmit={handleLogin} style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              Username:
            </label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              Password:
            </label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: loading ? '#9ca3af' : '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {payload && (
          <>
            <button
              onClick={testAPI}
              style={{ 
                flex: 1,
                padding: '8px', 
                background: '#10b981', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Test API
            </button>
            <button
              onClick={handleLogout}
              style={{ 
                flex: 1,
                padding: '8px', 
                background: '#ef4444', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div style={{ 
          padding: '10px', 
          background: message.includes('✅') ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '6px',
          fontSize: '14px',
          wordBreak: 'break-word'
        }}>
          {message}
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '16px', 
        padding: '10px', 
        background: '#fef3c7', 
        border: '1px solid #fbbf24', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>📋 Instructions:</strong><br/>
        1. Use username: <code>krishnaprasad.nr</code><br/>
        2. Use password: <code>portaladmin123</code><br/>
        3. After login, check browser console (F12) for API debug info
      </div>
    </div>
  );
}

export default LoginDebug;
