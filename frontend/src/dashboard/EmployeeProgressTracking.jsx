import React, { useState, useEffect } from 'react';
import { getToken, parseJwt } from '../utils/auth';

function EmployeeProgressTracking() {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchProgressData = async () => {
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const username = payload?.username;
    
    if (!username) {
      setError('No username found in token. Please log in again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/portal_admin/employee_progress?username=${username}`);
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch progress data');
      }
    } catch (err) {
      setError('Failed to fetch progress data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return { bg: '#fecaca', color: '#dc2626', label: 'High Risk' };
    if (riskScore >= 40) return { bg: '#fed7aa', color: '#ea580c', label: 'Medium Risk' };
    return { bg: '#dcfce7', color: '#166534', label: 'Low Risk' };
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading employee progress data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#fee2e2',
        borderRadius: '12px',
        border: '1px solid #fca5a5',
        color: '#dc2626',
        fontWeight: '500'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #93c5fd'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e40af', fontWeight: '600' }}>
            👥 Total Employees
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#1d4ed8' }}>
            {progressData?.summary?.total_employees || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #86efac'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#166534', fontWeight: '600' }}>
            📊 Avg Completion Rate
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#15803d' }}>
            {progressData?.summary?.average_completion_rate || 0}%
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #f87171'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#dc2626', fontWeight: '600' }}>
            ⚠️ Employees at Risk
          </h3>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626' }}>
            {progressData?.summary?.employees_at_risk || 0}
          </div>
        </div>
      </div>

      {/* Employee Progress Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        padding: '32px',
        marginBottom: '32px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: '0 0 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          📈 Employee Progress Overview
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Employee</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Courses</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Progress</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Risk Level</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {progressData?.employee_progress?.map((employee, index) => {
                const risk = getRiskColor(employee.overall_risk_score);
                return (
                  <tr key={employee.employee_id} style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff'
                  }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {employee.employee_name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {employee.employee_email}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {employee.designation}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {employee.completed_courses}/{employee.total_courses}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        completed
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ 
                        width: '100px', 
                        height: '8px', 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: '4px',
                        margin: '0 auto 8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${employee.average_progress}%`,
                          height: '100%',
                          backgroundColor: getProgressColor(employee.average_progress),
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {employee.average_progress}%
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{
                        background: risk.bg,
                        color: risk.color,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {risk.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                        Score: {employee.overall_risk_score}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedEmployee(employee)}
                        style={{
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#2563eb';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#3b82f6';
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                📊 {selectedEmployee.employee_name} - Detailed Progress
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Email</div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>{selectedEmployee.employee_email}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Designation</div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>{selectedEmployee.designation}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Risk Score</div>
                  <div style={{ fontWeight: '600', color: getRiskColor(selectedEmployee.overall_risk_score).color }}>
                    {selectedEmployee.overall_risk_score}/100
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              Course Progress Details
            </h4>

            <div style={{ display: 'grid', gap: '16px' }}>
              {selectedEmployee.course_progress.map((course) => (
                <div key={course.course_id} style={{
                  background: '#f8fafc',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {course.course_title}
                    </h5>
                    <div style={{
                      background: course.progress_percentage === 100 ? '#dcfce7' : '#fed7aa',
                      color: course.progress_percentage === 100 ? '#166534' : '#ea580c',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {course.progress_percentage === 100 ? '✅ Completed' : '⏳ In Progress'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Progress</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {course.progress_percentage}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${course.progress_percentage}%`,
                        height: '100%',
                        backgroundColor: getProgressColor(course.progress_percentage),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Modules: </span>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {course.completed_modules}/{course.total_modules}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Last Activity: </span>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {course.last_activity ? new Date(course.last_activity).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    {course.completion_date && (
                      <div>
                        <span style={{ color: '#6b7280' }}>Completed: </span>
                        <span style={{ fontWeight: '600', color: '#16a34a' }}>
                          {new Date(course.completion_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedEmployee.overall_risk_score > 60 && (
              <div style={{
                marginTop: '24px',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#d97706', fontSize: '16px', fontWeight: '600' }}>
                  ⚠️ Training Recommendations
                </h5>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#92400e' }}>
                  <li>Schedule additional training sessions</li>
                  <li>Provide one-on-one mentoring support</li>
                  <li>Send progress reminders and deadlines</li>
                  <li>Review course difficulty and provide resources</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeProgressTracking;
