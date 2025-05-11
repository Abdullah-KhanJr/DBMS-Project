/**
 * Authentication validation utility 
 * This file handles authentication validation consistently across all pages
 * Enhanced version with token expiration check and session validation
 */

// Function to validate user auth and redirect appropriately
function validateUserAuth(requiredUserType = null) {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const loginTime = localStorage.getItem('loginTime');
    
    // Check for missing auth data
    if (!token || !userData) {
        console.log("No auth token or user data found, redirecting to login");
        redirectToLogin('missing');
        return false;
    }
    
    try {
        // Parse user data
        const user = JSON.parse(userData);
        
        // Basic token validation
        if (!token.includes('.') || token.length < 20) {
            console.log("Invalid token format");
            redirectToLogin('invalid');
            return false;
        }
        
        // Check token expiration
        if (tokenExpiry) {
            const expiryTime = new Date(tokenExpiry).getTime();
            const currentTime = new Date().getTime();
            
            if (currentTime >= expiryTime) {
                console.log("Token expired");
                redirectToLogin('expired');
                return false;
            }
        }
        
        // Check if session is too old (fallback if no explicit expiry)
        if (loginTime) {
            const loginDateTime = new Date(loginTime).getTime();
            const currentTime = new Date().getTime();
            const maxSessionAge = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
            
            if (currentTime - loginDateTime > maxSessionAge) {
                console.log("Session too old");
                redirectToLogin('expired');
                return false;
            }
        }
        
        // If a specific user type is required, check it
        // Try both user.role and user.user_type for compatibility
        const userRole = user.role || user.user_type;
        
        if (requiredUserType && userRole !== requiredUserType) {
            console.log(`User is not ${requiredUserType}, redirecting to appropriate dashboard`);
            redirectToUserDashboard(userRole);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error validating user auth:", error);
        redirectToLogin('error');
        return false;
    }
}

// Helper function to redirect to login with reason
function redirectToLogin(reason = 'expired') {
    // Clear all client-side auth data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Call server-side logout
    fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(err => {
        console.warn('Server logout call failed during redirect:', err);
    }).finally(() => {
        // Force redirect with cache-busting timestamp
        const timestamp = new Date().getTime();
        window.location.replace(`/pages/login.html?${reason}=${timestamp}`);
    });
}

// Helper function to redirect to appropriate dashboard
function redirectToUserDashboard(userType) {
    const timestamp = new Date().getTime();
    let dashboardUrl;
    
    // Map user types to dashboard URLs
    switch(userType) {
        case 'faculty':
            dashboardUrl = `/pages/faculty/dashboard.html?t=${timestamp}`;
            break;
        case 'student':
            dashboardUrl = `/pages/student/dashboard.html?t=${timestamp}`;
            break;
        case 'admin':
            dashboardUrl = `/pages/admin/dashboard.html?t=${timestamp}`;
            break;
        default:
            // Default to faculty dashboard
            dashboardUrl = `/pages/faculty/dashboard.html?t=${timestamp}`;
    }
    
    window.location.replace(dashboardUrl);
}

// Set up auto token refresh mechanism to avoid session expiration
function setupTokenRefresh() {
    // Check token expiry date
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!tokenExpiry) {
        console.warn('No token expiry information found. Cannot set up refresh.');
        return;
    }
    
    const expiryTime = new Date(tokenExpiry).getTime();
    const currentTime = new Date().getTime();
    
    // Calculate time until expiration (in milliseconds)
    const timeUntilExpiry = expiryTime - currentTime;
    
    // If token expires in less than 6 hours, refresh now
    if (timeUntilExpiry < 6 * 60 * 60 * 1000 && timeUntilExpiry > 0) {
        // Refresh token in 5 seconds (give page time to load)
        setTimeout(refreshToken, 5000);
    } 
    // Otherwise, schedule refresh at halfway point to expiration
    else if (timeUntilExpiry > 0) {
        const halfwayTime = timeUntilExpiry / 2;
        console.log(`Scheduling token refresh in ${Math.floor(halfwayTime / 60000)} minutes`);
        setTimeout(refreshToken, halfwayTime);
    }
}

// Function to refresh the authentication token
async function refreshToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No token found for refresh');
        return;
    }
    
    try {
        // Call token refresh endpoint
        const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include' // Include cookies
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Update token and expiry
            if (result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('tokenExpiry', result.tokenExpiry);
                console.log('Token refreshed successfully');
                
                // Set up the next refresh
                setupTokenRefresh();
            }
        } else {
            console.warn('Token refresh failed. Will try again later.');
            // Schedule another attempt in 30 minutes
            setTimeout(refreshToken, 30 * 60 * 1000);
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        // Schedule retry
        setTimeout(refreshToken, 15 * 60 * 1000);
    }
}

// Initialize token refresh mechanism on page load if it's included in a page
document.addEventListener('DOMContentLoaded', function() {
    // Setup token refresh if we have valid auth
    if (validateUserAuth()) {
        setupTokenRefresh();
    }
});

// Helper function to redirect to appropriate dashboard
function redirectToUserDashboard(userType) {
    const timestamp = new Date().getTime();
    
    if (userType === 'faculty') {
        window.location.replace(`/pages/faculty/dashboard.html?t=${timestamp}`);
    } else if (userType === 'student') {
        window.location.replace(`/pages/student/dashboard.html?t=${timestamp}`);
    } else if (userType === 'admin') {
        window.location.replace(`/pages/admin/dashboard.html?t=${timestamp}`);
    } else {
        // Default to login if userType is unknown
        redirectToLogin();
    }
}
