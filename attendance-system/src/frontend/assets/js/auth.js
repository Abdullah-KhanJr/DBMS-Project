document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth script loaded");
    
    // Function to clear all authentication data
    function clearAllAuthData() {
        console.log('Clearing all authentication data');
        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies (both regular and HTTP-only)
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Also call server logout endpoint to invalidate server-side session
        fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            credentials: 'include' // Include cookies
        }).catch(err => {
            console.warn('Server logout call failed, but continuing client-side logout:', err);
        });
    }
    
    // Handle logout parameter or expired session in URL
    if (window.location.search.includes('logout=') || window.location.search.includes('expired=')) {
        console.log('Logout/expired parameter detected in URL');
        clearAllAuthData();
        
        // Show appropriate message
        if (window.location.search.includes('expired=')) {
            const messageElement = document.getElementById('loginMessage');
            if (messageElement) {
                messageElement.innerHTML = 'Your session has expired. Please log in again.';
                messageElement.style.display = 'block';
                messageElement.classList.add('alert', 'alert-warning');
            }
        } else {
            const messageElement = document.getElementById('loginMessage');
            if (messageElement) {
                messageElement.innerHTML = 'You have been successfully logged out.';
                messageElement.style.display = 'block';
                messageElement.classList.add('alert', 'alert-success');
            }
        }
        
        // Remove the parameter from URL
        const cleanUrl = window.location.protocol + "//" + 
                        window.location.host + 
                        window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        console.log('Authentication data cleared, showing login form');
        return; // Skip the auto-redirect check
    }
    
    // Check if token exists and validate additional security measures
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    // Check if token expired
    if (tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = new Date().getTime();
        
        if (currentTime > expiryTime) {
            console.log('Token expired, clearing auth data');
            clearAllAuthData();
            // Redirect to login with expired query parameter
            window.location.replace('/pages/login.html?expired=true');
            return;
        }
    }
    
    // Validate token exists and isn't invalid
    if (token && userData) {
        console.log('Token found, validating it...');
        
        try {
            // Parse the user data
            const user = JSON.parse(userData);
            const role = user.role || 'faculty'; // Use .role property
            
            // Basic validation of token format
            if (!token.includes('.') || token.length < 20) {
                throw new Error('Token appears invalid');
            }
            
            console.log(`Token seems valid. Redirecting to ${role} dashboard`);
            
            // Add timestamp for fresh page load
            const timestamp = new Date().getTime();
            
            // Redirect based on user role
            if (role === 'faculty') {
                window.location.replace(`/pages/faculty/dashboard.html?t=${timestamp}`);
            } else if (role === 'student') {
                window.location.replace(`/pages/student/dashboard.html?t=${timestamp}`);
            } else if (role === 'admin') {
                window.location.replace(`/pages/admin/dashboard.html?t=${timestamp}`);
            } else {
                // Default redirect
                window.location.replace(`/pages/faculty/dashboard.html?t=${timestamp}`);
            }
            
            return; // Stop execution if redirected
        } catch (error) {
            console.error('Error with user auth data:', error);
            clearAllAuthData();
            window.location.replace('/pages/login.html?expired=true');
            return;
        }
    } else {
        console.log('No authentication token found, showing login form');
    }
    
    // Show login messages if they exist in the page
    const loginMessage = document.getElementById('loginMessage');
    
    // Find and attach event handlers to the login form
    const loginForm = document.getElementById('loginForm');
    
    // Handle login form submission
    if (loginForm) {
        console.log("Login form found");
        
        // Add loading state to form
        const addLoadingState = () => {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            }
        };
        
        // Remove loading state
        const removeLoadingState = () => {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login';
            }
        };
        
        // Display error message
        const showErrorMessage = (message) => {
            if (loginMessage) {
                loginMessage.innerHTML = message;
                loginMessage.style.display = 'block';
                loginMessage.className = 'alert alert-danger';
            } else {
                alert(message);
            }
        };
        
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Add loading state
            addLoadingState();
            
            // Get form field values
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            try {
                console.log('Attempting login with:', email);
                
                // Send login request to API with credentials option to allow cookies
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    credentials: 'include', // Include cookies in request
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Login failed');
                }
                
                console.log('Login successful, setting up auth state');
                
                // Clear any previous client-side auth data first
                localStorage.clear();
                sessionStorage.clear();
                
                // Store auth data in localStorage 
                localStorage.setItem('token', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                localStorage.setItem('tokenExpiry', result.tokenExpiry);
                localStorage.setItem('loginTime', new Date().toISOString());
                
                console.log('Auth state set up, redirecting...');
                
                // Add timestamp to URL to prevent caching issues
                const timestamp = new Date().getTime();
                let redirectUrl = '';
                
                // Redirect based on user role
                const role = result.user.role || result.user.user_type;
                if (role === 'faculty') {
                    redirectUrl = `/pages/faculty/dashboard.html?fresh=${timestamp}`;
                } else if (role === 'student') {
                    redirectUrl = `/pages/student/dashboard.html?fresh=${timestamp}`;
                } else if (role === 'admin') {
                    redirectUrl = `/pages/admin/dashboard.html?fresh=${timestamp}`;
                } else {
                    // Default redirect
                    redirectUrl = `/pages/faculty/dashboard.html?fresh=${timestamp}`;
                }
                
                // Force a fresh page load
                window.location.replace(redirectUrl);
            } catch (error) {
                console.error('Login error:', error);
                removeLoadingState();
                showErrorMessage('Login failed: ' + (error.message || 'Please check your credentials'));
            }
        });
    }
});