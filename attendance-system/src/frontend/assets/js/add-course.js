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
    
    // Load faculty courses
    loadFacultyCourses();
    
    // Handle form submission
    const addCourseForm = document.getElementById('add-course-form');
    const statusMessage = document.getElementById('status-message');
    
    addCourseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            course_code: document.getElementById('course_code').value,
            course_title: document.getElementById('course_title').value,
            semester: document.getElementById('semester').value,
            credit_hours: document.getElementById('credit_hours').value,
            description: document.getElementById('description').value
        };
        
        try {
            statusMessage.textContent = 'Adding course...';
            statusMessage.className = 'status-message info';
            
            const response = await fetch('/api/faculty/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const result = await response.json();
                statusMessage.textContent = 'Course added successfully!';
                statusMessage.className = 'status-message success';
                addCourseForm.reset();
                
                // Reload the courses list
                loadFacultyCourses();
                
                // Clear status message after 3 seconds
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status-message';
                }, 3000);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add course');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.className = 'status-message error';
        }
    });
    
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

// Load faculty courses
async function loadFacultyCourses() {
    const token = localStorage.getItem('token');
    const coursesList = document.getElementById('courses-list');
    
    try {
        const response = await fetch('/api/faculty/courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const courses = await response.json();
            
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
                    <td>${course.course_title}</td>
                    <td>${course.semester}</td>
                    <td>${course.credit_hours}</td>
                    <td>${course.enrolled_count || 0}</td>
                </tr>
            `).join('');
            
        } else {
            throw new Error('Failed to load courses');
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        coursesList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Error loading courses. Please try again.</td>
            </tr>
        `;
    }
}