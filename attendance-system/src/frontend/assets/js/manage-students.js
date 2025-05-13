document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isAuthenticated() || getUserRole() !== 'faculty') {
        window.location.href = '/src/frontend/pages/login.html';
        return;
    }

    // Populate course dropdown for instructor with courses and sections
    async function loadInstructorCourses() {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        const facultyId = userData?.facultyId || userData?.faculty_id;
        const courseDropdown = document.getElementById('course_id');
        if (!courseDropdown) return;
        
        try {
            const response = await fetch(`/api/faculty/courses?faculty_id=${facultyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            const courses = data.courses || [];
            
            // Clear dropdown and set default option
            courseDropdown.innerHTML = '<option value="">Select Course</option>';
            
            // Add courses with section information
            courses.forEach(course => {
                courseDropdown.innerHTML += `<option value="${course.course_id}">${course.course_code} - ${course.course_title} (Section: ${course.section || 'N/A'})</option>`;
            });
        } catch (error) {
            courseDropdown.innerHTML = '<option value="">Error loading courses</option>';
            console.error('Error loading courses:', error);
        }
    }
    
    // Load courses on page load
    loadInstructorCourses();

    // Enroll student logic (with validation)
    const regInput = document.getElementById('reg_number');
    const enrollBtn = document.getElementById('enroll-btn');
    const courseDropdown = document.getElementById('course_id');
    const statusBox = document.getElementById('status-message');
    const studentInfoBox = document.getElementById('student-info');
    const studentNameBox = document.getElementById('student-name');
    const studentEmailBox = document.getElementById('student-email');
    const enrollForm = document.getElementById('enroll-student-form');

    if (enrollForm && regInput && courseDropdown && enrollBtn) {
        enrollForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const regNum = regInput.value.trim();
            const courseId = courseDropdown.value;
            
            // Reset status and student info display
            statusBox.textContent = '';
            statusBox.style.display = 'none';
            studentInfoBox.style.display = 'none';
            
            // Validate form inputs
            if (!regNum || !courseId) {
                statusBox.textContent = 'Please select a course and enter a registration number.';
                statusBox.style.color = 'red';
                statusBox.style.background = '#ffebee';
                statusBox.style.display = 'block';
                return;
            }
            
            const token = localStorage.getItem('token');
            
            try {
                // Check if student exists in the database
                const verifyResponse = await fetch(`/api/faculty/verify-student?registration_number=${regNum}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const verifyData = await verifyResponse.json();
                
                if (!verifyResponse.ok || !verifyData.exists) {
                    // Student not found in database
                    statusBox.textContent = 'Student not found. Please check the registration number.';
                    statusBox.style.color = 'red';
                    statusBox.style.background = '#ffebee';
                    statusBox.style.display = 'block';
                    return;
                }
                
                // Student found, directly enroll the student
                const enrollResponse = await fetch('/api/faculty/courses/add-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        registration_number: regNum,
                        course_id: courseId
                    })
                });
                
                const enrollData = await enrollResponse.json();
                
                if (enrollResponse.ok && enrollData.success) {
                    // Enrollment successful
                    showNotification('Student has been enrolled successfully.', 'success');
                    // Clear form
                    regInput.value = '';
                } else {
                    // Enrollment failed
                    showNotification(enrollData.error || 'Failed to enroll student. The student may already be enrolled in this course.', 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
                console.error('Error:', error);
            }
        });
    }
});

function showError(message) {
    const alertBox = document.getElementById('alert-box');
    if (!alertBox) {
        alert(message);
        return;
    }
    alertBox.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function showSuccess(message) {
    const alertBox = document.getElementById('alert-box');
    if (!alertBox) {
        alert(message);
        return;
    }
    alertBox.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

// Define isAuthenticated and getUserRole if not present
if (typeof isAuthenticated !== 'function') {
  function isAuthenticated() { return true; }
}
if (typeof getUserRole !== 'function') {
  function getUserRole() { return 'faculty'; }
}