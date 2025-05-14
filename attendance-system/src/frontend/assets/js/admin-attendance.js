document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin attendance management loaded');
    
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
    
    // Check URL for course parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    if (courseParam) {
        document.getElementById('course-filter').value = courseParam;
        loadAttendanceRecords(true);
    } else {
        // Load attendance data
        loadAttendanceRecords();
    }
    
    // Set up filter button
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            loadAttendanceRecords(true); // Pass true to indicate filtering
        });
    }
    
    // Set up modal functionality
    const modal = document.getElementById('edit-attendance-modal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Set up save attendance changes button
    const saveAttendanceBtn = document.getElementById('save-attendance-changes');
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', saveAttendanceChanges);
    }
    
    // Set up event delegation for edit buttons
    const attendanceRecordsTable = document.getElementById('attendance-records');
    if (attendanceRecordsTable) {
        attendanceRecordsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-small') && e.target.textContent === 'Edit') {
                e.preventDefault();
                const recordId = e.target.getAttribute('data-id');
                openEditModal(recordId);
            }
        });
    }
    
    loadAdminAttendanceRecords();
});

async function loadAdminAttendanceRecords() {
    const filterDropdown = document.getElementById('course-filter');
    const recordsTable = document.getElementById('attendance-records');
    const token = localStorage.getItem('token');
    // 1. Populate filter dropdown
    let courses = [];
    try {
        const coursesRes = await fetch('/api/admin/courses', { headers: { 'Authorization': `Bearer ${token}` } });
        const coursesData = await coursesRes.json();
        courses = coursesData.courses || [];
        if (filterDropdown) {
            filterDropdown.innerHTML = '<option value="">All Courses</option>';
            courses.forEach(c => {
                filterDropdown.innerHTML += `<option value="${c.course_id}">${c.course_code} - ${c.course_title} (Section: ${c.section || 'N/A'})</option>`;
            });
        }
    } catch (e) {}

    // 2. Show recent 10 sessions by default
    if (!filterDropdown.value) {
        const recentRes = await fetch('/api/admin/attendance/recent', { headers: { 'Authorization': `Bearer ${token}` } });
        const recentData = await recentRes.json();
        renderAttendanceRecords(recentData.sessions || [], recordsTable, courses);
    }

    // 3. On filter change, show all sessions for that course
    if (filterDropdown) {
        filterDropdown.onchange = async function() {
            if (!filterDropdown.value) {
                const recentRes = await fetch('/api/admin/attendance/recent', { headers: { 'Authorization': `Bearer ${token}` } });
                const recentData = await recentRes.json();
                renderAttendanceRecords(recentData.sessions || [], recordsTable, courses);
            } else {
                const sessionsRes = await fetch(`/api/admin/attendance/sessions?course_id=${filterDropdown.value}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const sessionsData = await sessionsRes.json();
                renderAttendanceRecords(sessionsData.sessions || [], recordsTable, courses, filterDropdown.value);
            }
        };
    }
}

function renderAttendanceRecords(sessions, tableElem, courses, courseId) {
    if (!tableElem) return;
    let html = '';
    html += `<tr><th>Date</th><th>Course</th><th>Instructor</th><th>Present</th><th>Absent</th><th>Leave</th><th>Actions</th></tr>`;
    if (!sessions.length) {
        html += '<tr><td colspan="7">No attendance records found.</td></tr>';
    } else {
        sessions.forEach(session => {
            const course = courses.find(c => c.course_code === session.course_code && (!courseId || c.course_id == courseId));
            html += `<tr>
                <td>${formatDate(session.session_date)} ${session.session_time ? session.session_time.slice(0,5) : ''}</td>
                <td>${session.course_code} - ${session.course_title}${session.section ? ' (Section: ' + session.section + ')' : ''}</td>
                <td>${session.instructor_name || 'N/A'}</td>
                <td>${session.present || 0}</td>
                <td>${session.absent || 0}</td>
                <td>${session.leave || 0}</td>
                <td><button class="btn-small" onclick="openEditAttendanceModal(${session.session_id}, '${session.course_code}', '${session.course_title}', '${session.session_date}', '${session.instructor_name || ''}')">Edit</button></td>
            </tr>`;
        });
    }
    tableElem.innerHTML = html;
}

window.openEditAttendanceModal = async function(session_id, course_code, course_title, session_date, instructor_name) {
    // Show modal (implement modal HTML in your page if not present)
    let modal = document.getElementById('edit-attendance-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-attendance-modal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><span class="modal-close" onclick="closeEditAttendanceModal()">&times;</span><div class="modal-body"></div></div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `<h2>Edit Attendance</h2><div>Loading...</div>`;
    // Fetch students for this session
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/attendance/session/${session_id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const students = data.students || [];
    // Render form
    let formHtml = `<div><strong>Course:</strong> ${course_code} - ${course_title}</div><div><strong>Date:</strong> ${formatDate(session_date)}</div><div><strong>Instructor:</strong> ${instructor_name}</div><form id="edit-attendance-form"><table style="width:100%;margin-top:1rem;"><tr><th>Student</th><th>Status</th></tr>`;
    students.forEach(s => {
        formHtml += `<tr><td>${s.name}</td><td><select name="status_${s.registration_number}">
            <option value="Present"${s.status_label==='Present'?' selected':''}>Present</option>
            <option value="Leave"${s.status_label==='Leave'?' selected':''}>Leave</option>
            <option value="Absent"${s.status_label==='Absent'?' selected':''}>Absent</option>
            <option value="-"${!s.status_label?' selected':''}>-</option>
        </select></td></tr>`;
    });
    formHtml += `</table><button type="submit" class="btn-primary" style="margin-top:1rem;">Save Changes</button></form>`;
    modalBody.innerHTML = formHtml;
    // Handle form submit
    document.getElementById('edit-attendance-form').onsubmit = async function(e) {
        e.preventDefault();
        const attendance = students.map(s => ({
            registration_number: s.registration_number,
            status_label: this[`status_${s.registration_number}`].value
        }));
        await fetch(`/api/admin/attendance/session/${session_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ attendance })
        });
        closeEditAttendanceModal();
        // Refresh the table
        document.querySelector('#course-filter').dispatchEvent(new Event('change'));
    };
};

window.closeEditAttendanceModal = function() {
    const modal = document.getElementById('edit-attendance-modal');
    if (modal) modal.style.display = 'none';
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function loadAttendanceRecords(filtered = false) {
    const attendanceTable = document.getElementById('attendance-records');
    if (!attendanceTable) return;
    
    // Get filter values if filtered is true
    let courseFilter = '';
    
    if (filtered) {
        courseFilter = document.getElementById('course-filter').value;
        console.log(`Filtering by course: ${courseFilter}`);
    }
    
    // Mock data - this would typically come from an API call
    let attendanceData = [
        {
            id: 1,
            date: '2025-05-09',
            course: 'CS101 - Introduction to Programming',
            course_code: 'CS101',
            instructor: 'Dr. Jane Smith',
            present: 28,
            absent: 4,
            total: 32
        },
        {
            id: 2,
            date: '2025-05-09',
            course: 'CS232 - Database Management',
            course_code: 'CS232',
            instructor: 'Prof. Robert Johnson',
            present: 25,
            absent: 3,
            total: 28
        },
        {
            id: 3,
            date: '2025-05-08',
            course: 'MATH205 - Discrete Mathematics',
            course_code: 'MATH205',
            instructor: 'Dr. Emily Chen',
            present: 18,
            absent: 7,
            total: 25
        },
        {
            id: 4,
            date: '2025-05-08',
            course: 'CS360 - Software Engineering',
            course_code: 'CS360',
            instructor: 'Dr. Michael Brown',
            present: 22,
            absent: 2,
            total: 24
        },
        {
            id: 5,
            date: '2025-05-07',
            course: 'CS101 - Introduction to Programming',
            course_code: 'CS101',
            instructor: 'Dr. Jane Smith',
            present: 30,
            absent: 2,
            total: 32
        },
        {
            id: 6,
            date: '2025-05-07',
            course: 'CS232 - Database Management',
            course_code: 'CS232',
            instructor: 'Prof. Robert Johnson',
            present: 26,
            absent: 2,
            total: 28
        },
        {
            id: 7,
            date: '2025-05-06',
            course: 'MATH205 - Discrete Mathematics',
            course_code: 'MATH205',
            instructor: 'Dr. Emily Chen',
            present: 20,
            absent: 5,
            total: 25
        },
        {
            id: 8,
            date: '2025-05-06',
            course: 'CS360 - Software Engineering',
            course_code: 'CS360',
            instructor: 'Dr. Michael Brown',
            present: 21,
            absent: 3,
            total: 24
        }
    ];
    
    // Apply course filter if needed
    if (filtered && courseFilter) {
        attendanceData = attendanceData.filter(record => record.course_code === courseFilter);
    }
    
    attendanceTable.innerHTML = '';
    
    if (attendanceData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No attendance records found</td>
        `;
        attendanceTable.appendChild(emptyRow);
        return;
    }
    
    attendanceData.forEach(record => {
        const percentage = (record.present / record.total * 100).toFixed(1);
        let statusClass = percentage >= 90 ? 'status-present' : 
                         percentage >= 80 ? 'status-late' : 
                         'status-absent';
                         
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.course}</td>
            <td>${record.instructor}</td>
            <td>${record.present}</td>
            <td>${record.absent}</td>
            <td><span class="attendance-status-badge ${statusClass}">${percentage}%</span></td>
            <td>
                <a href="#" class="btn-small" data-id="${record.id}">Edit</a>
            </td>
        `;
        
        attendanceTable.appendChild(row);
    });
}

function openEditModal(recordId) {
    console.log(`Opening edit modal for record ID: ${recordId}`);
    
    // In a real app, you would fetch the attendance record details from the server
    // For now, we'll use mock data
    const attendanceRecord = {
        id: recordId,
        course: 'CS101 - Introduction to Programming',
        date: '2025-05-09',
        instructor: 'Dr. Jane Smith',
        students: [
            { id: 1, name: 'John Doe', status: 'present' },
            { id: 2, name: 'Jane Smith', status: 'present' },
            { id: 3, name: 'Michael Johnson', status: 'absent' },
            { id: 4, name: 'Emily Chen', status: 'present' },
            { id: 5, name: 'David Wilson', status: 'late' },
            { id: 6, name: 'Sarah Brown', status: 'present' },
            { id: 7, name: 'James Miller', status: 'present' },
            { id: 8, name: 'Olivia Davis', status: 'absent' }
        ]
    };
    
    // Update modal content
    document.getElementById('edit-course-name').textContent = attendanceRecord.course;
    document.getElementById('edit-date').textContent = formatDate(attendanceRecord.date);
    document.getElementById('edit-instructor').textContent = attendanceRecord.instructor;
    
    // Populate student list
    const studentList = document.getElementById('student-attendance-list');
    studentList.innerHTML = '';
    
    attendanceRecord.students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>
                <select class="form-control student-status" data-student-id="${student.id}">
                    <option value="present" ${student.status === 'present' ? 'selected' : ''}>Present</option>
                    <option value="late" ${student.status === 'late' ? 'selected' : ''}>Late</option>
                    <option value="absent" ${student.status === 'absent' ? 'selected' : ''}>Absent</option>
                </select>
            </td>
            <td>
                <button class="btn-small" onclick="toggleStudentStatus(${student.id})">Toggle</button>
            </td>
        `;
        studentList.appendChild(row);
    });
    
    // Show the modal
    const modal = document.getElementById('edit-attendance-modal');
    modal.classList.add('active');
}

function saveAttendanceChanges() {
    // Get all student attendance status values
    const statusSelects = document.querySelectorAll('.student-status');
    const updatedAttendance = [];
    
    statusSelects.forEach(select => {
        updatedAttendance.push({
            studentId: select.getAttribute('data-student-id'),
            status: select.value
        });
    });
    
    console.log('Updated attendance:', updatedAttendance);
    
    // In a real app, you would send this data to the server
    // For now, just show a success message
    alert('Attendance updated successfully!');
    
    // Close the modal
    const modal = document.getElementById('edit-attendance-modal');
    modal.classList.remove('active');
    
    // Refresh the attendance records
    loadAttendanceRecords();
}

// Helper function to toggle student status (Present → Late → Absent → Present)
function toggleStudentStatus(studentId) {
    const select = document.querySelector(`.student-status[data-student-id="${studentId}"]`);
    
    if (select) {
        const currentValue = select.value;
        let newValue;
        
        switch (currentValue) {
            case 'present':
                newValue = 'late';
                break;
            case 'late':
                newValue = 'absent';
                break;
            case 'absent':
                newValue = 'present';
                break;
            default:
                newValue = 'present';
        }
        
        select.value = newValue;
    }
}