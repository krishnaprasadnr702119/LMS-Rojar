// Utility functions for JWT token management

export function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

export function getToken() {
  return localStorage.getItem('jwt_token');
}

export function removeToken() {
  localStorage.removeItem('jwt_token');
}

export function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    // Convert exp to milliseconds and compare with current time
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (e) {
    console.error('Error checking token expiration:', e);
    return true;
  }
}

export function getTokenPayload() {
  const token = getToken();
  return token ? parseJwt(token) : null;
}

export function getUserRole() {
  const payload = getTokenPayload();
  return payload ? payload.role : null;
}
