import React, { useState, useEffect } from 'react';

const EnhancedProgressDisplay = ({ 
  moduleId, 
  username, 
  refreshTrigger = 0,
  showDetailed = false 
}) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (moduleId && username) {
      fetchProgress();
    }
  }, [moduleId, username, refreshTrigger]);

  const fetchProgress = async () => {
    if (!username || !moduleId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/employee/module_progress?username=${username}&module_id=${moduleId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgress(data.progress);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!progress && !loading) return null;

  const progressPercentage = progress?.progress_percentage || 0;
  const isCompleted = progress?.completed || false;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #cbd5e1',
      marginTop: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          Module Progress
        </h4>
        
        {loading && (
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Updating...
          </div>
        )}
        
        {lastUpdated && !loading && (
          <div style={{
            fontSize: '12px',
            color: '#64748b'
          }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          background: isCompleted 
            ? 'linear-gradient(90deg, #10b981, #059669)' 
            : 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
          transition: 'width 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>

      {/* Progress Details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: isCompleted ? '#059669' : '#1e293b'
        }}>
          {Math.round(progressPercentage)}% Complete
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isCompleted && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#dcfce7',
              color: '#166534',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              ✅ Completed
            </div>
          )}
          
          {progressPercentage > 0 && progressPercentage < 100 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#dbeafe',
              color: '#1e40af',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              🔄 In Progress
            </div>
          )}
        </div>
      </div>

      {/* Detailed View */}
      {showDetailed && progress?.completion_date && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#475569'
        }}>
          <div><strong>Completion Date:</strong> {new Date(progress.completion_date).toLocaleString()}</div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedProgressDisplay;
