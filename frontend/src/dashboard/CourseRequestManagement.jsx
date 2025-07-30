import React, { useState, useEffect } from 'react';

function CourseRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/course_requests?username=admin');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch course requests');
      }
    } catch (err) {
      setError('Failed to fetch course requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveReject = async (requestId, action, notes = '') => {
    setActionLoading(requestId);
    try {
      const response = await fetch('/api/admin/approve_course_request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          action: action,
          admin_username: 'admin', // Changed from 'superadmin' to 'admin'
          admin_notes: notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Course request ${action}d successfully!`);
        await fetchRequests(); // Refresh the list
        setSelectedRequest(null);
        setAdminNotes('');
      } else {
        alert(`❌ Failed to ${action} request: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Network error while ${action}ing request`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: '#fef3c7', color: '#d97706', icon: '⏳' },
      approved: { bg: '#dcfce7', color: '#166534', icon: '✅' },
      rejected: { bg: '#fecaca', color: '#dc2626', icon: '❌' }
    };
    
    const style = statusStyles[status] || statusStyles.pending;
    
    return (
      <div style={{
        background: style.bg,
        color: style.color,
        padding: '6px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {style.icon} {status.toUpperCase()}
      </div>
    );
  };

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
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
        Loading course requests...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ 
      background: '#fef2f2', 
      border: '1px solid #fecaca', 
      borderRadius: '8px', 
      padding: '16px', 
      color: '#dc2626',
      fontSize: '16px',
      fontWeight: '500'
    }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            💳 Course Purchase Requests
          </h2>
          <p style={{ color: '#6b7280', margin: '0' }}>
            Review and approve course purchase requests from organizations
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            background: '#fef3c7',
            color: '#d97706',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            ⏳ {requests.filter(r => r.status === 'pending').length} Pending
          </div>
          <div style={{
            background: '#f3f4f6',
            color: '#6b7280',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            📊 {requests.length} Total Requests
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280',
          fontSize: '18px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          📝 No course requests yet
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 150px 120px 100px 200px', gap: '16px', padding: '16px 24px', background: '#f8fafc', fontWeight: '600', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
            <div>Organization & Course</div>
            <div>Requester</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          
          {requests.map((request) => (
            <div key={request.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 200px 150px 120px 100px 200px', 
              gap: '16px', 
              padding: '20px 24px', 
              borderBottom: '1px solid #e5e7eb',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  🏢 {request.organization.name}
                </div>
                <div style={{ color: '#6b7280' }}>
                  📚 {request.course.title}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: '500', color: '#374151' }}>
                  {request.requester.username}
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  {request.requester.email}
                </div>
              </div>
              
              <div style={{ fontWeight: '700', color: '#059669' }}>
                ${request.payment_amount}
              </div>
              
              <div>
                {getStatusBadge(request.status)}
              </div>
              
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {new Date(request.requested_at).toLocaleDateString()}
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {request.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApproveReject(request.id, 'approve')}
                      disabled={actionLoading === request.id}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: actionLoading === request.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {actionLoading === request.id ? '⏳' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleApproveReject(request.id, 'reject')}
                      disabled={actionLoading === request.id}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: actionLoading === request.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {actionLoading === request.id ? '⏳' : '❌ Reject'}
                    </button>
                  </>
                ) : (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div>By: {request.approved_by}</div>
                    <div>{new Date(request.approved_at).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: '#f0f9ff', 
        border: '1px solid #bae6fd', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#0c4a6e'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>ℹ️ How Course Requests Work:</div>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Portal admins request to purchase courses with payment</li>
          <li>You can approve requests to assign courses to organizations</li>
          <li>You can also directly assign courses via the Organizations panel without payment</li>
          <li>Approved courses are automatically assigned to the requesting organization</li>
        </ul>
      </div>
    </div>
  );
}

export default CourseRequestManagement;
