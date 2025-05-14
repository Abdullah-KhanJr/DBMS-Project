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
    // Get registration_number from userData in localStorage
    let userData = null;
    try {
        userData = JSON.parse(localStorage.getItem('userData'));
    } catch (e) {}
    const registrationNumber = userData?.registrationNumber || userData?.registration_number;
    if (!registrationNumber) {
        attendanceHistory.innerHTML = '<tr><td colspan="6">Could not determine student registration number.</td></tr>';
        return;
    }
    const token = localStorage.getItem('token');
    try {
        // Fetch all courses for the student
        const coursesRes = await fetch(`/api/student/courses/${registrationNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();
        const courses = coursesData.courses || [];
        let allRecords = [];
        // For each course, fetch the matrix and collect attendance records for this student
        await Promise.all(courses.map(async (course) => {
            const matrixRes = await fetch(`/api/faculty/attendance/matrix?course_id=${course.course_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const matrixData = await matrixRes.json();
            const sessions = matrixData.sessions || [];
            const attendance = matrixData.attendance || [];
            sessions.forEach((session, idx) => {
                const record = attendance.find(a => String(a.registration_number) === String(registrationNumber) && String(a.session_id) === String(session.session_id));
                if (record) {
                    allRecords.push({
                        course_code: course.course_code,
                        section: course.section || 'N/A',
                        session: `Session ${idx + 1}`,
                        date: session.session_date && session.session_date.includes('T') ? session.session_date.split('T')[0] : session.session_date,
                        time: session.session_time ? session.session_time.slice(0,5) : '',
                        status_label: record.status_label
                    });
                }
            });
        }));
        // Sort by date+time descending
        allRecords.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
        });
        const last10 = allRecords.slice(0, 10);
        let historyHTML = '';
        last10.forEach(record => {
            let statusClass = '';
            switch(record.status_label) {
                case 'Present': statusClass = 'status-present'; break;
                case 'Late': statusClass = 'status-late'; break;
                case 'Absent': statusClass = 'status-absent'; break;
                case 'Leave': statusClass = 'status-leave'; break;
            }
            historyHTML += `
                <tr>
                    <td>${record.course_code}</td>
                    <td>${record.section}</td>
                    <td>${record.session}</td>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td><span class="attendance-status-badge ${statusClass}">${record.status_label}</span></td>
                </tr>
            `;
        });
        if (!historyHTML) historyHTML = '<tr><td colspan="6">No attendance records found.</td></tr>';
        attendanceHistory.innerHTML = historyHTML;
    } catch (error) {
        attendanceHistory.innerHTML = `<tr><td colspan="6">Error loading attendance history: ${error.message}</td></tr>`;
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