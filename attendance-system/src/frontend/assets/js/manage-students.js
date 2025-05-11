document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isAuthenticated() || getUserRole() !== 'faculty') {
        window.location.href = '/src/frontend/pages/login.html';
        return;
    }

    const courseId = new URLSearchParams(window.location.search).get('id');
    if (!courseId) {
        showError('Course ID is missing');
        return;
    }

    // Initialize datepicker
    flatpickr('#attendance-date', {
        dateFormat: 'Y-m-d',
        defaultDate: 'today',
        maxDate: 'today'
    });

    // Load course details and students
    loadCourseDetails(courseId);
    loadAttendanceStatuses();
    
    // Set up attendance form submission
    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveAttendance(courseId);
        });
    }

    // Load students when date changes
    document.getElementById('attendance-date').addEventListener('change', function() {
        loadStudentsForAttendance(courseId, this.value);
    });

    // Load students with today's date initially
    const today = new Date().toISOString().split('T')[0];
    loadStudentsForAttendance(courseId, today);
});

function loadCourseDetails(courseId) {
    fetch(`/api/faculty/courses/${courseId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load course details');
            return response.json();
        })
        .then(data => {
            document.getElementById('course-title').textContent = data.course_name;
            document.getElementById('course-code').textContent = data.course_code;
            document.getElementById('course-section').textContent = data.section_name;
        })
        .catch(error => {
            showError('Error loading course details: ' + error.message);
        });
}

function loadAttendanceStatuses() {
    fetch('/api/attendance/statuses')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load attendance statuses');
            return response.json();
        })
        .then(statuses => {
            // Store statuses globally for later use
            window.attendanceStatuses = statuses;
        })
        .catch(error => {
            showError('Error loading attendance statuses: ' + error.message);
        });
}

function loadStudentsForAttendance(courseId, date) {
    fetch(`/api/faculty/courses/${courseId}/students`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load students');
            return response.json();
        })
        .then(students => {
            // Now get any existing attendance data for this date
            return fetch(`/api/faculty/courses/${courseId}/attendance?date=${date}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load attendance records');
                    return response.json();
                })
                .then(attendanceData => {
                    renderAttendanceTable(students, attendanceData);
                });
        })
        .catch(error => {
            showError('Error: ' + error.message);
        });
}

function renderAttendanceTable(students, existingAttendance) {
    const tbody = document.getElementById('attendance-table-body');
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">No students enrolled in this course</td>';
        tbody.appendChild(tr);
        return;
    }

    // Create a map of student IDs to attendance records
    const attendanceMap = {};
    existingAttendance.forEach(record => {
        attendanceMap[record.student_id] = record;
    });

    students.forEach((student, index) => {
        const existingRecord = attendanceMap[student.student_id];
        const statusId = existingRecord ? existingRecord.status_id : '';
        const remarks = existingRecord ? existingRecord.remarks || '' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.registration_number}</td>
            <td>${student.student_name}</td>
            <td>
                <select class="form-select status-select" name="status_${student.student_id}" required>
                    <option value="">Select status</option>
                    ${window.attendanceStatuses.map(status => 
                        `<option value="${status.status_id}" ${statusId == status.status_id ? 'selected' : ''}>${status.label}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <input type="text" class="form-control remarks-input" name="remarks_${student.student_id}" 
                       value="${remarks}" placeholder="Optional remarks">
                <input type="hidden" name="student_id_${student.student_id}" value="${student.student_id}">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveAttendance(courseId) {
    const date = document.getElementById('attendance-date').value;
    const students = [];
    
    // Collect attendance data from the form
    document.querySelectorAll('#attendance-table-body tr').forEach(row => {
        const studentIdInput = row.querySelector('input[name^="student_id_"]');
        if (!studentIdInput) return;
        
        const studentId = studentIdInput.value;
        const statusSelect = row.querySelector(`select[name="status_${studentId}"]`);
        const remarksInput = row.querySelector(`input[name="remarks_${studentId}"]`);
        
        if (statusSelect && statusSelect.value) {
            students.push({
                student_id: studentId,
                status_id: statusSelect.value,
                remarks: remarksInput ? remarksInput.value : ''
            });
        }
    });

    // Submit attendance data
    fetch(`/api/faculty/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            date: date,
            attendance: students
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Failed to save attendance') });
        }
        return response.json();
    })
    .then(data => {
        showSuccess('Attendance saved successfully');
    })
    .catch(error => {
        showError('Error saving attendance: ' + error.message);
    });
}

function showError(message) {
    const alertBox = document.getElementById('alert-box');
    alertBox.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function showSuccess(message) {
    const alertBox = document.getElementById('alert-box');
    alertBox.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}