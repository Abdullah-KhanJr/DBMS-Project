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
    
    if (statusFilter) {
        statusFilter.addEventListener("change", function() {
            const courseId = studentAttendanceSection.dataset.courseId;
            if (courseId) {
                loadStudentAttendance(courseId, this.value);
            }
        });
    }
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", function() {
            const courseId = studentAttendanceSection.dataset.courseId;
            if (courseId) {
                exportAttendanceData(courseId);
            }
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
        
        // For demo purposes, we'll create mock data
        // In a real app, you would fetch this from an API
        const courses = [
            {
                id: "CS101",
                name: "Introduction to Programming",
                code: "CS101",
                studentCount: 35,
                attendanceRate: 92,
                presentCount: 320,
                absentCount: 30,
                totalSessions: 10
            },
            {
                id: "CS102",
                name: "Data Structures",
                code: "CS102",
                studentCount: 28,
                attendanceRate: 86,
                presentCount: 240,
                absentCount: 40,
                totalSessions: 8
            },
            {
                id: "CS232",
                name: "Database Management Systems",
                code: "CS232",
                studentCount: 32,
                attendanceRate: 78,
                presentCount: 250,
                absentCount: 70,
                totalSessions: 9
            },
            {
                id: "MT101",
                name: "Calculus",
                code: "MT101",
                studentCount: 40,
                attendanceRate: 94,
                presentCount: 380,
                absentCount: 20,
                totalSessions: 10
            }
        ];
        
        if (courses.length === 0) {
            courseAttendanceSummary.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <h3>No Courses Found</h3>
                    <p>You don't have any courses yet. Add a course to start tracking attendance.</p>
                    <a href="add-course.html" class="btn-primary">Add Course</a>
                </div>
            `;
            return;
        }
        
        // Create course cards
        let cardsHTML = "";
        courses.forEach(course => {
            // Determine color based on attendance rate
            let statusColor = course.attendanceRate >= 90 ? "var(--success-color)" : 
                             course.attendanceRate >= 80 ? "var(--warning-color)" : 
                             "var(--danger-color)";
            
            cardsHTML += `
                <div class="course-card attendance-card" data-course-id="${course.id}">
                    <div class="course-header">
                        <h3>${course.name}</h3>
                        <span class="course-code">${course.code}</span>
                    </div>
                    <div class="course-info">
                        <p><i class="fas fa-users"></i> ${course.studentCount} Students</p>
                        <p><i class="fas fa-calendar-check"></i> ${course.totalSessions} Sessions</p>
                    </div>
                    <div class="course-attendance">
                        <div class="attendance-bar">
                            <div class="attendance-progress" style="width: ${course.attendanceRate}%; background-color: ${statusColor};"></div>
                        </div>
                        <span>${course.attendanceRate}% Average Attendance</span>
                    </div>
                    <div class="attendance-counts">
                        <div class="count-item present">
                            <span class="count-value">${course.presentCount}</span>
                            <span class="count-label">Present</span>
                        </div>
                        <div class="count-item absent">
                            <span class="count-value">${course.absentCount}</span>
                            <span class="count-label">Absent</span>
                        </div>
                        <div class="count-item total">
                            <span class="count-value">${course.totalSessions}</span>
                            <span class="count-label">Sessions</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="btn-primary view-attendance-btn">
                            <i class="fas fa-clipboard-list"></i> View Attendance
                        </button>
                    </div>
                </div>
            `;
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
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Error Loading Courses</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="loadCourseCards()">Retry</button>
            </div>
        `;
    }
}

// Function to show student attendance list for a specific course
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
    
    // Load student attendance data
    loadStudentAttendance(courseId);
}

// Function to load student attendance data
async function loadStudentAttendance(courseId, statusFilter = "all") {
    const studentAttendanceList = document.getElementById("student-attendance-list");
    if (!studentAttendanceList) return;
    
    try {
        studentAttendanceList.innerHTML = "<tr><td colspan=\"8\" class=\"text-center\">Loading attendance data...</td></tr>";
        
        // For demo purposes, we'll use mock data
        // In a real app, you would fetch this from an API
        const students = [
            {
                id: "s1",
                regNumber: "FA22-BCS-001",
                name: "John Doe",
                presentCount: 8,
                absentCount: 2,
                leaveCount: 0
            },
            {
                id: "s2",
                regNumber: "FA22-BCS-002",
                name: "Jane Smith",
                presentCount: 9,
                absentCount: 1,
                leaveCount: 0
            },
            {
                id: "s3",
                regNumber: "FA22-BCS-003",
                name: "Robert Johnson",
                presentCount: 6,
                absentCount: 3,
                leaveCount: 1
            },
            {
                id: "s4",
                regNumber: "FA22-BCS-004",
                name: "Emily Brown",
                presentCount: 7,
                absentCount: 2,
                leaveCount: 1
            },
            {
                id: "s5",
                regNumber: "FA22-BCS-005",
                name: "Michael Wilson",
                presentCount: 5,
                absentCount: 4,
                leaveCount: 1
            }
        ];
        
        if (students.length === 0) {
            studentAttendanceList.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No students enrolled in this course.</td>
                </tr>
            `;
            return;
        }
        
        // Filter students based on statusFilter
        let filteredStudents = students;
        if (statusFilter === "good") {
            filteredStudents = students.filter(student => {
                const total = student.presentCount + student.absentCount + student.leaveCount;
                return (student.presentCount / total * 100) >= 75;
            });
        } else if (statusFilter === "warning") {
            filteredStudents = students.filter(student => {
                const total = student.presentCount + student.absentCount + student.leaveCount;
                const percentage = student.presentCount / total * 100;
                return percentage >= 60 && percentage < 75;
            });
        } else if (statusFilter === "critical") {
            filteredStudents = students.filter(student => {
                const total = student.presentCount + student.absentCount + student.leaveCount;
                return (student.presentCount / total * 100) < 60;
            });
        }
        
        // Generate table rows
        let rowsHTML = "";
        filteredStudents.forEach(student => {
            // Calculate attendance stats
            const totalSessions = student.presentCount + student.absentCount + student.leaveCount;
            const attendancePercentage = totalSessions > 0 ? (student.presentCount / totalSessions * 100).toFixed(1) : 0;
            
            // Determine status class
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
        
        if (filteredStudents.length === 0) {
            studentAttendanceList.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No students match the selected filter.</td>
                </tr>
            `;
        } else {
            studentAttendanceList.innerHTML = rowsHTML;
        }
        
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
                <td colspan="8" class="text-center text-danger">Error: ${error.message}</td>
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
        
        // For demo purposes, we'll use mock data
        // In a real app, you would fetch this from an API
        const studentData = {
            summary: {
                presentCount: 8,
                absentCount: 2,
                leaveCount: 0
            },
            sessions: [
                {
                    date: "2025-05-02",
                    status: "present",
                    remarks: ""
                },
                {
                    date: "2025-05-04",
                    status: "present",
                    remarks: ""
                },
                {
                    date: "2025-05-06",
                    status: "absent",
                    remarks: "Sick leave"
                },
                {
                    date: "2025-05-09",
                    status: "present",
                    remarks: ""
                },
                {
                    date: "2025-05-11",
                    status: "present",
                    remarks: ""
                }
            ]
        };
        
        // Update attendance summary
        if (detailPresentCount) detailPresentCount.textContent = studentData.summary.presentCount;
        if (detailAbsentCount) detailAbsentCount.textContent = studentData.summary.absentCount;
        if (detailLeaveCount) detailLeaveCount.textContent = studentData.summary.leaveCount;
        
        const totalSessions = studentData.summary.presentCount + studentData.summary.absentCount + studentData.summary.leaveCount;
        const attendancePercentage = totalSessions > 0 ? ((studentData.summary.presentCount / totalSessions) * 100).toFixed(1) : 0;
        
        if (detailPercentage) {
            const statusClass = attendancePercentage >= 75 ? "text-success" : 
                               attendancePercentage >= 60 ? "text-warning" : 
                               "text-danger";
            detailPercentage.className = statusClass;
            detailPercentage.textContent = `${attendancePercentage}%`;
        }
        
        // Generate session table rows
        if (studentSessionList) {
            if (studentData.sessions.length === 0) {
                studentSessionList.innerHTML = "<tr><td colspan=\"3\" class=\"text-center\">No attendance records found.</td></tr>";
            } else {
                let sessionRowsHTML = "";
                studentData.sessions.forEach(session => {
                    const sessionDate = new Date(session.date).toLocaleDateString();
                    const statusClass = session.status === "present" ? "status-present" : 
                                       session.status === "absent" ? "status-absent" : 
                                       "status-leave";
                    
                    sessionRowsHTML += `
                        <tr>
                            <td>${sessionDate}</td>
                            <td><span class="${statusClass}">${session.status.toUpperCase()}</span></td>
                            <td>${session.remarks || "No remarks"}</td>
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
