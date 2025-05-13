// course-details.js

document.addEventListener('DOMContentLoaded', function() {
    // Get course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    if (!courseId) {
        document.getElementById('course-title').textContent = 'Course Not Found';
        document.getElementById('attendance-summary').innerHTML = '<div class="error-state">Invalid course ID.</div>';
        return;
    }

    // Get token and user info
    const token = localStorage.getItem('token');
    let userData = null;
    try {
        userData = JSON.parse(localStorage.getItem('userData'));
    } catch (e) {}
    const registrationNumber = userData?.registrationNumber || userData?.registration_number;
    const studentName = userData?.name || 'Student';
    if (document.getElementById('student-name')) document.getElementById('student-name').textContent = studentName;

    // Fetch course info and attendance
    loadCourseDetails(courseId, registrationNumber);

    // Add back button
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-primary';
        backBtn.style.marginBottom = '1rem';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
        backBtn.onclick = () => window.history.back();
        dashboardContent.insertBefore(backBtn, dashboardContent.firstChild);
    }
});

async function loadCourseDetails(courseId, registrationNumber) {
    const courseTitleElem = document.getElementById('course-title');
    const courseCodeElem = document.getElementById('course-code');
    const instructorNameElem = document.getElementById('instructor-name');
    const totalSessionsElem = document.getElementById('total-sessions');
    const attendanceSummaryElem = document.getElementById('attendance-summary');
    const sessionTableElem = document.getElementById('session-table');
    const token = localStorage.getItem('token');

    // Fetch course info (from student courses endpoint)
    let courseInfo = null;
    try {
        const response = await fetch(`/api/student/courses/${registrationNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            courseInfo = (data.courses || []).find(c => String(c.course_id) === String(courseId));
        }
    } catch (e) {}
    if (!courseInfo) {
        courseTitleElem.textContent = 'Course Not Found';
        attendanceSummaryElem.innerHTML = '<div class="error-state">Course not found or you are not enrolled.</div>';
        return;
    }
    courseTitleElem.textContent = courseInfo.course_title;
    courseCodeElem.textContent = courseInfo.course_code;
    instructorNameElem.innerHTML = `<i class='fas fa-chalkboard-teacher'></i> ${courseInfo.instructor_name || 'N/A'}`;

    // Fetch sessions and attendance for this student in this course
    try {
        // Get all sessions and attendance for this course
        const sessionsRes = await fetch(`/api/faculty/attendance/matrix?course_id=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sessionsData = await sessionsRes.json();
        const sessions = sessionsData.sessions || [];
        totalSessionsElem.innerHTML = `<i class='fas fa-calendar-check'></i> Sessions: ${sessions.length}`;
        const attendance = sessionsData.attendance || [];

        // Build a map of session_id => status_label for this student
        const studentAttendanceMap = {};
        attendance.forEach(a => {
            if (String(a.registration_number) === String(registrationNumber)) {
                studentAttendanceMap[a.session_id] = a.status_label;
            }
        });

        // Build session table and summary
        let present = 0, absent = 0, leave = 0;
        let sessionRows = '';
        sessions.forEach((session, idx) => {
            const status = studentAttendanceMap[session.session_id] || '-';
            let statusClass = '';
            if (status === 'Present') { statusClass = 'status-present'; present++; }
            else if (status === 'Absent') { statusClass = 'status-absent'; absent++; }
            else if (status === 'Leave') { statusClass = 'status-leave'; leave++; }
            // Format date and time cleanly
            let dateStr = session.session_date;
            if (dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let timeStr = session.session_time ? session.session_time.slice(0,5) : '';
            sessionRows += `<tr><td>Session ${idx + 1}</td><td>${dateStr}${timeStr ? ' ' + timeStr : ''}</td><td><span class="attendance-status-badge ${statusClass}">${status !== '-' ? status : '-'}</span></td></tr>`;
        });
        sessionTableElem.innerHTML = sessionRows || '<tr><td colspan="3">No sessions found.</td></tr>';
        const total = sessions.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
        attendanceSummaryElem.innerHTML = `
            <div class="summary-box" style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem;">
                <span class="summary-badge status-present">Present: ${present}</span>
                <span class="summary-badge status-absent">Absent: ${absent}</span>
                <span class="summary-badge status-leave">Leave: ${leave}</span>
                <span style="min-width: 120px;"><strong>Total Sessions:</strong> ${total}</span>
                <span style="min-width: 140px;"><strong>Attendance %:</strong> ${percentage}%</span>
            </div>
        `;
        // Add spacing to meta badges
        document.getElementById('course-code').style.marginRight = '1.5rem';
        document.getElementById('instructor-name').style.marginRight = '1.5rem';
    } catch (error) {
        attendanceSummaryElem.innerHTML = `<div class="error-state">Error loading course details: ${error.message}</div>`;
        sessionTableElem.innerHTML = '<tr><td colspan="3">Error loading sessions.</td></tr>';
    }
} 