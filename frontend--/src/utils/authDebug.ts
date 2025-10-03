// Debug utility for authentication issues
export const debugAuth = () => {
  const token = sessionStorage.getItem('auth_token');
  const user = sessionStorage.getItem('auth_current_user');
  
  console.log('=== AUTH DEBUG ===');
  console.log('Token present:', !!token);
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('User present:', !!user);
  console.log('User value:', user ? JSON.parse(user) : 'null');
  console.log('==================');
  
  return {
    hasToken: !!token,
    hasUser: !!user,
    token: token,
    user: user ? JSON.parse(user) : null
  };
};

// Test notification API with current token
export const testNotificationAPI = async () => {
  const token = sessionStorage.getItem('auth_token');
  
  if (!token) {
    console.error('No token found for notification API test');
    return;
  }
  
  try {
    const response = await fetch('http://127.0.0.1:8000/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Notification API test response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Notification API test data:', data);
    } else {
      const error = await response.text();
      console.error('Notification API test error:', error);
    }
  } catch (error) {
    console.error('Notification API test failed:', error);
  }
};

