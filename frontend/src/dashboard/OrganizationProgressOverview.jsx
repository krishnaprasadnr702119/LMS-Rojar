import { useState, useEffect } from 'react';

function OrganizationProgressOverview() {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/organization_progress?username=admin');
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch organization progress data');
      }
    } catch (err) {
      setError('Failed to fetch organization progress data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const getRiskLevel = (employeesAtRisk, totalEmployees) => {
    if (totalEmployees === 0) return { color: '#6b7280', label: 'No Data', bg: '#f3f4f6' };
    const riskPercentage = (employeesAtRisk / totalEmployees) * 100;
    if (riskPercentage >= 50) return { color: '#dc2626', label: 'High Risk', bg: '#fecaca' };
    if (riskPercentage >= 25) return { color: '#ea580c', label: 'Medium Risk', bg: '#fed7aa' };
    return { color: '#166534', label: 'Low Risk', bg: '#dcfce7' };
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
          Loading organization progress data...
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
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ 
        maxWidth: '1600px', 
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(12px, 2vw, 24px)',
        minHeight: '100vh'
      }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: 'clamp(16px, 4vw, 24px)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(20px, 5vw, 36px)', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 12px)',
          flexWrap: 'wrap'
        }}>
          📊 Organization Progress Overview
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0',
          fontSize: 'clamp(14px, 2.5vw, 16px)',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.5'
        }}>
          Monitor training progress and risk levels across all organizations
        </p>
      </div>

      {/* Overall Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', 
        gap: 'clamp(20px, 3vw, 28px)', 
        marginBottom: 'clamp(28px, 5vw, 40px)' 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 24px)',
          border: '1px solid #93c5fd',
          textAlign: 'center',
          transition: 'transform 0.2s ease',
          cursor: 'default'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 'clamp(14px, 2.5vw, 16px)', 
            color: '#1e40af', 
            fontWeight: '600' 
          }}>
            🏢 Total Organizations
          </h3>
          <div style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            fontWeight: '800', 
            color: '#1d4ed8' 
          }}>
            {progressData?.overall_summary?.total_organizations || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 24px)',
          border: '1px solid #86efac',
          textAlign: 'center',
          transition: 'transform 0.2s ease',
          cursor: 'default'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 'clamp(14px, 2.5vw, 16px)', 
            color: '#166534', 
            fontWeight: '600' 
          }}>
            👥 Total Employees
          </h3>
          <div style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            fontWeight: '800', 
            color: '#15803d' 
          }}>
            {progressData?.overall_summary?.total_employees || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 24px)',
          border: '1px solid #f87171',
          textAlign: 'center',
          transition: 'transform 0.2s ease',
          cursor: 'default'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 'clamp(14px, 2.5vw, 16px)', 
            color: '#dc2626', 
            fontWeight: '600' 
          }}>
            ⚠️ Organizations with High Risk
          </h3>
          <div style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            fontWeight: '800', 
            color: '#dc2626' 
          }}>
            {progressData?.overall_summary?.organizations_with_high_risk || 0}
          </div>
        </div>
      </div>

      {/* Organization Progress Grid */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '20px', 
        boxShadow: '0 6px 28px rgba(0,0,0,0.08)', 
        padding: 'clamp(20px, 4vw, 40px)'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(20px, 4vw, 28px)', 
          fontWeight: '700', 
          color: '#1f2937',
          margin: '0 0 clamp(20px, 3vw, 28px) 0',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 16px)'
        }}>
          📊 Organization Progress Overview
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', 
          gap: 'clamp(20px, 3vw, 28px)' 
        }}>
          {progressData?.organization_progress?.map((org) => {
            const risk = getRiskLevel(org.employees_at_risk, org.total_employees);
            return (
              <div key={org.organization_id} style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '18px',
                padding: 'clamp(18px, 3vw, 28px)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOrg(org)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 'clamp(12px, 2.5vw, 16px)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: 'clamp(16px, 3vw, 18px)', 
                    fontWeight: '700', 
                    color: '#1f2937' 
                  }}>
                    {org.organization_name}
                  </h3>
                  <div style={{
                    background: risk.bg,
                    color: risk.color,
                    padding: 'clamp(3px, 1vw, 4px) clamp(8px, 2vw, 12px)',
                    borderRadius: '12px',
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    fontWeight: '600'
                  }}>
                    {risk.label}
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: 'clamp(14px, 2.5vw, 20px)', 
                  marginBottom: 'clamp(14px, 2.5vw, 20px)' 
                }}>
                  <div style={{ 
                    background: '#fff', 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ 
                      fontSize: 'clamp(10px, 2vw, 12px)', 
                      color: '#6b7280', 
                      marginBottom: '4px' 
                    }}>Employees</div>
                    <div style={{ 
                      fontSize: 'clamp(16px, 3.5vw, 20px)', 
                      fontWeight: '700', 
                      color: '#1f2937' 
                    }}>
                      {org.total_employees}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ 
                      fontSize: 'clamp(10px, 2vw, 12px)', 
                      color: '#6b7280', 
                      marginBottom: '4px' 
                    }}>Courses</div>
                    <div style={{ 
                      fontSize: 'clamp(16px, 3.5vw, 20px)', 
                      fontWeight: '700', 
                      color: '#1f2937' 
                    }}>
                      {org.total_courses_assigned}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 'clamp(12px, 2.5vw, 16px)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '8px' 
                  }}>
                    <span style={{ 
                      fontSize: 'clamp(12px, 2.5vw, 14px)', 
                      color: '#6b7280' 
                    }}>Completion Rate</span>
                    <span style={{ 
                      fontSize: 'clamp(12px, 2.5vw, 14px)', 
                      fontWeight: '600', 
                      color: '#1f2937' 
                    }}>
                      {org.average_completion_rate}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 'clamp(6px, 1.5vw, 8px)',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${org.average_completion_rate}%`,
                      height: '100%',
                      backgroundColor: org.average_completion_rate >= 80 ? '#10b981' : 
                                     org.average_completion_rate >= 50 ? '#f59e0b' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ 
                    fontSize: 'clamp(10px, 2vw, 12px)', 
                    color: '#6b7280' 
                  }}>
                    At Risk: {org.employees_at_risk}/{org.total_employees}
                  </div>
                  <button style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Organization Detail Modal */}
      {selectedOrg && (
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
          justifyContent: 'center',
          padding: 'clamp(8px, 2vw, 16px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: 'clamp(20px, 4vw, 40px)',
            maxWidth: 'min(1200px, 95vw)',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'clamp(16px, 3vw, 24px)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: '700', 
                color: '#1f2937' 
              }}>
                🏢 {selectedOrg.organization_name} - Detailed Analytics
              </h3>
              <button
                onClick={() => setSelectedOrg(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'clamp(20px, 4vw, 24px)',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', 
              gap: 'clamp(16px, 2.5vw, 20px)', 
              marginBottom: 'clamp(20px, 3vw, 28px)' 
            }}>
              <div style={{ 
                background: '#f8fafc', 
                padding: 'clamp(12px, 2.5vw, 16px)', 
                borderRadius: '12px' 
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 2.5vw, 14px)', 
                  color: '#6b7280' 
                }}>Total Employees</div>
                <div style={{ 
                  fontSize: 'clamp(18px, 4vw, 24px)', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  {selectedOrg.total_employees}
                </div>
              </div>
              <div style={{ 
                background: '#f8fafc', 
                padding: 'clamp(12px, 2.5vw, 16px)', 
                borderRadius: '12px' 
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 2.5vw, 14px)', 
                  color: '#6b7280' 
                }}>Courses Assigned</div>
                <div style={{ 
                  fontSize: 'clamp(18px, 4vw, 24px)', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  {selectedOrg.total_courses_assigned}
                </div>
              </div>
              <div style={{ 
                background: '#f8fafc', 
                padding: 'clamp(12px, 2.5vw, 16px)', 
                borderRadius: '12px' 
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 2.5vw, 14px)', 
                  color: '#6b7280' 
                }}>Completion Rate</div>
                <div style={{ 
                  fontSize: 'clamp(18px, 4vw, 24px)', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  {selectedOrg.average_completion_rate}%
                </div>
              </div>
              <div style={{ 
                background: '#f8fafc', 
                padding: 'clamp(12px, 2.5vw, 16px)', 
                borderRadius: '12px' 
              }}>
                <div style={{ 
                  fontSize: 'clamp(12px, 2.5vw, 14px)', 
                  color: '#6b7280' 
                }}>At Risk</div>
                <div style={{ 
                  fontSize: 'clamp(18px, 4vw, 24px)', 
                  fontWeight: '700', 
                  color: '#dc2626' 
                }}>
                  {selectedOrg.employees_at_risk}
                </div>
              </div>
            </div>

            {selectedOrg.high_risk_employees.length > 0 && (
              <div>
                <h4 style={{ 
                  margin: '0 0 clamp(12px, 2.5vw, 16px) 0', 
                  fontSize: 'clamp(16px, 3vw, 18px)', 
                  fontWeight: '600', 
                  color: '#1f2937' 
                }}>
                  ⚠️ High Risk Employees
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gap: 'clamp(8px, 2vw, 12px)' 
                }}>
                  {selectedOrg.high_risk_employees.map((employee) => (
                    <div key={employee.employee_id} style={{
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '12px',
                      padding: 'clamp(12px, 2.5vw, 16px)',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: 'clamp(12px, 2.5vw, 16px)'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#1f2937', 
                          marginBottom: '4px',
                          fontSize: 'clamp(14px, 2.5vw, 16px)'
                        }}>
                          {employee.employee_name}
                        </div>
                        <div style={{ 
                          fontSize: 'clamp(12px, 2.5vw, 14px)', 
                          color: '#6b7280', 
                          marginBottom: '4px' 
                        }}>
                          {employee.employee_email} • {employee.designation}
                        </div>
                        <div style={{ 
                          fontSize: 'clamp(10px, 2vw, 12px)', 
                          color: '#92400e' 
                        }}>
                          {employee.courses_completed}/{employee.courses_assigned} courses completed
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: 'clamp(16px, 3.5vw, 20px)', 
                          fontWeight: '700', 
                          color: '#dc2626' 
                        }}>
                          {employee.completion_rate}%
                        </div>
                        <div style={{ 
                          fontSize: 'clamp(8px, 1.5vw, 10px)', 
                          color: '#6b7280' 
                        }}>
                          completion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 'clamp(16px, 3vw, 24px)',
                  background: '#dbeafe',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  padding: 'clamp(12px, 2.5vw, 16px)'
                }}>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#1e40af', 
                    fontSize: 'clamp(14px, 2.5vw, 16px)', 
                    fontWeight: '600' 
                  }}>
                    💡 Recommended Actions
                  </h5>
                  <ul style={{ 
                    margin: '0', 
                    paddingLeft: 'clamp(16px, 3vw, 20px)', 
                    color: '#1e40af',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>
                    <li>Contact portal admin to schedule additional training sessions</li>
                    <li>Review course difficulty and provide additional resources</li>
                    <li>Implement automated progress reminder system</li>
                    <li>Consider mandatory completion deadlines</li>
                    <li>Provide incentives for course completion</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedOrg.high_risk_employees.length === 0 && (
              <div style={{
                background: '#dcfce7',
                border: '1px solid #16a34a',
                borderRadius: '12px',
                padding: 'clamp(16px, 4vw, 24px)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: 'clamp(32px, 8vw, 48px)', 
                  marginBottom: 'clamp(8px, 2vw, 12px)' 
                }}>🎉</div>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#166534', 
                  fontSize: 'clamp(16px, 3vw, 18px)', 
                  fontWeight: '600' 
                }}>
                  Excellent Performance!
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: '#15803d',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  This organization has no high-risk employees. All employees are making good progress on their assigned courses.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default OrganizationProgressOverview;
