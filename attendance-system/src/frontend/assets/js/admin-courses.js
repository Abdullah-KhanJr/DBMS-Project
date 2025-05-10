document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin courses list loaded');
    
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle profile dropdown
    const profileIcon = document.querySelector('.profile-icon');
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
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    
    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Display user information
    const adminName = document.getElementById('admin-name');
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name) {
            if (adminName) adminName.textContent = userData.name;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
    }
    
    // Load all courses
    loadAllCourses();
});

function loadAllCourses() {
    const courseList = document.getElementById('all-courses');
    if (!courseList) return;
    
    // Mock data - this would typically come from an API call
    const courses = [
        {
            id: 'CS101',
            name: 'Introduction to Programming',
            section: 'A',
            instructor: 'Dr. Jane Smith',
            students: 32
        },
        {
            id: 'CS232',
            name: 'Database Management Systems',
            section: 'B',
            instructor: 'Prof. Robert Johnson',
            students: 28
        },
        {
            id: 'MATH205',
            name: 'Discrete Mathematics',
            section: 'A',
            instructor: 'Dr. Emily Chen',
            students: 25
        },
        {
            id: 'CS360',
            name: 'Software Engineering',
            section: 'C',
            instructor: 'Dr. Michael Brown',
            students: 24
        },
        {
            id: 'CS401',
            name: 'Artificial Intelligence',
            section: 'A',
            instructor: 'Dr. Sarah Wilson',
            students: 30
        },
        {
            id: 'PHY101',
            name: 'Physics Fundamentals',
            section: 'B',
            instructor: 'Prof. David Anderson',
            students: 35
        },
        {
            id: 'ENG205',
            name: 'Technical Writing',
            section: 'A',
            instructor: 'Dr. Lisa Taylor',
            students: 22
        },
        {
            id: 'MATH101',
            name: 'Calculus I',
            section: 'D',
            instructor: 'Dr. Thomas Clark',
            students: 40
        },
        {
            id: 'CS250',
            name: 'Computer Architecture',
            section: 'B',
            instructor: 'Prof. Angela Martinez',
            students: 26
        },
        {
            id: 'BUS101',
            name: 'Introduction to Business',
            section: 'C',
            instructor: 'Dr. Mark Roberts',
            students: 45
        },
        {
            id: 'CHEM101',
            name: 'Chemistry Fundamentals',
            section: 'A',
            instructor: 'Dr. Patricia Lee',
            students: 38
        },
        {
            id: 'STAT200',
            name: 'Statistics for Engineers',
            section: 'B',
            instructor: 'Prof. James White',
            students: 29
        }
    ];
    
    courseList.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-header">
                <h3>${course.name}</h3>
                <span class="course-code">${course.id}</span>
            </div>
            <div class="course-info">
                <p><i class="fas fa-chalkboard-teacher"></i> ${course.instructor}</p>
                <p><i class="fas fa-users"></i> ${course.students} Students</p>
                <p><i class="fas fa-layer-group"></i> Section ${course.section}</p>
            </div>
            <div class="course-actions">
                <a href="attendance-management.html?course=${course.id}" class="btn-small">View Attendance</a>
            </div>
        `;
        
        courseList.appendChild(courseCard);
    });
}