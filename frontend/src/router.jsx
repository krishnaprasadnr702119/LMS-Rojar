import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AdminDashboard from './dashboard/AdminDashboard';
import PortalAdminDashboard from './dashboard/PortalAdminDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import CourseViewer from './dashboard/CourseViewer';
import { getToken, parseJwt, isTokenExpired, getUserRole } from './utils/auth';

function UnauthorizedAccess({ requiredRole, currentRole }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '500px',
        margin: '20px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
        <h1 style={{ fontSize: '32px', margin: '0 0 16px 0', fontWeight: '700' }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '18px', margin: '0 0 24px 0', opacity: 0.9 }}>
          You don't have permission to access this page.
        </p>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          textAlign: 'left'
        }}>
          <div><strong>Required Role:</strong> {requiredRole}</div>
          <div><strong>Your Role:</strong> {currentRole || 'Not logged in'}</div>
        </div>
        
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          🏠 Go to Login
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ children, role }) {
  const token = getToken();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check token validity
    const checkAuth = () => {
      const currentToken = getToken();
      
      if (!currentToken || isTokenExpired(currentToken)) {
        setIsAuthenticated(false);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const payload = parseJwt(currentToken);
        if (!payload) {
          setIsAuthenticated(false);
          setUserRole(null);
        } else {
          setIsAuthenticated(true);
          setUserRole(payload.role);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Debug logging
  console.log('🔐 PrivateRoute Debug:', {
    hasToken: !!token,
    isAuthenticated,
    userRole,
    requiredRole: role,
    isLoading,
    route: window.location.pathname
  });

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid rgba(255, 255, 255, 0.3)', 
          borderTop: '5px solid white', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/" />;
  }
  
  if (role && userRole !== role) {
    console.log(`❌ Role mismatch: required=${role}, actual=${userRole}`);
    return <UnauthorizedAccess requiredRole={role} currentRole={userRole} />;
  }
  
  return children;
  
  if (role && payload.role !== role) {
    console.log(`❌ Role mismatch! Required: ${role}, Got: ${payload.role}`);
    console.log('🚫 ACCESS DENIED - Showing unauthorized page');
    return <UnauthorizedAccess requiredRole={role} currentRole={payload.role} />;
  }
  
  console.log('✅ Access granted for role:', payload.role);
  return children;
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/portal-admin" element={
          <PrivateRoute role="portal_admin">
            <PortalAdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/employee" element={
          <PrivateRoute role="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        } />
        <Route path="/employee/dashboard" element={
          <PrivateRoute role="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        } />
        <Route path="/employee/course/:courseId" element={
          <PrivateRoute role="employee">
            <CourseViewer />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}
