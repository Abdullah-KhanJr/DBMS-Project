document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard loaded');
    
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle profile dropdown
    const profileIcon = document.querySelector('.profile-icon');
    if (profileIcon) {
        profileIcon.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!profileIcon.contains(event.target)) {
                profileIcon.classList.remove('active');
            }
        });
    }
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    
    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Display user information
    const adminName = document.getElementById('admin-name');
    const welcomeName = document.getElementById('welcome-name');
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
            if (adminName) adminName.textContent = userData.name;
            if (welcomeName) welcomeName.textContent = userData.name;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
    }
    
    // Load dashboard data
    populateDashboardStats();
});

function populateDashboardStats() {
    // Mock data - in a real app, this would come from your API
    document.getElementById('total-courses').textContent = '12';
}