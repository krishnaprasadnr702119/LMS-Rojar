import React, { useState, useEffect, useRef } from 'react';

const EnhancedVideoTracker = ({ 
  url, 
  contentId, 
  username, 
  onAutoComplete, 
  width = '100%', 
  height = '400px',
  ...props 
}) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [lastTrackedProgress, setLastTrackedProgress] = useState(0);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const videoRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  useEffect(() => {
    // Start progress tracking when component mounts
    return () => {
      // Clean up tracking interval on unmount
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  const handleProgress = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const currentTime = video.currentTime;
    const totalDuration = video.duration;
    
    if (totalDuration > 0) {
      const currentProgress = (currentTime / totalDuration) * 100;
      setProgress(currentProgress);

      // Track progress every 5% or every 30 seconds, whichever is more frequent
      const progressDifference = Math.abs(currentProgress - lastTrackedProgress);
      
      if (progressDifference >= 5 || 
          (progressDifference >= 1 && Date.now() - lastTrackedProgress > 30000)) {
        trackVideoProgress(currentTime, totalDuration, currentProgress);
        setLastTrackedProgress(currentProgress);
      }

      // Auto-complete when 90% watched
      if (currentProgress >= 90 && !autoCompleted) {
        handleAutoComplete(currentTime, totalDuration, currentProgress);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsTracking(true);
      console.log('EnhancedVideoTracker - Video metadata loaded, duration:', videoRef.current.duration);
    }
  };

  const trackVideoProgress = async (currentTime, totalDuration, progressPercentage) => {
    if (!username || !contentId) return;

    try {
      const response = await fetch('/api/employee/track_video_progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          content_id: contentId,
          current_time: currentTime,
          duration: totalDuration,
          progress_percentage: progressPercentage
        })
      });

      const data = await response.json();
      
      if (data.success && data.should_complete && !autoCompleted) {
        handleAutoComplete(currentTime, totalDuration, progressPercentage);
      }
    } catch (error) {
      console.error('Error tracking video progress:', error);
    }
  };

  const handleAutoComplete = async (currentTime, totalDuration, progressPercentage) => {
    setAutoCompleted(true);
    
    // Show completion notification
    if (onAutoComplete) {
      onAutoComplete({
        type: 'video',
        contentId,
        progress: progressPercentage,
        duration: totalDuration
      });
    }

    // Show visual feedback
    showCompletionNotification();
  };

  const showCompletionNotification = () => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        pointer-events: none;
        transform: translateZ(0);
        will-change: transform, opacity;
      ">
        ✅ Video completed automatically!
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
          Module progress updated
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from {
            transform: translateX(100%) translateZ(0);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateZ(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0) translateZ(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%) translateZ(0);
            opacity: 0;
          }
        }
      </style>
    `;
    
    // Create a container that won't affect layout
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    
    container.appendChild(notification);
    document.body.appendChild(container);
    
    // Remove notification after 4 seconds with smooth animation
    setTimeout(() => {
      if (container.parentNode) {
        const notificationElement = container.querySelector('div');
        if (notificationElement) {
          notificationElement.style.animation = 'slideOutRight 0.3s ease-out forwards';
        }
        setTimeout(() => {
          if (container.parentNode) {
            document.body.removeChild(container);
          }
        }, 300);
      }
    }, 4000);
  };

  const handleReady = () => {
    console.log('EnhancedVideoTracker - Video Ready, URL:', url);
    setIsTracking(true);
  };

  const handleError = (error) => {
    console.error('EnhancedVideoTracker - Video Error:', error);
    console.error('EnhancedVideoTracker - URL that failed:', url);
  };

  // Set up interval to track progress
  useEffect(() => {
    if (videoRef.current && isTracking) {
      const interval = setInterval(() => {
        handleProgress();
      }, 1000); // Update every second
      
      trackingIntervalRef.current = interval;
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isTracking]);

  console.log('EnhancedVideoTracker rendering with URL:', url);

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        src={url}
        width={width}
        height={height}
        controls
        crossOrigin="anonymous"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleProgress}
        onCanPlay={handleReady}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px'
        }}
        {...props}
      />
      
      {/* Progress indicator */}
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        right: '0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{
          width: '100px',
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress >= 90 ? '#10b981' : '#3b82f6',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span>{Math.round(progress)}%</span>
        {autoCompleted && (
          <span style={{ color: '#10b981', fontWeight: '600' }}>
            ✅ Completed
          </span>
        )}
      </div>
    </div>
  );
};

export default EnhancedVideoTracker;
