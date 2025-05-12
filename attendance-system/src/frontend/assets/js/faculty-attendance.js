document.addEventListener('DOMContentLoaded', async function() {    // Verify faculty is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    
    // Display faculty name using common function
    displayFacultyName();
    
    // Load courses for dropdown
    await loadCourses();
    
    // Load course sessions data
    await loadCourseSessions();
    
    // Handle create session form submission
    const createSessionForm = document.getElementById('create-session-form');
    createSessionForm.addEventListener('submit', createSession);
    
    // Handle mark all present button
    document.getElementById('mark-all-present').addEventListener('click', markAllPresent);
      // Handle mark attendance form submission
    const markAttendanceForm = document.getElementById('mark-attendance-form');
    markAttendanceForm.addEventListener('submit', saveAttendance);
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('session_date').value = today;
    
    // Handle sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });
});

// Load faculty courses for dropdown
async function loadCourses() {
    const token = localStorage.getItem('token');
    const courseDropdown = document.getElementById('course_id');
    
    try {
        const response = await fetch('/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const courses = data.courses || [];
            
            // Clear existing options except the first one
            courseDropdown.innerHTML = '<option value="">Select Course</option>';
            
            // Add course options
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.course_code} - ${course.course_title}`;
                courseDropdown.appendChild(option);
            });
            
        } else {
            throw new Error('Failed to load courses');
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        showStatusMessage('Error loading courses: ' + error.message, 'error');
    }
}

// Load course sessions data
async function loadCourseSessions() {
    const token = localStorage.getItem('token');
    const sessionsList = document.getElementById('course-sessions-list');
    
    try {
        const response = await fetch('/api/faculty/course-sessions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const sessions = await response.json();
            
            if (sessions.length === 0) {
                sessionsList.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">No course sessions found.</td>
                    </tr>
                `;
                return;
            }
            
            sessionsList.innerHTML = sessions.map(session => `
                <tr>
                    <td>${session.course_code} - ${session.course_title}</td>
                    <td>${session.credit_hours}</td>
                    <td>${session.sessions_conducted}</td>
                    <td>${session.max_sessions}</td>
                </tr>
            `).join('');
            
        } else {
            throw new Error('Failed to load course sessions');
        }
    } catch (error) {
        console.error('Error fetching course sessions:', error);
        sessionsList.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Error loading course sessions. Please try again.</td>
            </tr>
        `;
    }
}

// Create attendance session
async function createSession(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const statusMessage = document.getElementById('status-message');
    const attendanceSection = document.getElementById('attendance-section');
    
    const courseId = document.getElementById('course_id').value;
    const sessionDate = document.getElementById('session_date').value;
    const sessionTime = document.getElementById('session_time').value;
    const duration = document.getElementById('duration').value;
    
    if (!courseId || !sessionDate || !sessionTime || !duration) {
        showStatusMessage('Please fill all required fields', 'error');
        return;
    }
    
    try {
        statusMessage.textContent = 'Creating session...';
        statusMessage.className = 'status-message info';
        
        const response = await fetch('/api/faculty/create-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                course_id: courseId,
                session_date: sessionDate,
                session_time: sessionTime,
                duration: duration
            })
        });
        
        if (response.ok) {
            const session = await response.json();
            
            // Update session info
            document.getElementById('session_id').value = session.id;
            document.getElementById('session-course').textContent = session.course_name;
            document.getElementById('session-date').textContent = new Date(session.session_date).toLocaleDateString();
            document.getElementById('session-time').textContent = session.session_time;
            
            // Show attendance section
            attendanceSection.style.display = 'block';
            
            // Load enrolled students for this course
            await loadEnrolledStudents(courseId, session.id);
            
            showStatusMessage('Session created successfully!', 'success');
            
            // Update course sessions
            loadCourseSessions();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create session');
        }
    } catch (error) {
        console.error('Error creating session:', error);
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

// Load enrolled students for a course
async function loadEnrolledStudents(courseId, sessionId) {
    const token = localStorage.getItem('token');
    const studentsList = document.getElementById('students-list');
    
    try {
        const response = await fetch(`/api/faculty/courses/students?course_id=${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const students = data.students || [];
            
            if (students.length === 0) {
                studentsList.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">No students enrolled in this course.</td>
                    </tr>
                `;
                return;
            }
            
            studentsList.innerHTML = students.map(student => `
                <tr>
                    <td>${student.reg_number}</td>
                    <td>${student.student_name}</td>
                    <td>
                        <select name="status_${student.student_id}" class="attendance-status">
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                        </select>
                    </td>
                </tr>
            `).join('');
            
        } else {
            throw new Error('Failed to load enrolled students');
        }
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        studentsList.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">Error loading students. Please try again.</td>
            </tr>
        `;
    }
}

// Mark all students as present
function markAllPresent() {
    const statusSelects = document.querySelectorAll('.attendance-status');
    statusSelects.forEach(select => {
        select.value = 'Present';
    });
}

// Save attendance records
async function saveAttendance(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const sessionId = document.getElementById('session_id').value;
    const statusMessage = document.getElementById('status-message');
    
    if (!sessionId) {
        showStatusMessage('No active session found', 'error');
        return;
    }
    
    try {
        statusMessage.textContent = 'Saving attendance...';
        statusMessage.className = 'status-message info';
        
        // Collect attendance data
        const statusSelects = document.querySelectorAll('.attendance-status');
        const attendanceData = Array.from(statusSelects).map(select => {
            const studentId = select.name.replace('status_', '');
            return {
                student_id: studentId,
                status: select.value
            };
        });
        
        const response = await fetch('/api/faculty/attendance/mark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(attendanceData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showStatusMessage(result.message, result.type);
            
            // Hide attendance section after 2 seconds
            setTimeout(() => {
                document.getElementById('attendance-section').style.display = 'none';
                // Reset form
                document.getElementById('create-session-form').reset();
                // Set today's date again
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('session_date').value = today;
            }, 2000);
            
            // Update course sessions
            loadCourseSessions();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save attendance');
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

// Show status message
function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 3000);
}