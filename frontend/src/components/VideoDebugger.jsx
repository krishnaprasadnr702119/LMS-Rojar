import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';

const VideoDebugger = ({ url, contentId, username }) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [videoElement, setVideoElement] = useState(null);

  useEffect(() => {
    // Test direct video element
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.controls = true;
    
    const handleCanPlay = () => {
      console.log('Native video element can play:', url);
      setDebugInfo(prev => ({ ...prev, nativeCanPlay: true }));
    };
    
    const handleError = (e) => {
      console.error('Native video element error:', e);
      setDebugInfo(prev => ({ ...prev, nativeError: e.type }));
    };
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    setVideoElement(video);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [url]);

  useEffect(() => {
    // ReactPlayer tests
    const canPlay = ReactPlayer.canPlay(url);
    console.log('ReactPlayer.canPlay result:', canPlay);
    setDebugInfo(prev => ({ ...prev, reactPlayerCanPlay: canPlay }));
  }, [url]);

  const testDirectFetch = async () => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1023'
        }
      });
      
      console.log('Direct fetch test:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      setDebugInfo(prev => ({ 
        ...prev, 
        fetchTest: {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          acceptRanges: response.headers.get('accept-ranges'),
          contentLength: response.headers.get('content-length')
        }
      }));
    } catch (error) {
      console.error('Direct fetch error:', error);
      setDebugInfo(prev => ({ ...prev, fetchError: error.message }));
    }
  };

  useEffect(() => {
    testDirectFetch();
  }, [url]);

  return (
    <div style={{
      background: '#f8f9fa',
      border: '2px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ color: '#495057', marginTop: 0 }}>🔍 Video Debug Information</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>URL:</strong> {url}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>ReactPlayer.canPlay():</strong> {String(debugInfo.reactPlayerCanPlay)}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Native Video Element:</strong> {debugInfo.nativeCanPlay ? '✅ Can Play' : debugInfo.nativeError ? `❌ Error: ${debugInfo.nativeError}` : '⏳ Testing...'}
      </div>
      
      {debugInfo.fetchTest && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Fetch Test:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Status: {debugInfo.fetchTest.status} {debugInfo.fetchTest.ok ? '✅' : '❌'}</li>
            <li>Content-Type: {debugInfo.fetchTest.contentType || 'Not set'}</li>
            <li>Accept-Ranges: {debugInfo.fetchTest.acceptRanges || 'Not set'}</li>
            <li>Content-Length: {debugInfo.fetchTest.contentLength || 'Not set'}</li>
          </ul>
        </div>
      )}
      
      {debugInfo.fetchError && (
        <div style={{ marginBottom: '15px', color: '#dc3545' }}>
          <strong>Fetch Error:</strong> {debugInfo.fetchError}
        </div>
      )}
      
      <div style={{ marginBottom: '15px' }}>
        <h4>Test Native HTML5 Video Element:</h4>
        {videoElement && (
          <div style={{ 
            background: '#fff', 
            padding: '10px', 
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}>
            <video
              src={url}
              controls
              width="300"
              height="200"
              crossOrigin="anonymous"
              onError={(e) => console.error('HTML5 video error:', e)}
              onCanPlay={() => console.log('HTML5 video can play')}
              onLoadStart={() => console.log('HTML5 video load start')}
              onLoadedData={() => console.log('HTML5 video loaded data')}
              onLoadedMetadata={() => console.log('HTML5 video loaded metadata')}
            />
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>Test ReactPlayer:</h4>
        <div style={{ 
          background: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <ReactPlayer
            url={url}
            width="300px"
            height="200px"
            controls={true}
            onReady={() => {
              console.log('ReactPlayer ready');
              setDebugInfo(prev => ({ ...prev, reactPlayerReady: true }));
            }}
            onError={(error) => {
              console.error('ReactPlayer error:', error);
              setDebugInfo(prev => ({ ...prev, reactPlayerError: error }));
            }}
            onLoadStart={() => console.log('ReactPlayer load start')}
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous'
                }
              }
            }}
          />
        </div>
      </div>
      
      <div>
        <h4>Debug Info Object:</h4>
        <pre style={{ 
          background: '#e9ecef', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default VideoDebugger;
