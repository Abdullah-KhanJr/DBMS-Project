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
    const addCourseForm = document.getElementById('add-course-form');
    const sectionDropdown = document.getElementById('section');
    const statusMessage = document.getElementById('status-message');
    
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
    
    // Load available sections
    if (sectionDropdown) {
        try {
            const response = await fetch('http://localhost:5000/api/sections', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch sections');
            }
            
            const sections = await response.json();
            
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.section_id;
                option.textContent = section.name;
                sectionDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
            // Add some default sections in case the API fails
            const defaultSections = ['A', 'B', 'C', 'D', 'F'];
            defaultSections.forEach((section, index) => {
                const option = document.createElement('option');
                option.value = index + 1;  // Use index + 1 as the section_id
                option.textContent = section;
                sectionDropdown.appendChild(option);
            });
        }
    }
    
    // Handle course form submission
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const courseData = {
                course_code: document.getElementById('course_code').value,
                course_name: document.getElementById('course_name').value,
                credit_hours: parseInt(document.getElementById('credit_hours').value),
                section_id: parseInt(document.getElementById('section').value),
                description: document.getElementById('description').value
            };
            
            try {
                const response = await fetch('http://localhost:5000/api/courses', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(courseData)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to create course');
                }
                
                // Show success message
                statusMessage.innerHTML = `
                    <div class="status-success">
                        <i class="fas fa-check-circle"></i>
                        Course created successfully!
                    </div>
                `;
                
                // Reset the form
                addCourseForm.reset();
                  // Redirect to dashboard page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error creating course:', error);
                statusMessage.innerHTML = `
                    <div class="status-error">
                        <i class="fas fa-times-circle"></i>
                        Error: ${error.message}
                    </div>
                `;
            }
        });
    }
});