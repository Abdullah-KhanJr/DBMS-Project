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
async function loadDashboardStats() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const facultyId = userData?.facultyId || userData?.faculty_id;

    let courseCount = 0;
    let studentCount = 0;
    let sessionCount = 0;

    try {
        // Fetch courses for this faculty
        const coursesRes = await fetch(`/api/faculty/courses?faculty_id=${facultyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();
        const courses = coursesData.courses || [];
        courseCount = courses.length;

        // Fetch students for each course and sum
        for (const course of courses) {
            const studentsRes = await fetch(`/api/faculty/courses/students?course_id=${course.course_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const studentsData = await studentsRes.json();
            studentCount += (studentsData.students || []).length;
        }

        // Fetch sessions for each course and sum
        for (const course of courses) {
            const sessionsRes = await fetch(`/api/faculty/attendance/records?course_id=${course.course_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sessionsData = await sessionsRes.json();
            sessionCount += (sessionsData.records || []).length;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }

    // Update the DOM
    const courseCountElem = document.getElementById('course-count');
    const studentCountElem = document.getElementById('student-count');
    const sessionCountElem = document.getElementById('session-count');
    if (courseCountElem) courseCountElem.textContent = courseCount;
    if (studentCountElem) studentCountElem.textContent = studentCount;
    if (sessionCountElem) sessionCountElem.textContent = sessionCount;
}

// Load faculty courses
async function loadFacultyCourses() {
    const courseListElement = document.getElementById('faculty-course-list');
    if (!courseListElement) return;

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const facultyId = userData?.facultyId || userData?.faculty_id;

    try {
        const response = await fetch(`/api/faculty/courses?faculty_id=${facultyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        const courses = data.courses || [];

        let coursesHTML = '';
        if (courses.length === 0) {
            coursesHTML = '<div class="empty-state"><p>You are not teaching any courses.</p></div>';
        } else {
            courses.forEach(course => {
                coursesHTML += `
                    <div class="course-card">
                        <div class="course-header">
                            <h3>${course.course_title}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-users"></i> Section: ${course.section || 'N/A'}</p>
                            <p><i class="fas fa-clock"></i> Semester: ${course.semester}</p>
                        </div>
                    </div>
                `;
            });
        }
        courseListElement.innerHTML = coursesHTML;
    } catch (error) {
        courseListElement.innerHTML = '<div class="error-state"><p>Error loading courses: ' + error.message + '</p></div>';
    }
}

