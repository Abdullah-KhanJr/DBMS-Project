// Common logout functionality script
document.addEventListener('DOMContentLoaded', function() {
    console.log("Logout script loaded");    // Handle logout function
    function handleLogout(e) {
        e.preventDefault(); // Prevent default navigation
        console.log("Logout triggered");
        
        // Log current authentication state
        console.log("Current auth state - localStorage token:", !!localStorage.getItem('token'));
        console.log("Current auth state - userData:", localStorage.getItem('userData'));
        
        // Clear all authentication data
        localStorage.clear(); // Clear all localStorage items
        sessionStorage.clear(); // Clear all sessionStorage items
        
        // Explicitly remove specific authentication items
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userData');
        
        // Clear any cookies related to authentication
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log("Authentication data cleared, redirecting to login page");
        console.log("Post-logout auth state - localStorage token:", !!localStorage.getItem('token'));
          // Call the server-side logout endpoint to ensure proper cleanup
        try {
            // Attempt to call the server-side logout endpoint
            fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                }
            })
            .then(() => {
                console.log("Server-side logout completed");
            })
            .catch(err => {
                console.log("Server-side logout failed, continuing with client-side logout:", err);
            })
            .finally(() => {
                // Force a clean logout by using a full page reload with cache clearing
                if (window.location.pathname.includes('/login.html')) {
                    // If already on login page, just reload
                    window.location.reload(true);
                } else {
                    // Otherwise, redirect to login page with cache busting parameter
                    window.location.href = '/pages/login.html?logout=' + new Date().getTime();
                }
            });
        } catch (error) {
            console.error("Error during logout:", error);
            // Fall back to client-side logout if server call fails
            window.location.href = '/pages/login.html?logout=' + new Date().getTime();
        }
    }
    
    // Find and attach listeners to all possible logout elements
    const logoutElements = [
        document.getElementById('logout-btn'),
        document.getElementById('logout-link'),
        ...document.querySelectorAll('.logout-trigger'),
        ...document.querySelectorAll('[id$="-logout"]'),
        ...document.querySelectorAll('[id^="logout"]'),
        ...document.querySelectorAll('a[href="../login.html"]')
    ];
    
    // Filter out null elements and attach event listeners
    logoutElements
        .filter(el => el !== null)
        .forEach(el => {
            console.log("Attaching logout event to:", el);
            el.addEventListener('click', handleLogout);
        });
    
    // Also handle any navigation to login.html to ensure proper logout
    document.addEventListener('click', function(e) {
        // If clicking on a link to the login page
        if (e.target.tagName === 'A' && 
            (e.target.href.includes('login.html') || e.target.href.includes('/login'))) {
            handleLogout(e);
        }
    });
});
