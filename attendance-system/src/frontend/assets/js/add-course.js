document.addEventListener('DOMContentLoaded', async function() {
    // Verify faculty is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    
    // Get DOM elements
    const addCourseForm = document.getElementById('add-course-form');
    const statusMessage = document.getElementById('status-message');
    const coursesList = document.getElementById('courses-list');
    const facultyName = document.getElementById('faculty-name');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Setup event listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.dashboard-container').classList.toggle('sidebar-collapsed');
        });
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    function handleLogout(e) {
        if (e) e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    // Display faculty name
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
            facultyName.textContent = userData.name;
        } else {
            // Fetch profile if not in localStorage
            const response = await fetch('/api/faculty/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const { data } = await response.json();
                facultyName.textContent = data.name;
            } else {
                throw new Error('Failed to load faculty profile');
            }
        }
    } catch (error) {
        console.error('Error loading faculty name:', error);
        facultyName.textContent = 'Faculty';
    }
    
    // Load sections for dropdown
    const sectionDropdown = document.getElementById('section');
    if (sectionDropdown) {
        try {
            const response = await fetch('/api/faculty/sections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const { data: sections } = await response.json();
                
                // Clear existing options except the first one
                sectionDropdown.innerHTML = '<option value="">Select Section</option>';
                
                // Add section options
                sections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.section_id;
                    option.textContent = section.name;
                    sectionDropdown.appendChild(option);
                });
            } else {
                throw new Error('Failed to load sections');
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            showStatus('error', 'Failed to load sections. Please try again later.');
        }
    }
    
    // Load faculty courses
    loadFacultyCourses();
    
    // Handle form submission
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show "submitting" status
            showStatus('info', 'Adding course...');
            
            const formData = {
                course_code: document.getElementById('course_code').value,
                course_name: document.getElementById('course_title').value,
                credit_hours: parseInt(document.getElementById('credit_hours').value),
                section_id: document.getElementById('section').value || null,
                description: document.getElementById('description').value || ''
            };
            
            try {
                const response = await fetch('/api/faculty/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to create course');
                }
                
                // Show success message
                showStatus('success', 'Course created successfully!');
                
                // Reset the form
                addCourseForm.reset();
                
                // Reload courses list
                loadFacultyCourses();
                
                // Go to courses page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'courses.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error creating course:', error);
                showStatus('error', `Error: ${error.message}`);
            }
        });
    }
    
    // Helper function to show status message
    function showStatus(type, message) {
        if (!statusMessage) return;
        
        let icon;
        switch (type) {
            case 'success': icon = 'check-circle'; break;
            case 'error': icon = 'times-circle'; break;
            case 'info': icon = 'info-circle'; break;
            default: icon = 'info-circle';
        }
        
        statusMessage.innerHTML = `
            <div class="status-${type}">
                <i class="fas fa-${icon}"></i>
                ${message}
            </div>
        `;
        
        // Clear success/info messages after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 5000);
        }
    }
    
    // Load faculty courses
    async function loadFacultyCourses() {
        if (!coursesList) return;
        
        try {
            // Show loading state
            coursesList.innerHTML = '<tr><td colspan="5" class="text-center">Loading courses...</td></tr>';
            
            const response = await fetch('/api/faculty/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load courses');
            }
            
            const { data: courses } = await response.json();
            
            if (courses.length === 0) {
                coursesList.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No courses found. Add your first course above!</td>
                    </tr>
                `;
                return;
            }
            
            coursesList.innerHTML = courses.map(course => `
                <tr>
                    <td>${course.course_code}</td>
                    <td>${course.course_name}</td>
                    <td>${course.section_name || 'N/A'}</td>
                    <td>${course.credit_hours}</td>
                    <td>${course.student_count || 0}</td>
                </tr>
            `).join('');
            
        } catch (error) {
            console.error('Error loading courses:', error);
            coursesList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Error: ${error.message}</td>
                </tr>
            `;
        }
    }
});