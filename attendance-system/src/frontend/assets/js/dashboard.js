document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '../login.html';
        return;
    }

    // Get DOM elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const profileIcon = document.querySelector('.profile-icon');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    const studentName = document.getElementById('student-name');
    const welcomeName = document.getElementById('welcome-name');
    
    // Toggle sidebar on mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle profile dropdown
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
    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Get student data from local storage or API
    try {
        // First try to get from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (userData && userData.name) {
            // If user data exists in localStorage
            if (studentName) studentName.textContent = userData.name;
            if (welcomeName) welcomeName.textContent = userData.name;
        } else {
            // If not in localStorage, fetch from API
            try {
                const response = await fetch('http://localhost:5000/api/student/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch student data');
                }
                
                const userData = await response.json();
                
                if (userData && userData.name) {
                    if (studentName) studentName.textContent = userData.name;
                    if (welcomeName) welcomeName.textContent = userData.name;
                    
                    // Save to localStorage for future use
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    throw new Error('Invalid user data received');
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
                // Redirect to login if we can't get the user data
                localStorage.removeItem('token');
                window.location.href = '../login.html';
                return;
            }
        }
    } catch (error) {
        console.error('Error processing user data:', error);
    }
    
    // Load courses
    loadCourses();
});

function loadCourses() {
    // Existing code remains the same
    // ...
}

function updateStats(courses) {
    // Existing code remains the same
    // ...
}