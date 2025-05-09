document.addEventListener('DOMContentLoaded', function() {
    // 1. First, add the authentication check
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!token || !userData) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verify the user is on the correct dashboard
    const currentPage = window.location.pathname.split('/').pop();
    const requiredType = currentPage.split('-')[0]; // "student", "faculty", or "admin"
    
    if (userData.user_type !== requiredType) {
        window.location.href = 'login.html';
        return;
    }
    
    // For all API calls, include the token in headers
    window.authFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
            return;
        }
        
        return response;
    };
    const courses = [
        {
            code: 'CS101',
            name: 'Introduction to Programming',
            instructor: 'Prof. Ali Khan',
            section: 'A',
            attendance: 92
        },
        {
            code: 'MTH101',
            name: 'Calculus I',
            instructor: 'Dr. Sara Ahmed',
            section: 'B',
            attendance: 85
        },
        {
            code: 'PHY101',
            name: 'Applied Physics',
            instructor: 'Dr. Usman Malik',
            section: 'C',
            attendance: 78
        }
    ];

    // View Details button functionality
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Showing course details...');
            // Course details logic would go here
        });
    });

    // Menu item click functionality
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.menu-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Load the appropriate content
            const menuText = this.querySelector('span').textContent;
            if (menuText === 'Mark Attendance') {
                alert('Opening QR scanner to mark attendance...');
            } else if (menuText === 'Attendance Record') {
                alert('Loading attendance records...');
            } else if (menuText === 'Drop Course') {
                alert('Opening course drop interface...');
            }
            // Courses view is default and requires no action
        });
    });

    // In a real application, you would fetch this data from your backend:
    /*
    fetch('/api/student-courses')
        .then(response => response.json())
        .then(data => {
            // Update dashboard with real course data
        });
    */
});