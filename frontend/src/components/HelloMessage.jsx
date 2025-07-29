import { useState, useEffect } from 'react';
import './HelloMessage.css';

function HelloMessage() {
  const [message, setMessage] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the message from the backend API
    fetch('/api/hello')
      .then(async response => {
        if (!response.ok) {
          // Try to get error text for debugging
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching message:', error);
        setError('Failed to fetch message from backend: ' + error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="hello-message loading">Loading message...</div>;
  }

  if (error) {
    return <div className="hello-message error">{error}</div>;
  }

  return (
    <div className="hello-message success">
      <h2>Message from Backend:</h2>
      <p>{message}</p>
    </div>
  );
}

export default HelloMessage;
