document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
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
    const courseListElement = document.getElementById('faculty-course-list');
    
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
    
    // Set faculty name from localStorage
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name && facultyName) {
            facultyName.textContent = userData.name;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        if (facultyName) facultyName.textContent = "Faculty";
    }
    
    // Load faculty courses
    if (courseListElement) {
        try {
            const response = await fetch('http://localhost:5000/api/faculty/courses', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            
            const courses = await response.json();
            
            if (courses.length === 0) {
                courseListElement.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>No Courses Found</h3>
                        <p>You don't have any courses yet. Click the button below to add your first course.</p>
                        <a href="add-course.html" class="btn-primary">Add Course</a>
                    </div>
                `;
                return;
            }
            
            let coursesHTML = '';
            
            courses.forEach(course => {
                // Calculate attendance percentage if available
                let attendanceRate = course.attendance_rate || 0;
                
                // Determine color based on attendance rate
                let statusColor = attendanceRate >= 90 ? 'var(--success-color)' : 
                                attendanceRate >= 80 ? 'var(--warning-color)' : 
                                'var(--danger-color)';
                
                coursesHTML += `
                    <div class="course-card">
                        <div class="course-header">
                            <h3>${course.course_name}</h3>
                            <span class="course-code">${course.course_code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-users"></i> ${course.student_count || 0} Students</p>
                            <p><i class="fas fa-layer-group"></i> Section ${course.section_name}</p>
                            <p><i class="fas fa-clock"></i> ${course.credit_hours} Credit Hours</p>
                        </div>
                        <div class="course-attendance">
                            <div class="attendance-bar">
                                <div class="attendance-progress" style="width: ${attendanceRate}%; background-color: ${statusColor};"></div>
                            </div>
                            <span>${attendanceRate.toFixed(1)}% Average Attendance</span>
                        </div>
                        <div class="course-actions">
                            <a href="mark-attendance.html?id=${course.course_id}" class="btn-small">Mark Attendance</a>
                            <a href="course-details.html?id=${course.course_id}" class="btn-small" style="margin-left: 5px;">View Details</a>
                        </div>
                    </div>
                `;
            });
            
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
});