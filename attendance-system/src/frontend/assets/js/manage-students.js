document.addEventListener('DOMContentLoaded', async function() {
    // Verify faculty is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    
    // Display faculty name
    const facultyName = document.getElementById('faculty-name');
    try {
        const response = await fetch('/api/faculty/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const faculty = await response.json();
            facultyName.textContent = `${faculty.first_name} ${faculty.last_name}`;
        } else {
            throw new Error('Failed to load faculty profile');
        }
    } catch (error) {
        console.error('Error fetching faculty profile:', error);
        facultyName.textContent = 'Faculty';
    }
    
    // Load courses for dropdown
    await loadCourses();
    
    // Load enrollments
    await loadEnrollments();
    
    // Handle course filter change
    document.getElementById('filter-course').addEventListener('change', loadEnrollments);
    
    // Handle student verification
    const verifyStudentBtn = document.getElementById('verify-student-btn');
    verifyStudentBtn.addEventListener('click', verifyStudent);
    
    // Handle enrollment form submission
    const enrollStudentForm = document.getElementById('enroll-student-form');
    enrollStudentForm.addEventListener('submit', enrollStudent);
    
    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = '../login.html';
    });
    
    document.getElementById('logout-link').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '../login.html';
    });
    
    // Handle sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.querySelector('.dashboard-container').classList.toggle('sidebar-collapsed');
    });
});

// Load faculty courses for dropdown
async function loadCourses() {
    const token = localStorage.getItem('token');
    const courseDropdown = document.getElementById('course_id');
    const filterCourseDropdown = document.getElementById('filter-course');
    
    try {
        const response = await fetch('/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const courses = await response.json();
            
            // Clear existing options except the first one
            courseDropdown.innerHTML = '<option value="">Select Course</option>';
            filterCourseDropdown.innerHTML = '<option value="">All Courses</option>';
            
            // Add course options
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.course_code} - ${course.course_title}`;
                courseDropdown.appendChild(option);
                
                const filterOption = option.cloneNode(true);
                filterCourseDropdown.appendChild(filterOption);
            });
            
        } else {
            throw new Error('Failed to load courses');
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        showStatusMessage('Error loading courses: ' + error.message, 'error');
    }
}

// Verify student by registration number
async function verifyStudent() {
    const token = localStorage.getItem('token');
    const regNumber = document.getElementById('reg_number').value.trim();
    const studentInfo = document.getElementById('student-info');
    const studentName = document.getElementById('student-name');
    const studentEmail = document.getElementById('student-email');
    const enrollBtn = document.getElementById('enroll-btn');
    const statusMessage = document.getElementById('status-message');
    
    if (!regNumber) {
        showStatusMessage('Please enter a registration number', 'error');
        return;
    }
    
    try {
        statusMessage.textContent = 'Verifying student...';
        statusMessage.className = 'status-message info';
        
        const response = await fetch(`/api/faculty/verify-student/${regNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const student = await response.json();
            studentName.textContent = `Name: ${student.first_name} ${student.last_name}`;
            studentEmail.textContent = `Email: ${student.email}`;
            studentInfo.style.display = 'block';
            enrollBtn.disabled = false;
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Student not found');
        }
    } catch (error) {
        console.error('Error verifying student:', error);
        studentInfo.style.display = 'none';
        enrollBtn.disabled = true;
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

// Enroll student in course
async function enrollStudent(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const courseId = document.getElementById('course_id').value;
    const regNumber = document.getElementById('reg_number').value.trim();
    const statusMessage = document.getElementById('status-message');
    
    if (!courseId) {
        showStatusMessage('Please select a course', 'error');
        return;
    }
    
    if (!regNumber) {
        showStatusMessage('Please enter a registration number', 'error');
        return;
    }
    
    try {
        statusMessage.textContent = 'Enrolling student...';
        statusMessage.className = 'status-message info';
        
        const response = await fetch('/api/faculty/enroll-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                course_id: courseId,
                reg_number: regNumber
            })
        });
        
        if (response.ok) {
            showStatusMessage('Student enrolled successfully!', 'success');
            
            // Reset form
            document.getElementById('enroll-student-form').reset();
            document.getElementById('student-info').style.display = 'none';
            document.getElementById('enroll-btn').disabled = true;
            
            // Reload enrollments
            loadEnrollments();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to enroll student');
        }
    } catch (error) {
        console.error('Error enrolling student:', error);
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

// Load enrollments
async function loadEnrollments() {
    const token = localStorage.getItem('token');
    const enrollmentsList = document.getElementById('enrollments-list');
    const courseFilter = document.getElementById('filter-course').value;
    
    try {
        let url = '/api/faculty/enrollments';
        if (courseFilter) {
            url += `?course_id=${courseFilter}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const enrollments = await response.json();
            
            if (enrollments.length === 0) {
                enrollmentsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No enrollments found.</td>
                    </tr>
                `;
                return;
            }
            
            enrollmentsList.innerHTML = enrollments.map(enrollment => `
                <tr>
                    <td>${enrollment.reg_number}</td>
                    <td>${enrollment.student_name}</td>
                    <td>${enrollment.course_code} - ${enrollment.course_title}</td>
                    <td>${new Date(enrollment.enrollment_date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-icon" onclick="removeEnrollment(${enrollment.enrollment_id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
        } else {
            throw new Error('Failed to load enrollments');
        }
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        enrollmentsList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Error loading enrollments. Please try again.</td>
            </tr>
        `;
    }
}

// Remove enrollment
async function removeEnrollment(enrollmentId) {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/faculty/enrollments/${enrollmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showStatusMessage('Student removed from course successfully!', 'success');
            loadEnrollments();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove student');
        }
    } catch (error) {
        console.error('Error removing enrollment:', error);
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