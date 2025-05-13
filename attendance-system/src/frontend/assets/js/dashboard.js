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
    
    // Set student name (fetch from backend or localStorage)
    async function displayStudentName() {
        const studentNameElements = [document.getElementById('student-name')].filter(Boolean);
        const welcomeNameElements = [document.getElementById('welcome-name')].filter(Boolean);
        if (studentNameElements.length === 0 && welcomeNameElements.length === 0) return;
        const token = localStorage.getItem('token');
        let userData = null;
        try {
            userData = JSON.parse(localStorage.getItem('userData'));
        } catch (error) {
            console.error('Error parsing userData from localStorage:', error);
        }
        if (userData && userData.name) {
            studentNameElements.forEach(e => e.textContent = userData.name);
            welcomeNameElements.forEach(e => e.textContent = userData.name);
            return;
        }
        if (token) {
            try {
                const response = await fetch('/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (userData) {
                        userData.name = data.name;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } else {
                        localStorage.setItem('userData', JSON.stringify({ name: data.name, id: data.id }));
                    }
                    studentNameElements.forEach(e => e.textContent = data.name);
                    welcomeNameElements.forEach(e => e.textContent = data.name);
                    return;
                }
            } catch (error) {
                console.error('Error fetching student profile:', error);
            }
        }
        studentNameElements.forEach(e => e.textContent = 'Student');
        welcomeNameElements.forEach(e => e.textContent = 'Student');
    }
    displayStudentName();
    
    // Load courses
    loadCourses();
});

async function loadCourses() {
    const courseList = document.getElementById('course-list');
    if (!courseList) return;
    // Get registration_number from userData in localStorage
    let userData = null;
    try {
        userData = JSON.parse(localStorage.getItem('userData'));
    } catch (e) {}
    const registrationNumber = userData?.registrationNumber || userData?.registration_number;
    if (!registrationNumber) {
        courseList.innerHTML = '<div class="error-state"><p>Could not determine student registration number.</p></div>';
        return;
    }
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/student/courses/${registrationNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            courseList.innerHTML = `<div class="error-state"><p>Error loading courses: ${response.status} ${response.statusText}</p></div>`;
            console.error('Failed to fetch student courses:', response.status, response.statusText);
            return;
        }
        const data = await response.json();
        const courses = data.courses || [];
        updateStats(courses);
        let coursesHTML = '';
        if (courses.length === 0) {
            coursesHTML = '<div class="empty-state"><p>You are not enrolled in any courses.</p></div>';
        } else {
            courses.forEach(course => {
                coursesHTML += `
                    <div class="course-card">
                        <div class="course-header">
                            <h3>${course.course_title}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-chalkboard-teacher"></i> ${course.instructor_name || 'N/A'}</p>
                        </div>
                        <div class="course-actions">
                            <a href="course-details.html?id=${course.course_id}" class="btn-small">View Details</a>
                        </div>
                    </div>
                `;
            });
        }
        courseList.innerHTML = coursesHTML;
    } catch (error) {
        courseList.innerHTML = '<div class="error-state"><p>Error loading courses: ' + error.message + '</p></div>';
        console.error('Error loading courses:', error);
    }
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