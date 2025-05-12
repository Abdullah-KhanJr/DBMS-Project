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
    const enrollForm = document.getElementById('enroll-student-form');
    const courseDropdown = document.getElementById('course_id');
    const filterCourseDropdown = document.getElementById('filter-course');
    const filterBtn = document.getElementById('filter-btn');
    const studentsList = document.getElementById('students-list');
    const statusMessage = document.getElementById('status-message');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmRemove = document.getElementById('confirm-remove');
    const cancelRemove = document.getElementById('cancel-remove');
    const modalClose = document.querySelector('.modal-close');
    
    // For storing current student to remove
    let currentRemovalData = null;
    
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
    
    // Load faculty courses for both dropdowns
    async function loadCourses() {
        try {
            const response = await fetch('/api/faculty/courses', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            const courses = data.courses || [];
            
            // Clear dropdowns
            if (courseDropdown) courseDropdown.innerHTML = '<option value="">Select Course</option>';
            if (filterCourseDropdown) filterCourseDropdown.innerHTML = '<option value="">Select Course</option>';
            
            if (courses.length === 0) {
                if (courseDropdown) {
                    courseDropdown.innerHTML += '<option value="" disabled>No courses available</option>';
                }
                if (filterCourseDropdown) {
                    filterCourseDropdown.innerHTML += '<option value="" disabled>No courses available</option>';
                }
                return;
            }
            
            // Populate both dropdowns
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                
                if (courseDropdown) {
                    courseDropdown.appendChild(option.cloneNode(true));
                }
                
                if (filterCourseDropdown) {
                    filterCourseDropdown.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading courses:', error);
            showStatus('error', `Error loading courses: ${error.message}`);
        }
    }
    
    // Load courses when page loads
    await loadCourses();
    
    // Handle enroll form submission
    if (enrollForm) {
        enrollForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const enrollmentData = {
                course_id: document.getElementById('course_id').value,
                registration_number: document.getElementById('registration_number').value,
            };
            
            try {
                const response = await fetch('/api/faculty/courses/add-student', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(enrollmentData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to enroll student');
                }
                
                // Show success message
                showStatus('success', 'Student enrolled successfully!');
                
                // Reset form
                enrollForm.reset();
                
                // Reload students list if a course is selected in the filter
                if (filterCourseDropdown.value) {
                    loadStudentsByCourse(filterCourseDropdown.value);
                }
                
            } catch (error) {
                console.error('Error enrolling student:', error);
                showStatus('error', `Error: ${error.message}`);
            }
        });
    }
    
    // Handle filter button click
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            const selectedCourseId = filterCourseDropdown.value;
            if (selectedCourseId) {
                loadStudentsByCourse(selectedCourseId);
            } else {
                studentsList.innerHTML = '<tr><td colspan="5" class="text-center">Select a course to view enrolled students</td></tr>';
            }
        });
    }
    
    // Load students for a specific course
    async function loadStudentsByCourse(courseId) {
        if (!studentsList) return;
        
        studentsList.innerHTML = '<tr><td colspan="5" class="text-center">Loading students...</td></tr>';
        
        try {
            const response = await fetch(`/api/faculty/courses/students?course_id=${courseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            const students = data.students || [];
            
            if (students.length === 0) {
                studentsList.innerHTML = '<tr><td colspan="5" class="text-center">No students enrolled in this course</td></tr>';
                return;
            }
            
            let studentsHTML = '';
            
            students.forEach(student => {
                const enrollmentDate = new Date(student.enrollment_date).toLocaleDateString();
                
                studentsHTML += `
                    <tr>
                        <td>${student.registration_number}</td>
                        <td>${student.name}</td>
                        <td>${student.course_code} - ${student.course_name}</td>
                        <td>${enrollmentDate}</td>
                        <td>
                            <button class="btn-danger btn-small remove-student" 
                                    data-reg="${student.registration_number}" 
                                    data-course="${student.course_id}"
                                    data-name="${student.name}">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            studentsList.innerHTML = studentsHTML;
            
            // Add event listeners to remove buttons
            const removeButtons = document.querySelectorAll('.remove-student');
            removeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const regNumber = this.getAttribute('data-reg');
                    const courseId = this.getAttribute('data-course');
                    const studentName = this.getAttribute('data-name');
                    
                    // Store data for confirmation
                    currentRemovalData = {
                        registration_number: regNumber,
                        course_id: courseId,
                        student_name: studentName
                    };
                    
                    // Show confirmation modal
                    confirmationModal.style.display = 'block';
                    document.querySelector('#confirmation-modal .modal-body p').textContent = 
                        `Are you sure you want to remove ${studentName} from this course?`;
                });
            });
            
        } catch (error) {
            console.error('Error loading students:', error);
            studentsList.innerHTML = `<tr><td colspan="5" class="text-center">Error: ${error.message}</td></tr>`;
        }
    }
    
    // Handle confirm removal button
    if (confirmRemove) {
        confirmRemove.addEventListener('click', async function() {
            if (!currentRemovalData) return;
            
            try {
                const response = await fetch('/api/faculty/enrollment', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        registration_number: currentRemovalData.registration_number,
                        course_id: currentRemovalData.course_id
                    })
                });
                
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || 'Failed to remove student');
                }
                
                // Show success message
                showStatus('success', `${currentRemovalData.student_name} has been removed from the course.`);
                
                // Hide modal
                confirmationModal.style.display = 'none';
                
                // Reload students list
                loadStudentsByCourse(filterCourseDropdown.value);
                
            } catch (error) {
                console.error('Error removing student:', error);
                showStatus('error', `Error: ${error.message}`);
                confirmationModal.style.display = 'none';
            } finally {
                currentRemovalData = null;
            }
        });
    }
    
    // Handle cancel removal button
    if (cancelRemove) {
        cancelRemove.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            currentRemovalData = null;
        });
    }
    
    // Handle modal close button
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            currentRemovalData = null;
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
            currentRemovalData = null;
        }
    });
    
    // Helper function to show status messages
    function showStatus(type, message) {
        if (!statusMessage) return;
        
        const icon = type === 'success' ? 'check-circle' : 'times-circle';
        const statusClass = type === 'success' ? 'status-success' : 'status-error';
        
        statusMessage.innerHTML = `
            <div class="${statusClass}">
                <i class="fas fa-${icon}"></i>
                ${message}
            </div>
        `;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            statusMessage.innerHTML = '';
        }, 5000);
    }
});