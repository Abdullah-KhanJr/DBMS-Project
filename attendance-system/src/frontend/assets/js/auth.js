document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth script loaded");
    
    const loginForm = document.getElementById('loginForm');
    
    // Handle login form submission
    if (loginForm) {
        console.log("Login form found");
        
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Get form field values
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            try {
                console.log('Attempting login with:', email);
                
                // Send login request to API
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Login failed');
                }
                
                // Store token and user data in localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                
                console.log('Login successful, redirecting...');
                
                // Redirect based on user role
                if (result.user.user_type === 'faculty') {
                    window.location.href = '/pages/faculty/dashboard.html';
                } else if (result.user.user_type === 'student') {
                    window.location.href = '/pages/student/dashboard.html';
                } else if (result.user.user_type === 'admin') {
                    window.location.href = '/pages/admin/dashboard.html';
                } else {
                    // Default redirect
                    window.location.href = '/pages/faculty/dashboard.html';
                }
                
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: ' + error.message);
            }
        });
    }
});