document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // Get DOM elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const profileIcon = document.querySelector('.profile-icon');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    const facultyName = document.getElementById('faculty-name');
    const courseAttendanceSummary = document.getElementById('course-attendance-summary');
    const studentAttendanceSection = document.getElementById('student-attendance-section');
    const selectedCourseTitle = document.getElementById('selected-course-title');
    const studentAttendanceList = document.getElementById('student-attendance-list');
    const backToSummary = document.getElementById('back-to-summary');
    const statusFilter = document.getElementById('status-filter');
    const exportCsv = document.getElementById('export-csv');
    const studentDetailModal = document.getElementById('student-detail-modal');
    const modalClose = document.querySelector('.modal-close');
    
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
        if (e) e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Set faculty name from localStorage
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.name && facultyName) {
            facultyName.textContent = userData.name;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        if (facultyName) facultyName.textContent = "Faculty";
    }
    
    // Load course attendance summaries
    await loadCourseAttendanceSummary();
    
    // Handle back to summary button
    if (backToSummary) {
        backToSummary.addEventListener('click', function() {
            studentAttendanceSection.style.display = 'none';
        });
    }
    
    // Handle status filter change
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const selectedCourseId = studentAttendanceSection.getAttribute('data-course-id');
            if (selectedCourseId) {
                loadStudentAttendanceRecords(selectedCourseId);
            }
        });
    }
    
    // Handle export to CSV button
    if (exportCsv) {
        exportCsv.addEventListener('click', exportAttendanceToCSV);
    }
    
    // Handle modal close
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            studentDetailModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === studentDetailModal) {
            studentDetailModal.style.display = 'none';
        }
    });
    
    // Load course attendance summary
    async function loadCourseAttendanceSummary() {
        if (!courseAttendanceSummary) return;
        
        try {
            // Replace with actual API call in production
            // const response = await fetch('/api/faculty/course-attendance-summary', {
            //     headers: {
            //         'Authorization': `Bearer ${token}`
            //     }
            // });
            
            // if (!response.ok) {
            //     throw new Error('Failed to fetch course attendance summary');
            // }
            
            // const courses = await response.json();
            
            // Mock data for development
            const courses = [
                {
                    id: 'CS101',
                    code: 'CS101',
                    title: 'Introduction to Programming',
                    credit_hours: 3,
                    total_sessions: 45,
                    conducted_sessions: 32,
                    total_students: 35,
                    avg_attendance: 92.5,
                    section: 'A'
                },
                {
                    id: 'CS232',
                    code: 'CS232',
                    title: 'Database Management Systems',
                    credit_hours: 3,
                    total_sessions: 45,
                    conducted_sessions: 28,
                    total_students: 28,
                    avg_attendance: 88.2,
                    section: 'B'
                },
                {
                    id: 'MATH205',
                    code: 'MATH205',
                    title: 'Discrete Mathematics',
                    credit_hours: 2,
                    total_sessions: 30,
                    conducted_sessions: 22,
                    total_students: 32,
                    avg_attendance: 76.5,
                    section: 'A'
                },
                {
                    id: 'CS360',
                    code: 'CS360',
                    title: 'Software Engineering',
                    credit_hours: 1,
                    total_sessions: 15,
                    conducted_sessions: 10,
                    total_students: 24,
                    avg_attendance: 94.0,
                    section: 'C'
                }
            ];
            
            if (courses.length === 0) {
                courseAttendanceSummary.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>No Courses Found</h3>
                        <p>You don't have any courses yet.</p>
                    </div>
                `;
                return;
            }
            
            let coursesHTML = '';
            
            courses.forEach(course => {
                // Determine color based on attendance rate
                let statusColor = course.avg_attendance >= 85 ? 'var(--success-color)' : 
                                course.avg_attendance >= 75 ? 'var(--warning-color)' : 
                                'var(--danger-color)';
                
                // Determine total lectures based on credit hours
                const totalLectures = course.credit_hours === 3 ? 45 : 
                                      course.credit_hours === 2 ? 30 : 15;
                
                coursesHTML += `
                    <div class="course-card attendance-course-card clickable" data-course-id="${course.id}">
                        <div class="course-header">
                            <h3>${course.title}</h3>
                            <span class="course-code">${course.code}</span>
                        </div>
                        <div class="course-info">
                            <p><i class="fas fa-users"></i> ${course.total_students} Students</p>
                            <p><i class="fas fa-layer-group"></i> Section ${course.section}</p>
                            <p><i class="fas fa-clock"></i> ${course.credit_hours} Credit Hours</p>
                            <p><i class="fas fa-calendar-check"></i> ${course.conducted_sessions}/${totalLectures} Sessions</p>
                        </div>
                        <div class="course-attendance">
                            <div class="attendance-bar">
                                <div class="attendance-progress" style="width: ${course.avg_attendance}%; background-color: ${statusColor};"></div>
                            </div>
                            <span>${course.avg_attendance.toFixed(1)}% Average Attendance</span>
                        </div>
                    </div>
                `;
            });
            
            courseAttendanceSummary.innerHTML = coursesHTML;
            
            // Add event listeners to course cards
            const courseCards = document.querySelectorAll('.attendance-course-card');
            courseCards.forEach(card => {
                card.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-course-id');
                    loadStudentAttendanceRecords(courseId);
                });
            });
            
        } catch (error) {
            console.error('Error loading course attendance summary:', error);
            courseAttendanceSummary.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Error Loading Courses</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="window.location.reload()">Retry</button>
                </div>
            `;
        }
    }
    
    // Load student attendance records for a specific course
    async function loadStudentAttendanceRecords(courseId) {
        if (!studentAttendanceList) return;
        
        try {
            // Replace with actual API call in production
            // const response = await fetch(`/api/faculty/course/${courseId}/attendance`, {
            //     headers: {
            //         'Authorization': `Bearer ${token}`
            //     }
            // });
            
            // if (!response.ok) {
            //     throw new Error('Failed to fetch student attendance records');
            // }
            
            // const data = await response.json();
            // const course = data.course;
            // const students = data.students;
            
            // Mock data for development
            const courseInfo = {
                id: courseId,
                title: {
                    'CS101': 'Introduction to Programming',
                    'CS232': 'Database Management Systems',
                    'MATH205': 'Discrete Mathematics',
                    'CS360': 'Software Engineering'
                }[courseId],
                code: courseId,
                credit_hours: {
                    'CS101': 3,
                    'CS232': 3,
                    'MATH205': 2,
                    'CS360': 1
                }[courseId],
                section: {
                    'CS101': 'A',
                    'CS232': 'B',
                    'MATH205': 'A',
                    'CS360': 'C'
                }[courseId]
            };
            
            // Set total sessions based on credit hours
            const totalSessions = courseInfo.credit_hours === 3 ? 45 : 
                                  courseInfo.credit_hours === 2 ? 30 : 15;
            
            // Mock student data
            const students = Array(Math.floor(Math.random() * 15) + 15).fill().map((_, i) => {
                const regPrefix = courseInfo.code === 'MATH205' ? 'FMT' : 'FCS';
                const regYear = '22';
                const regNum = String(i + 1).padStart(3, '0');
                const registrationNo = `${regPrefix}${regYear}-${regNum}`;
                
                const present = Math.floor(Math.random() * (totalSessions * 0.5)) + Math.floor(totalSessions * 0.4);
                const absent = totalSessions - present;
                const percentage = (present / totalSessions * 100).toFixed(1);
                
                return {
                    id: i + 1,
                    registration_number: registrationNo,
                    name: `Student ${i + 1}`,
                    total_sessions: totalSessions,
                    present: present,
                    absent: absent,
                    percentage: percentage,
                    status: percentage >= 75 ? 'Good Standing' : 
                            percentage >= 60 ? 'Warning' : 'Critical'
                };
            });
            
            // Update the course title
            selectedCourseTitle.textContent = `${courseInfo.code} - ${courseInfo.title} (Section ${courseInfo.section})`;
            
            // Store the course ID for later
            studentAttendanceSection.setAttribute('data-course-id', courseId);
            
            // Filter students based on status if needed
            const filterValue = statusFilter.value;
            let filteredStudents = students;
            
            if (filterValue === 'good') {
                filteredStudents = students.filter(student => parseFloat(student.percentage) >= 75);
            } else if (filterValue === 'warning') {
                filteredStudents = students.filter(student => parseFloat(student.percentage) >= 60 && parseFloat(student.percentage) < 75);
            } else if (filterValue === 'critical') {
                filteredStudents = students.filter(student => parseFloat(student.percentage) < 60);
            }
            
            // Generate HTML for student list
            if (filteredStudents.length === 0) {
                studentAttendanceList.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">No students match the selected filter</td>
                    </tr>
                `;
            } else {
                studentAttendanceList.innerHTML = filteredStudents.map(student => {
                    // Determine status class
                    const statusClass = student.percentage >= 75 ? 'status-present' : 
                                        student.percentage >= 60 ? 'status-late' : 
                                        'status-absent';
                    
                    return `
                        <tr>
                            <td>${student.registration_number}</td>
                            <td>${student.name}</td>
                            <td>${student.total_sessions}</td>
                            <td>${student.present}</td>
                            <td>${student.absent}</td>
                            <td>${student.percentage}%</td>
                            <td><span class="attendance-status-badge ${statusClass}">${student.status}</span></td>
                            <td>
                                <button class="btn-small view-detail-btn" data-student-id="${student.id}" data-reg="${student.registration_number}" data-name="${student.name}" data-percentage="${student.percentage}">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            
            // Show the student attendance section
            studentAttendanceSection.style.display = 'block';
            
            // Add event listeners to view detail buttons
            const viewDetailButtons = document.querySelectorAll('.view-detail-btn');
            viewDetailButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const studentId = this.getAttribute('data-student-id');
                    const regNumber = this.getAttribute('data-reg');
                    const studentName = this.getAttribute('data-name');
                    const percentage = this.getAttribute('data-percentage');
                    
                    showStudentDetailModal(studentId, regNumber, studentName, percentage, courseInfo);
                });
            });
            
        } catch (error) {
            console.error('Error loading student attendance records:', error);
            studentAttendanceList.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Error: ${error.message}</td>
                </tr>
            `;
            
            // Show the section anyway to display the error
            studentAttendanceSection.style.display = 'block';
        }
    }
    
    // Show student detail modal
    function showStudentDetailModal(studentId, regNumber, studentName, percentage, courseInfo) {
        // Set modal title and student info
        document.getElementById('student-detail-title').textContent = `Attendance Details - ${studentName}`;
        document.getElementById('detail-reg-number').textContent = regNumber;
        document.getElementById('detail-name').textContent = studentName;
        document.getElementById('detail-course').textContent = `${courseInfo.code} - ${courseInfo.title}`;
        
        // Set percentage with appropriate color
        const percentageSpan = document.getElementById('detail-percentage');
        percentageSpan.textContent = `${percentage}%`;
        if (percentage >= 75) {
            percentageSpan.className = 'text-success';
        } else if (percentage >= 60) {
            percentageSpan.className = 'text-warning';
        } else {
            percentageSpan.className = 'text-danger';
        }
        
        // Generate session list
        const sessionListEl = document.getElementById('student-session-list');
        const totalSessions = courseInfo.credit_hours === 3 ? 45 : 
                              courseInfo.credit_hours === 2 ? 30 : 15;
        
        // Generate mock session data
        const sessions = Array(totalSessions).fill().map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (totalSessions - i));
            
            const randomStatus = Math.random() * 100;
            const status = randomStatus < parseInt(percentage) ? 'Present' : 'Absent';
            
            return {
                date: date.toLocaleDateString(),
                session_number: i + 1,
                status: status,
                remarks: status === 'Present' ? '' : Math.random() > 0.7 ? 'Leave application submitted' : ''
            };
        });
        
        sessionListEl.innerHTML = sessions.map(session => {
            const statusClass = session.status === 'Present' ? 'status-present' : 'status-absent';
            
            return `
                <tr>
                    <td>${session.date}</td>
                    <td>Session ${session.session_number}</td>
                    <td><span class="attendance-status-badge ${statusClass}">${session.status}</span></td>
                    <td>${session.remarks}</td>
                </tr>
            `;
        }).join('');
        
        // Show the modal
        studentDetailModal.style.display = 'block';
    }
    
    // Export attendance to CSV
    function exportAttendanceToCSV() {
        const courseId = studentAttendanceSection.getAttribute('data-course-id');
        if (!courseId) return;
        
        // Get course title
        const courseTitle = selectedCourseTitle.textContent;
        
        // Get all rows from the table
        const rows = Array.from(studentAttendanceList.querySelectorAll('tr'));
        if (rows.length === 0) return;
        
        // Create CSV header
        const headers = ['Registration No.', 'Name', 'Total Sessions', 'Present', 'Absent', 'Percentage', 'Status'];
        let csvContent = headers.join(',') + '\n';
        
        // Add each row to CSV
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td:not(:last-child)'));
            if (cells.length >= 7) {
                const rowData = cells.map(cell => {
                    if (cell.querySelector('.attendance-status-badge')) {
                        return cell.querySelector('.attendance-status-badge').textContent.trim();
                    }
                    return '"' + cell.textContent.trim().replace(/"/g, '""') + '"';
                });
                csvContent += rowData.join(',') + '\n';
            }
        });
        
        // Create a download link
        const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `attendance_${courseId}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});