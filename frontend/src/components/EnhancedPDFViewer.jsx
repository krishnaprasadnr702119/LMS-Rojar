import React, { useState, useEffect, useRef } from 'react';

const EnhancedPDFViewer = ({ 
  url, 
  contentId, 
  username, 
  onAutoComplete,
  width = '100%',
  height = '600px' 
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewTime, setViewTime] = useState(0);
  const [isViewing, setIsViewing] = useState(false);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  
  const iframeRef = useRef(null);
  const viewStartTimeRef = useRef(null);
  const lastTrackedScrollRef = useRef(0);
  const trackingIntervalRef = useRef(null);

  useEffect(() => {
    // Start view time tracking
    if (isViewing) {
      viewStartTimeRef.current = Date.now();
      trackingIntervalRef.current = setInterval(() => {
        updateViewTime();
      }, 10000); // Track every 10 seconds
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isViewing]);

  const updateViewTime = () => {
    if (viewStartTimeRef.current) {
      const currentViewTime = (Date.now() - viewStartTimeRef.current) / 1000;
      setViewTime(currentViewTime);
      
      // Track PDF progress every minute
      if (currentViewTime % 60 < 10) { // Roughly every minute
        trackPDFProgress(scrollProgress, currentViewTime);
      }
    }
  };

  const handleIframeLoad = () => {
    setPdfLoaded(true);
    setIsViewing(true);
    
    // Try to track scroll within PDF iframe (limited by CORS)
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.addEventListener('scroll', handlePDFScroll);
      }
    } catch (error) {
      console.log('Cannot track PDF scroll directly due to CORS, using time-based tracking');
    }
  };

  const handlePDFScroll = (event) => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
        const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        const clientHeight = doc.documentElement.clientHeight || doc.body.clientHeight;
        
        const progress = ((scrollTop + clientHeight) / scrollHeight) * 100;
        setScrollProgress(Math.min(progress, 100));
        
        // Track significant scroll changes
        const scrollDifference = Math.abs(progress - lastTrackedScrollRef.current);
        if (scrollDifference >= 10) {
          trackPDFProgress(progress, viewTime);
          lastTrackedScrollRef.current = progress;
        }
      }
    } catch (error) {
      // Fallback to time-based tracking if scroll tracking fails
      console.log('Using time-based PDF tracking');
    }
  };

  const trackPDFProgress = async (scrollPercentage, timeViewed) => {
    if (!username || !contentId) return;

    try {
      const response = await fetch('/api/employee/track_pdf_progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          content_id: contentId,
          scroll_percentage: scrollPercentage,
          time_viewed: timeViewed
        })
      });

      const data = await response.json();
      
      if (data.success && data.should_complete && !autoCompleted) {
        handleAutoComplete(scrollPercentage, timeViewed);
      }
    } catch (error) {
      console.error('Error tracking PDF progress:', error);
    }
  };

  const handleAutoComplete = async (scrollPercentage, timeViewed) => {
    setAutoCompleted(true);
    
    // Show completion notification
    if (onAutoComplete) {
      onAutoComplete({
        type: 'pdf',
        contentId,
        scrollProgress: scrollPercentage,
        viewTime: timeViewed
      });
    }

    // Show visual feedback
    showCompletionNotification();
  };

  const showCompletionNotification = () => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
      ">
        📄 PDF completed automatically!
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
          Module progress updated
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }
    }, 4000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#f9fafb'
      }}>
        <iframe
          ref={iframeRef}
          src={url}
          width={width}
          height={height}
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
          title="PDF Viewer"
        />
      </div>
      
      {/* Progress tracking display */}
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⏱️ View Time:</span>
            <span style={{ fontWeight: '600' }}>{formatTime(viewTime)}</span>
          </div>
          
          {scrollProgress > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📄 Scroll:</span>
              <span style={{ fontWeight: '600' }}>{Math.round(scrollProgress)}%</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pdfLoaded && (
            <div style={{
              width: '100px',
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.max(scrollProgress, (viewTime / 300) * 100)}%`, // 5 minutes = 100%
                height: '100%',
                background: autoCompleted ? '#8b5cf6' : '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
          
          {autoCompleted && (
            <span style={{ color: '#8b5cf6', fontWeight: '600' }}>
              ✅ Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
