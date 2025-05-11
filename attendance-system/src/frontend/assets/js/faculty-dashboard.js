document.addEventListener('DOMContentLoaded', function() {
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
    const facultyName = document.getElementById('faculty-name');
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
    
    // Set faculty name (replace with actual user data retrieval)
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
            if (facultyName) facultyName.textContent = userData.name;
            if (welcomeName) welcomeName.textContent = userData.name;
        } else {
            // Use mock data if we don't have user data
            if (facultyName) facultyName.textContent = "Dr. Smith";
            if (welcomeName) welcomeName.textContent = "Dr. Smith";
        }
    } catch (error) {
        console.error('Error retrieving user data:', error);
        if (facultyName) facultyName.textContent = "Faculty Member";
        if (welcomeName) welcomeName.textContent = "Faculty Member";
    }
    
    // Load dashboard data
    loadDashboardStats();
    loadFacultyCourses();
});

// Load dashboard statistics
function loadDashboardStats() {
    // These would normally come from an API call to your backend
    // For now, using mock data
    const mockStats = {
        courseCount: 4,
        studentCount: 120,
        sessionCount: 24
    };
    
    const courseCount = document.getElementById('course-count');
    const studentCount = document.getElementById('student-count');
    const sessionCount = document.getElementById('session-count');
    
    if (courseCount) courseCount.textContent = mockStats.courseCount;
    if (studentCount) studentCount.textContent = mockStats.studentCount;
    if (sessionCount) sessionCount.textContent = mockStats.sessionCount;
}

// Load faculty courses
function loadFacultyCourses() {
    const courseListElement = document.getElementById('faculty-course-list');
    if (!courseListElement) return;
    
    // Mock course data (replace with actual API call)
    const courses = [
        {
            id: "CS101",
            name: "Introduction to Programming",
            students: 35,
            schedule: "Mon, Wed 10:00 AM",
            attendanceRate: 92
        },
        {
            id: "CS232",
            name: "Database Management Systems",
            students: 28,
            schedule: "Tue, Thu 1:00 PM",
            attendanceRate: 88
        },
        {
            id: "MATH205",
            name: "Discrete Mathematics",
            students: 32,
            schedule: "Mon, Wed, Fri 9:00 AM",
            attendanceRate: 76
        },
        {
            id: "CS360",
            name: "Software Engineering",
            students: 25,
            schedule: "Thu 3:00 PM",
            attendanceRate: 94
        }
    ];
    
    let coursesHTML = '';
    
    if (courses.length === 0) {
        coursesHTML = '<div class="empty-state"><p>You are not teaching any courses.</p></div>';
    } else {
        courses.forEach(course => {
            // Determine color based on attendance rate
            let statusColor = course.attendanceRate >= 90 ? 'var(--success-color)' : 
                            course.attendanceRate >= 80 ? 'var(--warning-color)' : 
                            'var(--danger-color)';
            
            coursesHTML += `
                <div class="course-card">
                    <div class="course-header">
                        <h3>${course.name}</h3>
                        <span class="course-code">${course.id}</span>
                    </div>
                    <div class="course-info">
                        <p><i class="fas fa-users"></i> ${course.students} Students</p>
                        <p><i class="fas fa-clock"></i> ${course.schedule}</p>
                    </div>
                    <div class="course-attendance">
                        <div class="attendance-bar">
                            <div class="attendance-progress" style="width: ${course.attendanceRate}%; background-color: ${statusColor};"></div>
                        </div>
                        <span>${course.attendanceRate}% Average Attendance</span>
                    </div>
                    <div class="course-actions">
                        <a href="generate-qr.html?id=${course.id}" class="btn-small">Generate QR</a>
                        <a href="course-details.html?id=${course.id}" class="btn-small" style="margin-left: 5px;">View Details</a>
                    </div>
                </div>
            `;
        });
    }
    
    courseListElement.innerHTML = coursesHTML;
}

