import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken, parseJwt } from '../utils/auth';
import '../App.css';

function LoginPage() {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    org_name: '',
    org_domain: '',
  });
  const [registerStatus, setRegisterStatus] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegisterChange = e => {
    setRegisterForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterStatus(null);
    setRegisterLoading(true);
    if (!registerForm.username || !registerForm.password || !registerForm.org_name || !registerForm.org_domain) {
      setRegisterStatus({ success: false, message: 'Please fill all fields.' });
      setRegisterLoading(false);
      return;
    }
    try {
      const orgRes = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.org_name,
          portal_admin: registerForm.username,
          org_domain: registerForm.org_domain,
          status: 'active',
          admin_password: registerForm.password,
          admin_email: `${registerForm.username}@${registerForm.org_domain}`,
          admin_designation: 'Portal Administrator'
        })
      });
      const orgData = await orgRes.json();
      if (!orgRes.ok) throw new Error(orgData.message || 'Failed to create organization');

      setRegisterStatus({ 
        success: true, 
        message: `✅ Registration successful!\n\nYour portal admin account has been created:\n• Username: ${registerForm.username}\n• Email: ${registerForm.username}@${registerForm.org_domain}\n• Organization: ${registerForm.org_name}\n\nYou can now log in with your credentials.` 
      });
      setShowRegister(false);
      setRegisterForm({ username: '', password: '', org_name: '', org_domain: '' });
    } catch (err) {
      setRegisterStatus({ success: false, message: err.message });
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((error) => {
        setMessage('Could not fetch backend message.');
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginStatus(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setLoginStatus({ success: true, message: data.message });
        setLoggedIn(true);
        const payload = parseJwt(data.token);
        if (payload && payload.role) {
          if (payload.role === 'admin') navigate('/admin');
          else if (payload.role === 'portal_admin') navigate('/portal-admin');
          else if (payload.role === 'employee') navigate('/employee');
          else navigate('/');
        } else {
          navigate('/');
        }
      } else {
        setLoginStatus({ success: false, message: data.message });
      }
    } catch (err) {
      setLoginStatus({ success: false, message: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      zIndex: 1000
    }}>
      {showRegister ? (
        <form
          onSubmit={handleRegister}
          style={{
            width: '100%',
            maxWidth: 550,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2)',
            padding: 60,
            position: 'relative',
            overflow: 'hidden'
          }}
          autoComplete="off"
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold'
            }}>
              📝
            </div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>Register as Portal Admin</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 18 }}>Create your organization and portal admin account</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <input name="username" value={registerForm.username} onChange={handleRegisterChange} placeholder="Portal Admin Username" required style={{ padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 18 }} />
            <input name="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="Password" type="password" required style={{ padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 18 }} />
            <input name="org_name" value={registerForm.org_name} onChange={handleRegisterChange} placeholder="Organization Name" required style={{ padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 18 }} />
            <input name="org_domain" value={registerForm.org_domain} onChange={handleRegisterChange} placeholder="Organization Domain (e.g., company.com)" required style={{ padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 18 }} />
            {registerForm.username && registerForm.org_domain && (
              <div style={{ 
                padding: '16px 20px', 
                borderRadius: 12, 
                border: '2px solid #e5f3ff', 
                fontSize: 16,
                background: '#f0f9ff',
                color: '#0369a1',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e', fontFamily: 'inherit' }}>
                  📧 Portal Admin Email (Auto-generated):
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {registerForm.username}@{registerForm.org_domain}
                </div>
              </div>
            )}
          </div>
          <button type="submit" disabled={registerLoading} style={{ width: '100%', background: registerLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: 12, padding: '18px 0', fontWeight: 600, fontSize: 18, cursor: registerLoading ? 'not-allowed' : 'pointer', marginTop: 24 }}>
            {registerLoading ? 'Registering...' : 'Register'}
          </button>
          <button type="button" onClick={() => setShowRegister(false)} style={{ marginTop: 16, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Back to Login</button>
          {registerStatus && (
            <div style={{ 
              marginTop: 18, 
              padding: 16, 
              borderRadius: 10, 
              textAlign: registerStatus.success ? 'left' : 'center', 
              fontWeight: 500, 
              fontSize: 14, 
              background: registerStatus.success ? '#ecfdf5' : '#fef2f2', 
              color: registerStatus.success ? '#065f46' : '#991b1b', 
              border: `1px solid ${registerStatus.success ? '#a7f3d0' : '#fecaca'}`,
              whiteSpace: 'pre-line',
              fontFamily: registerStatus.success ? 'monospace' : 'inherit'
            }}>
              {registerStatus.message}
            </div>
          )}
        </form>
      ) : (
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: 550,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2)',
            padding: 60,
            position: 'relative',
            overflow: 'hidden'
          }}
          autoComplete="off"
        >
        <div style={{
          position: 'absolute',
          top: -70,
          right: -70,
          width: 160,
          height: 160,
          background: 'linear-gradient(135deg, #667eea20, #764ba220)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold'
            }}>
              🔐
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: 12
            }}>
              Welcome Back
            </h1>
            <p style={{
              margin: 0,
              color: '#6b7280',
              fontSize: 18
            }}>
              Sign in to your account
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 16,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 10
              }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: '2px solid #e5e7eb',
                  fontSize: 18,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#667eea'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 16,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 10
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: '2px solid #e5e7eb',
                    fontSize: 18,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#667eea',
                    fontSize: 18,
                    fontWeight: 600
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              style={{
                width: '100%',
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '18px 0',
                fontWeight: 600,
                fontSize: 18,
                cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
                marginTop: 12,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
              onMouseEnter={e => {
                if (!isLoading && username && password) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={e => {
                if (!isLoading && username && password) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
          <div style={{
            marginTop: 32,
            padding: 20,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#64748b',
              marginBottom: 12,
              textAlign: 'center'
            }}>
              Demo Credentials
            </div>
            <div style={{ fontSize: 16, color: '#475569', textAlign: 'center' }}>
              <div><strong>Username:</strong> admin</div>
              <div><strong>Password:</strong> admin123</div>
            </div>
          </div>
          <button type="button" onClick={() => setShowRegister(true)} style={{ marginTop: 24, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Register as Portal Admin</button>
          {loginStatus && (
            <div style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 12,
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 16,
              background: loginStatus.success ? '#ecfdf5' : '#fef2f2',
              color: loginStatus.success ? '#065f46' : '#991b1b',
              border: `1px solid ${loginStatus.success ? '#a7f3d0' : '#fecaca'}`
            }}>
              {loginStatus.message}
            </div>
          )}
          {message && (
            <div style={{
              marginTop: 20,
              fontSize: 14,
              color: '#6b7280',
              textAlign: 'center',
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8
            }}>
              Backend: {message}
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </form>
      )}
    </div>
  );
}

export default LoginPage;
