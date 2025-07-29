import React, { useState, useEffect } from 'react';

function PurchaseRequestStatus() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const response = await fetch('/api/portal_admin/my_course_requests');
        const data = await response.json();
        
        if (data.success) {
          setRequests(data.requests);
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, []);

  if (loading || requests.length === 0) return null;

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <div style={{ 
      background: '#f8fafc', 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      padding: '20px', 
      marginBottom: '24px' 
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📋 My Course Purchase Requests
      </h3>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {pendingRequests.length > 0 && (
          <div style={{
            background: '#fef3c7',
            color: '#d97706',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⏳ {pendingRequests.length} Pending Approval
          </div>
        )}
        
        {approvedRequests.length > 0 && (
          <div style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ✅ {approvedRequests.length} Approved
          </div>
        )}
        
        {rejectedRequests.length > 0 && (
          <div style={{
            background: '#fecaca',
            color: '#dc2626',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ❌ {rejectedRequests.length} Rejected
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <details style={{ color: '#64748b' }}>
            <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              View Request Details
            </summary>
            <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
              {requests.map(request => (
                <div key={request.id} style={{
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1e293b' }}>
                      {request.course.title}
                    </div>
                    <div style={{ color: '#64748b' }}>
                      Requested: {new Date(request.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      ${request.payment_amount}
                    </div>
                    <div style={{
                      background: request.status === 'pending' ? '#fef3c7' : 
                                 request.status === 'approved' ? '#dcfce7' : '#fecaca',
                      color: request.status === 'pending' ? '#d97706' : 
                             request.status === 'approved' ? '#166534' : '#dc2626',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {request.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default PurchaseRequestStatus;
