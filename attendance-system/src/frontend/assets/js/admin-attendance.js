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
});

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

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}