document.addEventListener('DOMContentLoaded', async function() {
    // Check if auth-utils.js is loaded and we have the validateUserAuth function
    console.log("Initializing faculty dashboard");
    
    // Validate user authentication with role check
    // Use the auth-utils validateUserAuth if available, otherwise fallback to basic check
    if (typeof validateUserAuth === 'function') {
        // Use enhanced auth validation with role check
        if (!validateUserAuth('faculty')) {
            console.log("Authentication validation failed");
            return;
        }
    } else {
        // Fallback to basic token check if auth-utils.js is not loaded
        console.warn("Auth utilities not detected, using basic auth check");
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            console.log("No auth token or user data found, redirecting to login");
            window.location.replace('/pages/login.html?expired=true');
            return;
        }
        
        try {
            const user = JSON.parse(userData);
            // Check if user is faculty type
            if (user.role !== 'faculty' && user.user_type !== 'faculty') {
                console.log("User is not faculty, redirecting");
                window.location.replace('/pages/login.html');
                return;
            }
        } catch (error) {
            console.error("Error checking user role:", error);
            window.location.replace('/pages/login.html');
            return;
        }
    }
    
    console.log("Authentication valid, loading faculty dashboard data");
    try {
        // Setup token refresh mechanism if available
        if (typeof setupTokenRefresh === 'function') {
            setupTokenRefresh();
        }
        
        // Load dashboard data
        await loadDashboardStats();
        await loadFacultyCourses();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        
        // Check if error is auth-related and redirect if needed
        if (error.message && 
            (error.message.includes('authenticate') || 
             error.message.includes('Unauthorized') || 
             error.message.includes('token'))) {
            console.log("Authentication error detected, redirecting to login");
            window.location.replace('/pages/login.html?expired=true');
        }
    }
});

// Load dashboard statistics
async function loadDashboardStats() {
    console.log('Loading dashboard statistics...');
    const token = localStorage.getItem('token');
    const courseCount = document.getElementById('course-count');
    const studentCount = document.getElementById('student-count');
    const sessionCount = document.getElementById('session-count');
    
    try {
        // Show loading indicators if available
        const loadingIndicators = document.querySelectorAll('.loading-indicator');
        loadingIndicators.forEach(indicator => {
            if (indicator) indicator.style.display = 'block';
        });
        
        // Fetch courses to count them and sum students
        console.log('Fetching courses data...');
        const response = await fetch('http://localhost:5000/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            },
            credentials: 'include' // Include cookies for HTTP-only token
        });
        
        // Check for auth errors first
        if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication failed. Please log in again.');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch course data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Courses data received:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch course data');
        }
        
        const courses = data.data || [];
        
        // Hide loading indicators
        loadingIndicators.forEach(indicator => {
            if (indicator) indicator.style.display = 'none';
        });
        
        // Count courses
        if (courseCount) courseCount.textContent = courses.length;
        
        // Sum enrolled students
        const totalStudents = courses.reduce((sum, course) => sum + (parseInt(course.student_count) || 0), 0);
        if (studentCount) studentCount.textContent = totalStudents;
        
        // For now, just show 0 sessions until we implement that endpoint
        if (sessionCount) sessionCount.textContent = '0';
        
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
    
    console.log('Loading faculty courses...');
    
    try {
        // Show loading state
        courseListElement.innerHTML = '<div class="loading">Loading courses...</div>';
        
        const response = await fetch('http://localhost:5000/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Courses data received:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch courses');
        }
        
        const courses = data.data || [];
        
        let coursesHTML = '';
        
        if (courses.length === 0) {
            coursesHTML = '<div class="empty-state"><p>You are not teaching any courses.</p></div>';
        } else {
            courses.forEach(course => {
                // Default attendance rate until we have real data
                const attendanceRate = course.attendance_rate || 85;
                
                // Determine color based on attendance rate
                let statusColor = attendanceRate >= 90 ? '#28a745' : 
                              attendanceRate >= 80 ? '#ffc107' : 
                              '#dc3545';
                
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
                                <div class="attendance-progress" style="width: ${attendanceRate}%; background-color: ${statusColor};"></div>
                            </div>
                            <span>${attendanceRate}% Average Attendance</span>
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
                <p>Error loading courses: ${error.message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Add this function to your existing faculty-dashboard.js file

// Load recent attendance records
async function loadRecentAttendance() {
    const token = localStorage.getItem('token');
    const attendanceTableBody = document.getElementById('recent-attendance-body');
    if (!attendanceTableBody) return;
    
    try {
        // Show loading state
        attendanceTableBody.innerHTML = '<tr><td colspan="5">Loading attendance data...</td></tr>';
        
        const response = await fetch('http://localhost:5000/api/faculty/recent-attendance', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch attendance data');
        }
        
        const records = data.data || [];
        
        if (records.length === 0) {
            attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No attendance records found</td></tr>';
            return;
        }
        
        let tableHTML = '';
        
        records.forEach(record => {
            // Format date
            const date = new Date(record.attendance_date);
            const formattedDate = date.toLocaleDateString();
            
            // Determine status class based on percentage
            let statusClass = record.percentage >= 90 ? 'status-present' : 
                         record.percentage >= 80 ? 'status-late' : 
                         'status-absent';
            
            tableHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${record.course_code} - ${record.course_name}</td>
                    <td>${record.present_count}</td>
                    <td>${record.absent_count}</td>
                    <td><span class="attendance-status-badge ${statusClass}">${record.percentage}%</span></td>
                </tr>
            `;
        });
        
        attendanceTableBody.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading recent attendance:', error);
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    Error loading attendance data: ${error.message}
                    <button onclick="loadRecentAttendance()" class="btn-sm">Retry</button>
                </td>
            </tr>
        `;
    }
}

// Make sure to call this function in your DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../pages/login.html';
        return;
    }

    console.log("Token found in localStorage");
    
    // Load dashboard data
    try {
        await loadDashboardStats();
        await loadFacultyCourses();
        await loadRecentAttendance(); // Add this line
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
});