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
    loadAdminStatsAndCourses();
});

async function loadAdminStatsAndCourses() {
    const totalCoursesElem = document.getElementById('total-courses');
    const activeFacultyElem = document.getElementById('active-faculty');
    const courseListElem = document.getElementById('admin-course-list');
    const token = localStorage.getItem('token');
    try {
        // Fetch all courses
        const coursesRes = await fetch('/api/admin/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();
        const courses = coursesData.courses || [];
        // Set total courses
        if (totalCoursesElem) totalCoursesElem.textContent = courses.length;
        // Find unique faculty teaching at least one course
        const facultySet = new Set();
        courses.forEach(course => {
            if (course.faculty_id) facultySet.add(course.faculty_id);
        });
        if (activeFacultyElem) activeFacultyElem.textContent = facultySet.size;
        // Render course cards
        let coursesHTML = '';
        if (courses.length === 0) {
            coursesHTML = '<div class="empty-state"><p>No courses found.</p></div>';
        } else {
            // For each course, fetch the number of students enrolled and the number of sessions conducted
            for (const course of courses) {
                let studentCount = 0;
                let sessionsCount = 0;
                try {
                    const studentsRes = await fetch(`/api/faculty/courses/students?course_id=${course.course_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const studentsData = await studentsRes.json();
                    studentCount = (studentsData.students || []).length;
                } catch (e) {}
                try {
                    const matrixRes = await fetch(`/api/faculty/attendance/matrix?course_id=${course.course_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const matrixData = await matrixRes.json();
                    const sessions = matrixData.sessions || [];
                    sessionsCount = sessions.length;
                } catch (e) {}
                coursesHTML += `
                    <div class="course-card">
                        <div class="course-header">
                            <h3>${course.course_title}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-chalkboard-teacher"></i> ${course.instructor_name || 'N/A'}</p>
                            <p><i class="fas fa-layer-group"></i> Section: ${course.section || 'N/A'}</p>
                            <p><i class="fas fa-users"></i> Students: ${studentCount}</p>
                            <p><i class="fas fa-calendar-check"></i> Sessions: ${sessionsCount}</p>
                        </div>
                    </div>
                `;
            }
        }
        if (courseListElem) courseListElem.innerHTML = coursesHTML;
    } catch (error) {
        if (courseListElem) courseListElem.innerHTML = '<div class="error-state"><p>Error loading courses: ' + error.message + '</p></div>';
    }
}