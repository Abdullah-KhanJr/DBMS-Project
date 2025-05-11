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

    // Initialize datepicker for filter
    flatpickr('#filter-date', {
        dateFormat: 'Y-m-d',
        maxDate: 'today'
    });

    // Load course details
    loadCourseDetails(courseId);
    
    // Load attendance records
    loadAttendanceRecords(courseId);

    // Set up date filter
    document.getElementById('filter-date').addEventListener('change', function() {
        loadAttendanceRecords(courseId, this.value);
    });

    // Set up clear filter button
    document.getElementById('clear-filter').addEventListener('click', function() {
        document.getElementById('filter-date').value = '';
        loadAttendanceRecords(courseId);
    });
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

function loadAttendanceRecords(courseId, date = null) {
    let url = `/api/faculty/courses/${courseId}/attendance`;
    if (date) {
        url += `?date=${date}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load attendance records');
            return response.json();
        })
        .then(records => {
            renderAttendanceRecords(records);
        })
        .catch(error => {
            showError('Error loading attendance records: ' + error.message);
        });
}

function renderAttendanceRecords(records) {
    const tbody = document.getElementById('attendance-records-body');
    tbody.innerHTML = '';
    
    if (records.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">No attendance records found</td>';
        tbody.appendChild(tr);
        return;
    }

    // Group records by date
    const recordsByDate = {};
    records.forEach(record => {
        const date = new Date(record.date).toLocaleDateString();
        if (!recordsByDate[date]) {
            recordsByDate[date] = [];
        }
        recordsByDate[date].push(record);
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

    // Render records grouped by date
    sortedDates.forEach(date => {
        // Create date header row
        const dateRow = document.createElement('tr');
        dateRow.classList.add('table-secondary');
        dateRow.innerHTML = `
            <td colspan="5" class="fw-bold">${date}</td>
        `;
        tbody.appendChild(dateRow);

        // Add student records for this date
        recordsByDate[date].forEach((record, index) => {
            const statusClass = getStatusClass(record.status);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.registration_number}</td>
                <td>${record.student_name}</td>
                <td><span class="badge ${statusClass}">${record.status}</span></td>
                <td>${record.remarks || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'present':
            return 'bg-success';
        case 'absent':
            return 'bg-danger';
        case 'late':
            return 'bg-warning';
        case 'leave':
            return 'bg-info';
        default:
            return 'bg-secondary';
    }
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