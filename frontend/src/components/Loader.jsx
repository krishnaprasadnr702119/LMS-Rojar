import React from 'react';

const spinnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  minHeight: 200,
};

function Loader() {
  return (
    <div style={spinnerStyle}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <circle cx="24" cy="24" r="20" stroke="#2563eb" strokeWidth="6" strokeDasharray="100" strokeDashoffset="60" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export default Loader;
