// filepath: d:\DBMS Project\attendance-system\src\frontend\assets\js\faculty-attendance-records.js
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    // DOM elements
    const courseAttendanceSummary = document.getElementById("course-attendance-summary");
    const studentAttendanceSection = document.getElementById("student-attendance-section");
    const studentAttendanceList = document.getElementById("student-attendance-list");
    const selectedCourseTitle = document.getElementById("selected-course-title");
    const backToSummaryBtn = document.getElementById("back-to-summary");
    const statusFilter = document.getElementById("status-filter");
    const exportCsvBtn = document.getElementById("export-csv");
    const studentDetailModal = document.getElementById("student-detail-modal");
    const modalClose = document.querySelector(".modal-close");
    
    // Initialize sidebar toggle
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function() {
            sidebar.classList.toggle("active");
        });
    }
    
    // Display faculty name in header
    displayFacultyName();

    // Load course cards
    loadCourseCards();
    
    // Event listeners
    if (backToSummaryBtn) {
        backToSummaryBtn.addEventListener("click", function() {
            studentAttendanceSection.style.display = "none";
            courseAttendanceSummary.parentElement.style.display = "block";
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener("click", function() {
            studentDetailModal.style.display = "none";
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener("click", function(event) {
        if (event.target === studentDetailModal) {
            studentDetailModal.style.display = "none";
        }
    });
});

// Function to load course cards
async function loadCourseCards() {
    const courseAttendanceSummary = document.getElementById("course-attendance-summary");
    if (!courseAttendanceSummary) return;
    try {
        courseAttendanceSummary.innerHTML = "<div class=\"loading-spinner\">Loading courses...</div>";
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("userData"));
        const facultyId = userData?.facultyId || userData?.faculty_id;
        const response = await fetch(`/api/faculty/courses?faculty_id=${facultyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        const courses = data.courses || [];
        if (courses.length === 0) {
            courseAttendanceSummary.innerHTML = `
                <div class=\"empty-state\">\n                    <div class=\"empty-icon\">\n                        <i class=\"fas fa-book-open\"></i>\n                    </div>\n                    <h3>No Courses Found</h3>\n                    <p>You don't have any courses yet. Add a course to start tracking attendance.</p>\n                    <a href=\"add-course.html\" class=\"btn-primary\">Add Course</a>\n                </div>
            `;
            return;
        }
        // Create course cards
        let cardsHTML = "";
        courses.forEach(course => {
            // Determine color based on attendance rate (optional, can be improved)
            let statusColor = "var(--success-color)";
            cardsHTML += `
                <div class=\"course-card attendance-card\" data-course-id=\"${course.course_id}\">\n                    <div class=\"course-header\">\n                        <h3>${course.course_title}</h3>\n                        <span class=\"course-code\">${course.course_code}</span>\n                    </div>\n                    <div class=\"course-info\">\n                        <p><i class=\"fas fa-users\"></i> Section: ${course.section || 'N/A'}</p>\n                        <p><i class=\"fas fa-clock\"></i> Semester: ${course.semester || ''}</p>\n                    </div>\n                    <div class=\"course-actions\">\n                        <button class=\"btn-primary view-attendance-btn\">\n                            <i class=\"fas fa-clipboard-list\"></i> View Attendance\n                        </button>\n                    </div>\n                </div>\n            `;
        });
        courseAttendanceSummary.innerHTML = cardsHTML;
        // Add click event to the cards
        document.querySelectorAll(".view-attendance-btn").forEach(button => {
            button.addEventListener("click", function() {
                const courseCard = this.closest(".course-card");
                const courseId = courseCard.dataset.courseId;
                const courseName = courseCard.querySelector("h3").textContent;
                showStudentAttendanceList(courseId, courseName);
            });
        });
    } catch (error) {
        console.error("Error loading course cards:", error);
        courseAttendanceSummary.innerHTML = `
            <div class=\"error-state\">\n                <div class=\"error-icon\">\n                    <i class=\"fas fa-exclamation-circle\"></i>\n                </div>\n                <h3>Error Loading Courses</h3>\n                <p>${error.message}</p>\n                <button class=\"btn-primary\" onclick=\"loadCourseCards()\">Retry</button>\n            </div>
        `;
    }
}

// Function to show student attendance matrix for a specific course
async function showStudentAttendanceList(courseId, courseName) {
    const studentAttendanceSection = document.getElementById("student-attendance-section");
    const courseAttendanceSummary = document.getElementById("course-attendance-summary");
    const selectedCourseTitle = document.getElementById("selected-course-title");
    if (!studentAttendanceSection || !courseAttendanceSummary) return;
    // Set course title and ID
    if (selectedCourseTitle) {
        selectedCourseTitle.textContent = courseName;
    }
    studentAttendanceSection.dataset.courseId = courseId;
    // Hide course summary and show student section
    courseAttendanceSummary.parentElement.style.display = "none";
    studentAttendanceSection.style.display = "block";
    // Load student attendance matrix
    loadStudentAttendanceMatrix(courseId);
}

// Function to load student attendance matrix
async function loadStudentAttendanceMatrix(courseId) {
    const studentAttendanceList = document.getElementById("student-attendance-list");
    if (!studentAttendanceList) return;
    try {
        studentAttendanceList.innerHTML = '<tr><td colspan="100" class="text-center">Loading attendance data...</td></tr>';
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/faculty/attendance/matrix?course_id=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const students = data.students || [];
        const sessions = data.sessions || [];
        const attendance = data.attendance || [];
        // Build a map: { registration_number: { session_id: status_label } }
        const attendanceMap = {};
        attendance.forEach(a => {
            if (!attendanceMap[a.registration_number]) attendanceMap[a.registration_number] = {};
            attendanceMap[a.registration_number][a.session_id] = a.status_label;
        });
        // Build table header: Registration No., Name, Present, Absent, Leave, Total, Percentage, then session columns
        let headerHtml = '<tr><th>Registration No.</th><th>Name</th><th>Present</th><th>Absent</th><th>Leave</th><th>Total</th><th>Percentage</th>';
        sessions.forEach((session, idx) => {
            headerHtml += `<th>Session ${idx + 1}</th>`;
        });
        headerHtml += '</tr>';
        // Build table rows
        let rowsHtml = '';
        students.forEach(student => {
            let present = 0, absent = 0, leave = 0;
            let sessionCells = '';
            sessions.forEach(session => {
                const status = attendanceMap[student.registration_number]?.[session.session_id] || '';
                let cell = '';
                if (status === 'Present') { cell = '<span style="color:green;font-weight:bold">P</span>'; present++; }
                else if (status === 'Absent') { cell = '<span style="color:red;font-weight:bold">A</span>'; absent++; }
                else if (status === 'Leave') { cell = '<span style="color:orange;font-weight:bold">L</span>'; leave++; }
                else { cell = '-'; }
                sessionCells += `<td style="text-align:center">${cell}</td>`;
            });
            const total = sessions.length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            rowsHtml += `<tr><td>${student.registration_number}</td><td>${student.name}</td><td>${present}</td><td>${absent}</td><td>${leave}</td><td>${total}</td><td>${percentage}%</td>${sessionCells}</tr>`;
        });
        studentAttendanceList.innerHTML = headerHtml + rowsHtml;
    } catch (error) {
        console.error("Error loading student attendance matrix:", error);
        studentAttendanceList.innerHTML = `<tr><td colspan="100" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

// Function to load student attendance data
async function loadStudentAttendance(courseId) {
    const studentAttendanceList = document.getElementById("student-attendance-list");
    if (!studentAttendanceList) return;
    try {
        studentAttendanceList.innerHTML = "<tr><td colspan=\"8\" class=\"text-center\">Loading attendance data...</td></tr>";
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/faculty/attendance/records?course_id=${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        const records = data.records || [];
        if (records.length === 0) {
            studentAttendanceList.innerHTML = `
                <tr>
                    <td colspan=\"8\" class=\"text-center\">No students enrolled in this course.</td>
                </tr>
            `;
            return;
        }
        // Generate table rows for all students (no filter)
        let rowsHTML = "";
        records.forEach(student => {
            const totalSessions = student.presentCount + student.absentCount + student.leaveCount;
            const attendancePercentage = totalSessions > 0 ? (student.presentCount / totalSessions * 100).toFixed(1) : 0;
            let statusClass = attendancePercentage >= 75 ? "status-good" : 
                             attendancePercentage >= 60 ? "status-warning" : 
                             "status-critical";
            rowsHTML += `
                <tr>
                    <td>${student.regNumber}</td>
                    <td>${student.name}</td>
                    <td>${student.presentCount}</td>
                    <td>${student.absentCount}</td>
                    <td>${student.leaveCount}</td>
                    <td>${totalSessions}</td>
                    <td><span class="${statusClass}">${attendancePercentage}%</span></td>
                    <td>
                        <button class="btn-icon view-detail-btn" data-student-id="${student.id}" data-reg-number="${student.regNumber}" data-name="${student.name}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        studentAttendanceList.innerHTML = rowsHTML;
        // Add click event to view detail buttons
        document.querySelectorAll(".view-detail-btn").forEach(button => {
            button.addEventListener("click", function() {
                const studentId = this.dataset.studentId;
                const studentName = this.dataset.name;
                const regNumber = this.dataset.regNumber;
                const courseId = document.getElementById("student-attendance-section").dataset.courseId;
                const courseName = document.getElementById("selected-course-title").textContent;
                showStudentDetail(courseId, courseName, studentId, studentName, regNumber);
            });
        });
    } catch (error) {
        console.error("Error loading student attendance:", error);
        studentAttendanceList.innerHTML = `
            <tr>
                <td colspan=\"8\" class=\"text-center text-danger\">Error: ${error.message}</td>
            </tr>
        `;
    }
}

// Function to show student detail modal
async function showStudentDetail(courseId, courseName, studentId, studentName, regNumber) {
    const studentDetailModal = document.getElementById("student-detail-modal");
    const detailTitle = document.getElementById("student-detail-title");
    const detailRegNumber = document.getElementById("detail-reg-number");
    const detailName = document.getElementById("detail-name");
    const detailCourse = document.getElementById("detail-course");
    const detailPresentCount = document.getElementById("detail-present-count");
    const detailAbsentCount = document.getElementById("detail-absent-count");
    const detailLeaveCount = document.getElementById("detail-leave-count");
    const detailPercentage = document.getElementById("detail-percentage");
    const studentSessionList = document.getElementById("student-session-list");
    
    if (!studentDetailModal) return;
    
    try {
        // Set basic student info
        if (detailTitle) detailTitle.textContent = `${studentName}'s Attendance Detail`;
        if (detailRegNumber) detailRegNumber.textContent = regNumber;
        if (detailName) detailName.textContent = studentName;
        if (detailCourse) detailCourse.textContent = courseName;
        
        // Show loading in session list
        if (studentSessionList) {
            studentSessionList.innerHTML = "<tr><td colspan=\"3\" class=\"text-center\">Loading session data...</td></tr>";
        }
        
        // Display the modal
        studentDetailModal.style.display = "block";
        
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/faculty/attendance/records?course_id=${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        const records = data.records || [];
        
        // Update attendance summary
        if (detailPresentCount) detailPresentCount.textContent = records.reduce((total, student) => total + student.presentCount, 0);
        if (detailAbsentCount) detailAbsentCount.textContent = records.reduce((total, student) => total + student.absentCount, 0);
        if (detailLeaveCount) detailLeaveCount.textContent = records.reduce((total, student) => total + student.leaveCount, 0);
        
        const totalSessions = records.reduce((total, student) => total + (student.presentCount + student.absentCount + student.leaveCount), 0);
        const attendancePercentage = totalSessions > 0 ? ((records.reduce((total, student) => total + student.presentCount, 0) / totalSessions) * 100).toFixed(1) : 0;
        
        if (detailPercentage) {
            const statusClass = attendancePercentage >= 75 ? "text-success" : 
                               attendancePercentage >= 60 ? "text-warning" : 
                               "text-danger";
            detailPercentage.className = statusClass;
            detailPercentage.textContent = `${attendancePercentage}%`;
        }
        
        // Generate session table rows
        if (studentSessionList) {
            if (records.length === 0) {
                studentSessionList.innerHTML = "<tr><td colspan=\"3\" class=\"text-center\">No attendance records found.</td></tr>";
            } else {
                let sessionRowsHTML = "";
                records.forEach(student => {
                    const sessionDate = new Date(student.date).toLocaleDateString();
                    const statusClass = student.status === "present" ? "status-present" : 
                                       student.status === "absent" ? "status-absent" : 
                                       "status-leave";
                    
                    sessionRowsHTML += `
                        <tr>
                            <td>${sessionDate}</td>
                            <td><span class="${statusClass}">${student.status.toUpperCase()}</span></td>
                            <td>${student.remarks || "No remarks"}</td>
                        </tr>
                    `;
                });
                studentSessionList.innerHTML = sessionRowsHTML;
            }
        }
        
    } catch (error) {
        console.error("Error loading student detail:", error);
        if (studentSessionList) {
            studentSessionList.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">Error: ${error.message}</td>
                </tr>
            `;
        }
    }
}

// Function to export attendance data to CSV
function exportAttendanceData(courseId) {
    const courseName = document.getElementById("selected-course-title").textContent;
    const statusFilter = document.getElementById("status-filter").value;
    
    // Mock export functionality
    alert(`Exporting attendance data for ${courseName} with filter: ${statusFilter}`);
}

// Utility function for showing errors
function showError(message) {
    console.error(message);
    alert(message);
}
