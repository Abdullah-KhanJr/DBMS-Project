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
    
    // Set faculty name
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
            if (facultyName) facultyName.textContent = userData.name;
            if (welcomeName) welcomeName.textContent = userData.name;
        } else {
            // Fetch faculty data from API if not in localStorage
            try {
                const response = await fetch('/api/faculty/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const { data } = await response.json();
                    if (facultyName) facultyName.textContent = data.name;
                    if (welcomeName) welcomeName.textContent = data.name;
                    
                    // Update localStorage
                    userData.name = data.name;
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    console.error('Failed to fetch faculty profile');
                }
            } catch (error) {
                console.error('Error fetching faculty profile:', error);
            }
        }
    } catch (error) {
        console.error('Error retrieving user data:', error);
        if (facultyName) facultyName.textContent = "Faculty Member";
        if (welcomeName) welcomeName.textContent = "Faculty Member";
    }
    
    // Load dashboard data
    loadDashboardStats();
    loadFacultyCourses();
    loadRecentAttendance();
});

// Load dashboard statistics
async function loadDashboardStats() {
    const token = localStorage.getItem('token');
    const courseCount = document.getElementById('course-count');
    const studentCount = document.getElementById('student-count');
    const sessionCount = document.getElementById('session-count');
    
    try {
        // Fetch courses to count them and sum students
        const response = await fetch('/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch course data');
        }
        
        const { data: courses } = await response.json();
        
        // Count courses
        if (courseCount) courseCount.textContent = courses.length;
        
        // Sum enrolled students
        const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);
        if (studentCount) studentCount.textContent = totalStudents;
        
        // Fetch course sessions
        const sessionsResponse = await fetch('/api/faculty/course-sessions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!sessionsResponse.ok) {
            throw new Error('Failed to fetch session data');
        }
        
        const { data: sessions } = await sessionsResponse.json();
        
        // Sum conducted sessions
        const totalSessions = sessions.reduce((sum, course) => sum + (course.sessions_conducted || 0), 0);
        if (sessionCount) sessionCount.textContent = totalSessions;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        
        // Set fallback values
        if (courseCount) courseCount.textContent = '0';
        if (studentCount) studentCount.textContent = '0';
        if (sessionCount) sessionCount.textContent = '0';
    }
}

// Load faculty courses
async function loadFacultyCourses() {
    const token = localStorage.getItem('token');
    const courseListElement = document.getElementById('faculty-course-list');
    if (!courseListElement) return;
    
    try {
        // Show loading state
        courseListElement.innerHTML = '<div class="loading">Loading courses...</div>';
        
        const response = await fetch('/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }
        
        const { data: courses } = await response.json();
        
        let coursesHTML = '';
        
        if (courses.length === 0) {
            coursesHTML = '<div class="empty-state"><p>You are not teaching any courses.</p></div>';
        } else {
            courses.forEach(course => {
                // Determine color based on attendance rate
                let statusColor = course.attendance_rate >= 90 ? 'var(--success-color)' : 
                                course.attendance_rate >= 80 ? 'var(--warning-color)' : 
                                'var(--danger-color)';
                
                coursesHTML += `
                    <div class="course-card">
                        <div class="course-header">
                            <h3>${course.course_name}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-users"></i> ${course.student_count || 0} Students</p>
                            <p><i class="fas fa-layer-group"></i> Section ${course.section_name || 'N/A'}</p>
                            <p><i class="fas fa-book"></i> ${course.credit_hours} Credit Hours</p>
                        </div>
                        <div class="course-attendance">
                            <div class="attendance-bar">
                                <div class="attendance-progress" style="width: ${course.attendance_rate}%; background-color: ${statusColor};"></div>
                            </div>
                            <span>${course.attendance_rate.toFixed(1)}% Average Attendance</span>
                        </div>
                        <div class="course-actions">
                            <a href="mark-attendance.html?id=${course.course_id}" class="btn-small">Mark Attendance</a>
                            <a href="attendance-records.html?id=${course.course_id}" class="btn-small" style="margin-left: 5px;">View Records</a>
                        </div>
                    </div>
                `;
            });
        }
        
        courseListElement.innerHTML = coursesHTML;
    } catch (error) {
        console.error('Error loading courses:', error);
        courseListElement.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Error Loading Courses</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Load recent attendance records
async function loadRecentAttendance() {
    const token = localStorage.getItem('token');
    const attendanceTableBody = document.getElementById('recent-attendance');
    if (!attendanceTableBody) return;
    
    try {
        // Show loading state
        attendanceTableBody.innerHTML = '<tr><td colspan="5">Loading attendance data...</td></tr>';
        
        // Fetch attendance data
        // In a real implementation, you'd have a dedicated API endpoint for recent attendance
        // For now, we'll use the course attendance stats
        const response = await fetch('/api/faculty/course-attendance-stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch attendance data');
        }
        
        const { data: courses } = await response.json();
        
        // Sort by most recent (using conducted_sessions as a proxy for recency)
        courses.sort((a, b) => b.conducted_sessions - a.conducted_sessions);
        
        // Take only the first 4 entries
        const recentCourses = courses.slice(0, 4);
        
        if (recentCourses.length === 0) {
            attendanceTableBody.innerHTML = '<tr><td colspan="5">No attendance records found</td></tr>';
            return;
        }
        
        let attendanceHTML = '';
        
        recentCourses.forEach(course => {
            // Use conducted_sessions and avg_attendance to estimate present/absent
            const estimated_total = course.total_students * course.conducted_sessions;
            const estimated_present = Math.round(estimated_total * (course.avg_attendance / 100));
            const estimated_absent = estimated_total - estimated_present;
            
            // Determine status class based on percentage
            let statusClass = course.avg_attendance >= 90 ? 'status-present' : 
                            course.avg_attendance >= 80 ? 'status-late' : 
                            'status-absent';
            
            // Format date (using today's date as a placeholder)
            const today = new Date();
            const formattedDate = today.toLocaleDateString();
            
            attendanceHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${course.course_code} ${course.course_name}</td>
                    <td>${estimated_present}</td>
                    <td>${estimated_absent}</td>
                    <td><span class="attendance-status-badge ${statusClass}">${course.avg_attendance.toFixed(1)}%</span></td>
                </tr>
            `;
        });
        
        attendanceTableBody.innerHTML = attendanceHTML;
    } catch (error) {
        console.error('Error loading recent attendance:', error);
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="5">Error: ${error.message}</td>
            </tr>
        `;
    }
}