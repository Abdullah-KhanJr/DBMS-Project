// At the top, add a global variable for status mapping
let attendanceStatusMap = {};

// Fetch status_id mapping at page load
async function fetchAttendanceStatusMap() {
    const response = await fetch('/api/attendance-status');
    if (response.ok) {
        const data = await response.json();
        attendanceStatusMap = data.reduce((acc, row) => {
            acc[row.label] = row.status_id;
            return acc;
        }, {});
    } else {
        attendanceStatusMap = { 'Present': 1, 'Absent': 2, 'Leave': 3 };
    }
}

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
    
    await fetchAttendanceStatusMap();
});

// Load faculty courses for dropdown
async function loadCourses() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const facultyId = userData?.facultyId || userData?.faculty_id;
    const courseDropdown = document.getElementById('course_id');
    
    try {
        const response = await fetch(`/api/faculty/courses?faculty_id=${facultyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const courses = data.courses || [];
            
            // Clear existing options
            courseDropdown.innerHTML = '<option value="">Select Course</option>';
            
            // Add course options with section information
            courses.forEach(course => {
                courseDropdown.innerHTML += `<option value="${course.course_id}">${course.course_code} - ${course.course_title} (Section: ${course.section || 'N/A'})</option>`;
            });
        } else {
            throw new Error('Failed to load courses');
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        showStatusMessage('Error loading courses: ' + error.message, 'error');
        courseDropdown.innerHTML = '<option value="">Error loading courses</option>';
    }
}

// Load course sessions data
async function loadCourseSessions() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const facultyId = userData?.facultyId || userData?.faculty_id;
    const sessionsList = document.getElementById('course-sessions-list');
    
    try {
        const response = await fetch(`/api/faculty/course-sessions?faculty_id=${facultyId}`, {
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
        showStatusMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Format date and time for API
        const sessionDatetime = `${sessionDate}T${sessionTime}:00`;
        
        // Log the data being sent (for debugging)
        console.log('Sending session data:', {
            course_id: courseId,
            session_date: sessionDatetime,
            duration: duration
        });
        
        const response = await fetch('/api/faculty/course-sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                course_id: courseId,
                session_date: sessionDatetime,
                duration: parseInt(duration)
            })
        });
        
        // Defensive: check content-type before parsing as JSON
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error('Server error: ' + text);
        }
        
        if (response.ok) {
            showStatusMessage(`Session created successfully for course ID: ${courseId}`, 'success');
            
            // Clear form values
            document.getElementById('create-session-form').reset();
            
            // Set today's date as default again
            document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
            
            // Load enrolled students for marking attendance
            await loadEnrolledStudents(courseId, data.session_id);
            
            // Show attendance marking section
            attendanceSection.style.display = 'block';
            
            // Update sessions list
            await loadCourseSessions();
        } else {
            throw new Error(data.error || 'Failed to create session');
        }
    } catch (error) {
        console.error('Error creating session:', error);
        showStatusMessage('Error: ' + error.message, 'error');
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
            
            // Update attendance section with course info and session ID
            document.getElementById('attendance-course-id').value = courseId;
            document.getElementById('attendance-session-id').value = sessionId;
            
            // Generate student list for marking attendance
            studentsList.innerHTML = '';
            
            if (students.length === 0) {
                studentsList.innerHTML = '<tr><td colspan="3" class="text-center">No students enrolled in this course.</td></tr>';
                return;
            }
            
            students.forEach(student => {
                studentsList.innerHTML += `
                <tr>
                    <td>${student.registration_number}</td>
                    <td>${student.name}</td>
                    <td>
                        <select name="attendance_status_${student.registration_number}" class="attendance-status">
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                        </select>
                        <input type="hidden" name="student_reg" value="${student.registration_number}">
                    </td>
                </tr>
                `;
            });
            
        } else {
            throw new Error('Failed to load students');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        studentsList.innerHTML = `<tr><td colspan="3" class="text-center">Error loading students: ${error.message}</td></tr>`;
    }
}

// Save attendance records
async function saveAttendance(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const courseId = document.getElementById('attendance-course-id').value;
    const sessionId = document.getElementById('attendance-session-id').value;
    const userData = JSON.parse(localStorage.getItem('userData'));
    const markedBy = userData?.facultyId || userData?.faculty_id;
    const today = new Date();
    const attendanceDate = today.toISOString().split('T')[0];
    const attendanceTime = today.toTimeString().split(' ')[0];
    
    try {
        const attendanceRecords = [];
        const studentInputs = document.querySelectorAll('input[name^="student_reg"]');
        
        studentInputs.forEach(input => {
            const registrationNumber = input.value;
            const statusElement = document.querySelector(`select[name="attendance_status_${registrationNumber}"]`);
            const status = statusElement ? statusElement.value : 'Absent';
            const statusId = attendanceStatusMap[status] || 2;
            
            attendanceRecords.push({
                registration_number: registrationNumber,
                status_id: statusId,
                attendance_date: attendanceDate,
                attendance_time: attendanceTime,
                marked_by: markedBy
            });
        });
        
        // Log the data being sent (for debugging)
        console.log('Sending attendance data:', {
            session_id: sessionId,
            course_id: courseId,
            attendance: attendanceRecords
        });
        
        const response = await fetch('/api/faculty/attendance/mark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: sessionId,
                course_id: courseId,
                attendance: attendanceRecords
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatusMessage('Attendance saved successfully!', 'success');
            
            // Hide attendance section after saving
            document.getElementById('attendance-section').style.display = 'none';
        } else {
            throw new Error(data.error || 'Failed to save attendance');
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        showStatusMessage('Error: ' + error.message, 'error');
    }
}

// Add this function to debug API responses
function logApiResponse(response, data) {
    console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        data: data
    });
}

// Mark all students as present
function markAllPresent() {
    const statusSelects = document.querySelectorAll('.attendance-status');
    statusSelects.forEach(select => {
        select.value = 'Present';
    });
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