import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Helper functions for media handling
const MediaDebugger = {
  fixMediaUrl: (url) => {
    // Ensure URL starts with http://localhost:5000 if it's a relative path
    if (url && !url.startsWith('http') && !url.startsWith('//')) {
      // Handle different patterns of URL
      if (url.startsWith('/uploads/')) {
        return `http://localhost:5000${url}`;
      } else if (url.startsWith('uploads/')) {
        return `http://localhost:5000/${url}`;
      } else {
        return `http://localhost:5000/uploads/${url}`;
      }
    }
    return url;
  },
  
  // Log media loading errors with details
  logMediaError: (type, element, error) => {
    console.error(`${type} error:`, error);
    if (element) {
      console.log(`${type} element:`, {
        src: element.src,
        error: element.error ? element.error.code : 'unknown',
        networkState: element.networkState,
        readyState: element.readyState
      });
    }
  },
  
  // Create a debug overlay for media elements
  debugOverlay: (mediaInfo) => {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px',
        fontSize: '10px',
        zIndex: 10,
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        <div>URL: {mediaInfo.url}</div>
        <div>Status: {mediaInfo.status}</div>
        {mediaInfo.details && Object.entries(mediaInfo.details).map(([key, value]) => (
          <div key={key}>{key}: {String(value)}</div>
        ))}
      </div>
    );
  }
};

// Enhanced video player component with multiple fallbacks
const EnhancedVideoPlayer = ({ src, title, onError }) => {
  const [videoState, setVideoState] = useState({
    mainPlayerFailed: false,
    fallbackPlayerFailed: false,
    directLinkNeeded: false,
    error: null
  });
  
  const videoRef = useRef(null);
  const fixedSrc = MediaDebugger.fixMediaUrl(src);
  
  const handleVideoError = (e) => {
    MediaDebugger.logMediaError('Video', e.target, e);
    setVideoState(prev => ({ ...prev, mainPlayerFailed: true }));
    if (onError) onError(e);
  };
  
  const handleFallbackError = (e) => {
    MediaDebugger.logMediaError('Fallback video', e.target, e);
    setVideoState(prev => ({ ...prev, fallbackPlayerFailed: true, directLinkNeeded: true }));
  };
  
  return (
    <div style={{ 
      position: 'relative', 
      paddingTop: '56.25%', 
      background: '#000',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Debug overlay - hidden by default */}
      {false && MediaDebugger.debugOverlay({ 
        url: fixedSrc,
        status: videoState.directLinkNeeded ? 'Showing direct link' : 
                videoState.mainPlayerFailed ? 'Using fallback player' : 'Main player',
        details: { 
          mainFailed: videoState.mainPlayerFailed,
          fallbackFailed: videoState.fallbackPlayerFailed
        }
      })}
      
      {/* Main Video Player */}
      {!videoState.mainPlayerFailed && (
        <video
          ref={videoRef}
          src={fixedSrc}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            objectFit: 'contain'
          }}
          controls
          playsInline
          onError={handleVideoError}
        >
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Fallback Video Player */}
      {videoState.mainPlayerFailed && !videoState.fallbackPlayerFailed && (
        <video
          src={fixedSrc}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            objectFit: 'contain'
          }}
          controls
          playsInline
          onError={handleFallbackError}
        >
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Direct Link Fallback */}
      {videoState.directLinkNeeded && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 5,
          maxWidth: '80%'
        }}>
          <p style={{ color: 'white', marginBottom: '15px' }}>
            Unable to play the video in browser. Try downloading it:
          </p>
          <a 
            href={fixedSrc}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 15px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Download {title || 'Video'}
          </a>
        </div>
      )}
    </div>
  );
};

// Enhanced PDF viewer with fallback
const EnhancedPdfViewer = ({ src, title, onError }) => {
  const [pdfState, setPdfState] = useState({
    iframeError: false,
    error: null
  });
  
  const fixedSrc = MediaDebugger.fixMediaUrl(src);
  
  const handlePdfError = (e) => {
    MediaDebugger.logMediaError('PDF iframe', null, e);
    setPdfState({ iframeError: true, error: e });
    if (onError) onError(e);
  };
  
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '600px', 
      maxHeight: '80vh',
      margin: '0 auto',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {/* Debug overlay - hidden by default */}
      {false && MediaDebugger.debugOverlay({ 
        url: fixedSrc,
        status: pdfState.iframeError ? 'Showing direct link' : 'PDF iframe',
        details: { error: pdfState.error ? String(pdfState.error) : null }
      })}
      
      {!pdfState.iframeError ? (
        <iframe 
          src={fixedSrc}
          style={{ 
            width: '100%', 
            height: '600px', 
            maxHeight: '80vh',
            border: 'none',
            background: '#fff'
          }}
          title={title || "PDF Document"}
          onError={handlePdfError}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '600px',
          padding: '20px',
          textAlign: 'center',
          background: '#f8f9fa'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Unable to display the PDF in browser. Try downloading it:
          </p>
          <a 
            href={fixedSrc}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 15px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Download {title || 'PDF'}
          </a>
        </div>
      )}
    </div>
  );
};

export { EnhancedVideoPlayer, EnhancedPdfViewer, MediaDebugger };
