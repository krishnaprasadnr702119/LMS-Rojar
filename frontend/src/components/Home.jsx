import { useState } from 'react';
import './Home.css';
import HelloMessage from './HelloMessage';

function Home() {
  const [showApiMessage, setShowApiMessage] = useState(false);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Learning Management System</h1>
        <p>A full-stack application with Flask backend and React frontend</p>
        
        <button 
          className="demo-button"
          onClick={() => setShowApiMessage(!showApiMessage)}
        >
          {showApiMessage ? 'Hide API Message' : 'Show API Message'}
        </button>
      </div>

      {showApiMessage && <HelloMessage />}
      
      <div className="tech-stack">
        <div className="tech-item">
          <h3>Backend</h3>
          <ul>
            <li>Python</li>
            <li>Flask</li>
            <li>REST API</li>
          </ul>
        </div>
        
        <div className="tech-item">
          <h3>Frontend</h3>
          <ul>
            <li>React</li>
            <li>Vite</li>
            <li>CSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;
