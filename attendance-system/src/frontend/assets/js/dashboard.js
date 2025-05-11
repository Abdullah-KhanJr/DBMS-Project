document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in (add your authentication check here)
    // For demo purposes, we're assuming the user is logged in
    
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
        // Add your logout logic here (clear tokens, etc)
        localStorage.removeItem('token');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Set student name (replace with your actual user data retrieval)
    // For demo purposes, using a hardcoded name
    const mockUserData = {
        username: "John Smith",
        id: "12345",
        role: "student"
    };
    
    if (studentName) studentName.textContent = mockUserData.username;
    if (welcomeName) welcomeName.textContent = mockUserData.username;
    
    // Load courses
    loadCourses();
});

function loadCourses() {
    const courseList = document.getElementById('course-list');
    if (!courseList) return;
    
    // Mock courses data (replace with actual API call)
    const courses = [
        {
            id: "CS101",
            name: "Introduction to Programming",
            instructor: "Dr. Jane Wilson",
            schedule: "Mon, Wed 10:00 AM",
            attendanceRate: 95
        },
        {
            id: "CS232",
            name: "Database Management Systems",
            instructor: "Prof. Robert Lee",
            schedule: "Tue, Thu 1:00 PM",
            attendanceRate: 88
        },
        {
            id: "MATH205",
            name: "Linear Algebra",
            instructor: "Dr. Emily Chen",
            schedule: "Mon, Wed, Fri 9:00 AM",
            attendanceRate: 76
        },
        {
            id: "ENG101",
            name: "Technical Communication",
            instructor: "Prof. Sarah Brown",
            schedule: "Thu 3:00 PM",
            attendanceRate: 92
        }
    ];
    
    // Update dashboard stats
    updateStats(courses);
    
    // Generate course cards
    let coursesHTML = '';
    
    if (courses.length === 0) {
        coursesHTML = '<div class="empty-state"><p>You are not enrolled in any courses.</p></div>';
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
                        <p><i class="fas fa-chalkboard-teacher"></i> ${course.instructor}</p>
                        <p><i class="fas fa-clock"></i> ${course.schedule}</p>
                    </div>
                    <div class="course-attendance">
                        <div class="attendance-bar">
                            <div class="attendance-progress" style="width: ${course.attendanceRate}%; background-color: ${statusColor};"></div>
                        </div>
                        <span>${course.attendanceRate}% Attendance</span>
                    </div>
                    <div class="course-actions">
                        <a href="course-details.html?id=${course.id}" class="btn-small">View Details</a>
                    </div>
                </div>
            `;
        });
    }
    
    courseList.innerHTML = coursesHTML;
}

function updateStats(courses) {
    const courseCount = document.getElementById('course-count');
    const attendanceRate = document.getElementById('attendance-rate');
    const absentCount = document.getElementById('absent-count');
    
    if (courseCount) courseCount.textContent = courses.length;
    
    // Calculate average attendance
    if (attendanceRate && courses.length > 0) {
        const totalAttendance = courses.reduce((sum, course) => sum + course.attendanceRate, 0);
        const avgAttendance = Math.round(totalAttendance / courses.length);
        attendanceRate.textContent = avgAttendance + '%';
    }
    
    // Calculate total absences (estimating 15 classes per course)
    if (absentCount && courses.length > 0) {
        const totalClasses = courses.length * 15; // Assuming 15 classes per course
        const totalAttendance = courses.reduce((sum, course) => sum + course.attendanceRate, 0) / 100;
        const avgAttendance = totalAttendance / courses.length;
        const absences = Math.round(totalClasses * (1 - avgAttendance));
        absentCount.textContent = absences;
    }
}