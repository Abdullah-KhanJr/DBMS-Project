document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '../login.html';
        return;
    }

    // Get DOM elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const profileIcon = document.querySelector('.profile-icon');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    const studentName = document.getElementById('student-name');
    const scanButton = document.getElementById('scan-button');
    const attendanceStatus = document.getElementById('attendance-status');
    const attendanceHistory = document.getElementById('attendance-history');
    const modal = document.getElementById('camera-modal');
    const closeModal = document.querySelector('.modal-close');
    
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
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Set student name (fetch from backend or localStorage)
    async function displayStudentName() {
        const studentNameElements = [document.getElementById('student-name')].filter(Boolean);
        const token = localStorage.getItem('token');
        let userData = null;
        try {
            userData = JSON.parse(localStorage.getItem('userData'));
        } catch (error) {
            console.error('Error parsing userData from localStorage:', error);
        }
        if (userData && userData.name) {
            studentNameElements.forEach(e => e.textContent = userData.name);
            return;
        }
        if (token) {
            try {
                const response = await fetch('/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (userData) {
                        userData.name = data.name;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } else {
                        localStorage.setItem('userData', JSON.stringify({ name: data.name, id: data.id }));
                    }
                    studentNameElements.forEach(e => e.textContent = data.name);
                    return;
                }
            } catch (error) {
                console.error('Error fetching student profile:', error);
            }
        }
        studentNameElements.forEach(e => e.textContent = 'Student');
    }
    displayStudentName();
    
    // Load attendance history
    loadAttendanceHistory();
});

// Load attendance history
async function loadAttendanceHistory() {
    const attendanceHistory = document.getElementById('attendance-history');
    if (!attendanceHistory) return;
    // Get studentId from userData in localStorage
    let userData = null;
    try {
        userData = JSON.parse(localStorage.getItem('userData'));
    } catch (e) {}
    const studentId = userData?.userId || userData?.user_id;
    if (!studentId) {
        attendanceHistory.innerHTML = '<tr><td colspan="4">Could not determine student ID.</td></tr>';
        return;
    }
    try {
        const response = await fetch(`/api/attendance/records/${studentId}`);
        const records = await response.json();
        const last10 = (records || []).slice(0, 10);
        let historyHTML = '';
        last10.forEach(record => {
            let statusClass = '';
            switch(record.status_label || record.status) {
                case 'Present': statusClass = 'status-present'; break;
                case 'Late': statusClass = 'status-late'; break;
                case 'Absent': statusClass = 'status-absent'; break;
                case 'Leave': statusClass = 'status-leave'; break;
            }
            historyHTML += `
                <tr>
                    <td>${record.course_title || record.course_id || ''}</td>
                    <td>${record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : ''}</td>
                    <td>${record.attendance_time ? record.attendance_time.slice(0,5) : ''}</td>
                    <td><span class="attendance-status-badge ${statusClass}">${record.status_label || record.status}</span></td>
                </tr>
            `;
        });
        if (!historyHTML) historyHTML = '<tr><td colspan="4">No attendance records found.</td></tr>';
        attendanceHistory.innerHTML = historyHTML;
    } catch (error) {
        attendanceHistory.innerHTML = `<tr><td colspan="4">Error loading attendance history: ${error.message}</td></tr>`;
    }
}

// Add new attendance record to history
function addAttendanceToHistory(record) {
    const attendanceHistory = document.getElementById('attendance-history');
    if (!attendanceHistory) return;
    
    let statusClass = '';
    switch(record.status) {
        case 'Present':
            statusClass = 'status-present';
            break;
        case 'Late':
            statusClass = 'status-late';
            break;
        case 'Absent':
            statusClass = 'status-absent';
            break;
    }
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${record.course}</td>
        <td>${record.date}</td>
        <td>${record.time}</td>
        <td><span class="attendance-status-badge ${statusClass}">${record.status}</span></td>
    `;
    
    // Add with animation
    newRow.style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
    attendanceHistory.insertBefore(newRow, attendanceHistory.firstChild);
    
    // Reset background color after animation
    setTimeout(() => {
        newRow.style.backgroundColor = '';
    }, 3000);
}