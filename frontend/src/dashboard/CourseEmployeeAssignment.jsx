import React, { useState, useEffect } from 'react';
import { getToken, parseJwt } from '../utils/auth';


function CourseEmployeeAssignment({ course, onClose }) {
  // State for assign-to-all
  const [assignAllLoading, setAssignAllLoading] = useState(false);
  const [assignAllError, setAssignAllError] = useState(null);
  // Assign course to all employees in the org
  const handleAssignToAll = async () => {
    setAssignAllLoading(true);
    setAssignAllError(null);
    try {
      const token = getToken();
      const payload = token ? parseJwt(token) : null;
      const username = payload?.username;
      let orgId = course.organization_id;
      if (!orgId) {
        // Try to fetch orgId if missing
        try {
          const orgRes = await fetch(`/api/portal_admin/course/${course.id}/organization`);
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            orgId = orgData.organization_id || orgData.id;
          }
        } catch (e) {}
      }
      if (!orgId) {
        setAssignAllError('No organization_id found for this course.');
        setAssignAllLoading(false);
        return;
      }
      const response = await fetch('/api/portal_admin/assign_course_to_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          course_id: course.id,
          organization_id: orgId
        })
      });
      const data = await response.json();
      if (data.success) {
        // All employees assigned, update UI
        setAssignedEmployees(employees.map(e => e.id));
      } else {
        setAssignAllError(data.error || 'Failed to assign course to all employees.');
      }
    } catch (err) {
      setAssignAllError('Network/server error while assigning to all: ' + (err?.message || err));
    } finally {
      setAssignAllLoading(false);
    }
  };
  const [employees, setEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [debug, setDebug] = useState(null);

  const fetchEmployees = async () => {
    try {
      setDebug(null);
      const token = getToken();
      const payload = token ? parseJwt(token) : null;
      const username = payload?.username;
      let orgId = course.organization_id;

      // If organization_id is missing, try to fetch it from backend
      if (!orgId) {
        try {
          const orgRes = await fetch(`/api/portal_admin/course/${course.id}/organization`);
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            orgId = orgData.organization_id || orgData.id;
          }
        } catch (e) {
          // ignore, will error below if still missing
        }
      }

      if (!orgId) {
        setError('No organization_id found for this course, and could not fetch from backend.');
        setDebug('orgId missing for course: ' + JSON.stringify(course));
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/portal_admin/organizations/${orgId}/employees`);
      if (!response.ok) {
        const text = await response.text();
        setError(`Failed to fetch employees (status ${response.status}): ${text}`);
        setDebug('Response not ok for employees fetch: ' + text);
        setLoading(false);
        return;
      }
      const data = await response.json();
      let employeesArr = [];
      if (Array.isArray(data)) {
        employeesArr = data;
      } else if (Array.isArray(data.employees)) {
        employeesArr = data.employees;
      } else {
        setDebug('employees is not an array: ' + JSON.stringify(data));
      }
      setEmployees(employeesArr);
      // Always include organization_id in course assignments API call
      const assignmentResponse = await fetch(`/api/portal_admin/course_assignments/${course.id}?organization_id=${orgId}`);
      if (!assignmentResponse.ok) {
        const text = await assignmentResponse.text();
        setError(`Failed to fetch course assignments (status ${assignmentResponse.status}): ${text}`);
        setDebug('Response not ok for assignments fetch: ' + text);
        setLoading(false);
        return;
      }
      const assignmentData = await assignmentResponse.json();
      // Use the new API response structure
      if (assignmentData.success && Array.isArray(assignmentData.employees)) {
        setAssignedEmployees(assignmentData.employees.filter(emp => emp.is_assigned).map(emp => emp.id));
      } else {
        setAssignedEmployees([]);
        setDebug('assignmentData.employees is not array: ' + JSON.stringify(assignmentData));
      }
    } catch (err) {
      setError('Network or server error while fetching employees: ' + (err?.message || err));
      setDebug(err?.stack || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [course.id]);

  const handleAssignToggle = async (employeeId, isCurrentlyAssigned) => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;

    setActionLoading(employeeId);
    try {
      const endpoint = isCurrentlyAssigned 
        ? '/api/portal_admin/unassign_course_from_employee'
        : '/api/portal_admin/assign_course_to_employee';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          course_id: course.id,
          employee_id: employeeId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the assigned employees list
        if (isCurrentlyAssigned) {
          setAssignedEmployees(prev => prev.filter(id => id !== employeeId));
        } else {
          setAssignedEmployees(prev => [...prev, employeeId]);
        }
      } else {
        setError(data.error || `Failed to ${isCurrentlyAssigned ? 'unassign' : 'assign'} course`);
      }
    } catch (err) {
      setError(`Network error while ${isCurrentlyAssigned ? 'unassigning' : 'assigning'} course`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        Loading employees...
      </div>
    </div>
  );


  if (error) return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          ⚠️ Error Loading Employees
        </div>
        <div style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</div>
        {debug && (
          <details style={{ margin: '1em 0', color: '#555', background: '#f9f9f9', padding: '0.5em', borderRadius: '4px' }}>
            <summary>Debug Info</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debug}</pre>
          </details>
        )}
        <button
          onClick={onClose}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );


  // Defensive: If employees is not an array, show error and debug info
  if (!Array.isArray(employees)) {
    return (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            ⚠️ Unexpected Error
          </div>
          <div style={{ color: '#6b7280', marginBottom: '24px' }}>
            Employees data is missing or invalid.
          </div>
          {debug && (
            <details style={{ margin: '1em 0', color: '#555', background: '#f9f9f9', padding: '0.5em', borderRadius: '4px' }}>
              <summary>Debug Info</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debug}</pre>
            </details>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              👥 Assign Course to Employees
            </h2>
            <div style={{ color: '#6b7280', fontSize: '16px' }}>
              📚 <strong>{course.title}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ✅ {assignedEmployees.length} Assigned
            </div>
            <div style={{
              background: '#f3f4f6',
              color: '#6b7280',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              👥 {employees.length} Total Employees
            </div>
          </div>
        </div>

        {/* Assign to All Employees Button */}
        <div style={{ marginBottom: '18px', textAlign: 'center' }}>
          {assignAllError && (
            <div style={{ color: '#dc2626', marginBottom: '8px', fontWeight: 600 }}>
              {assignAllError}
            </div>
          )}
          <button
            onClick={handleAssignToAll}
            disabled={assignAllLoading || employees.length === 0}
            style={{
              background: assignAllLoading ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 28px',
              fontWeight: '700',
              fontSize: '16px',
              cursor: assignAllLoading || employees.length === 0 ? 'not-allowed' : 'pointer',
              marginBottom: '2px',
              boxShadow: '0 2px 8px rgba(59,130,246,0.08)'
            }}
          >
            {assignAllLoading ? '⏳ Assigning to All...' : '🚀 Assign to All Employees'}
          </button>
        </div>

        {employees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            fontSize: '16px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            👤 No employees found in your organization
            {debug && (
              <details style={{ margin: '1em 0', color: '#555', background: '#f9f9f9', padding: '0.5em', borderRadius: '4px' }}>
                <summary>Debug Info</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debug}</pre>
              </details>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {employees.map(employee => {
              const isAssigned = assignedEmployees.includes(employee.id);
              const isLoading = actionLoading === employee.id;
              return (
                <div key={employee.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '18px',
                  background: isAssigned ? 'linear-gradient(90deg, #e0f2fe 0%, #f0f9ff 100%)' : '#f9fafb',
                  border: isAssigned ? '2px solid #38bdf8' : '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: isAssigned ? '0 2px 12px rgba(59,130,246,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  gap: '18px',
                  marginBottom: '0px',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: isAssigned ? 'linear-gradient(135deg, #38bdf8 60%, #3b82f6 100%)' : '#6b7280',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '22px',
                    boxShadow: isAssigned ? '0 2px 8px #bae6fd' : 'none',
                    border: isAssigned ? '2px solid #bae6fd' : 'none',
                  }}>
                    {(
                      (employee.name && typeof employee.name === 'string' && employee.name.length > 0)
                        ? employee.name.charAt(0).toUpperCase()
                        : (employee.username && typeof employee.username === 'string' && employee.username.length > 0)
                          ? employee.username.charAt(0).toUpperCase()
                          : '?'
                    )}
                  </div>
                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '18px', marginBottom: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {employee.name || employee.username || <span style={{color:'#dc2626'}}>Unknown</span>}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '15px', marginBottom: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {employee.email || <span style={{color:'#dc2626'}}>No email</span>}
                    </div>
                    {employee.department && (
                      <div style={{ color: '#0ea5e9', fontSize: '13px', fontWeight: 500 }}>{employee.department}</div>
                    )}
                  </div>
                  {/* Assign/Remove Button */}
                  <button
                    onClick={() => handleAssignToggle(employee.id, isAssigned)}
                    disabled={isLoading}
                    style={{
                      background: isLoading ? '#9ca3af' : isAssigned ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)' : 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: isAssigned ? '0 2px 8px #fecaca' : '0 1px 4px #d1fae5',
                      transition: 'all 0.2s ease',
                      minWidth: '110px',
                      outline: isAssigned ? '2px solid #ef4444' : 'none',
                    }}
                  >
                    {isLoading ? '⏳...' : isAssigned ? '❌ Remove' : '✅ Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0c4a6e'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>ℹ️ Course Assignment Info:</div>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Assigned employees can access this course and its modules</li>
            <li>You can assign/remove employees at any time</li>
            <li>Employees will be notified when courses are assigned to them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CourseEmployeeAssignment;
