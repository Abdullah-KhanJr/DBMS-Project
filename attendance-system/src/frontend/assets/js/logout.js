
/**
 * Common logout functionality for the attendance system
 * Handles both the logout button in the sidebar and the logout link in the dropdown menu
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get logout elements
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    
    // Attach event handlers to logout elements
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
    
    /**
     * Handle logout action
     * Clears authentication data and redirects to login page
     */
    function handleLogout(e) {
        e.preventDefault();
        
        // Clear user data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Redirect to login page
        window.location.href = '../login.html';
    }
});
