document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Log data for debugging
        console.log('Login successful');
        console.log('Token:', data.token);
        console.log('User data:', data.user);
        
        // Redirect based on user type
        if (data.user.user_type === 'faculty') {
          window.location.href = '/faculty/dashboard.html';
        } else if (data.user.user_type === 'student') {
          window.location.href = '/student/dashboard.html';
        } else if (data.user.user_type === 'admin') {
          window.location.href = '/admin/dashboard.html';
        }
      } catch (error) {
        console.error('Login error:', error);
        // Show error to user
        alert('Login failed: ' + error.message);
      }
    });
  }
});