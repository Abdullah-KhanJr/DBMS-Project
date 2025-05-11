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
    
    // Set student name (replace with your actual user data retrieval)
    const mockUserData = {
        username: "John Smith",
        id: "12345",
        role: "student"
    };
    
    if (studentName) studentName.textContent = mockUserData.username;
    
    // Initialize QR Scanner
    let html5QrCode;
    
    // Handle Scan QR Code button click
    if (scanButton) {
        scanButton.addEventListener('click', function() {
            openQRScanner();
        });
    }
    
    // Close modal when clicking the close button
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop();
            }
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop();
            }
        }
    });
    
    // Load attendance history
    loadAttendanceHistory();
});

// Open QR Code scanner
function openQRScanner() {
    const modal = document.getElementById('camera-modal');
    const cameraContainer = document.getElementById('camera-container');
    const scanResult = document.getElementById('scan-result');
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Clear previous results
    scanResult.innerHTML = 'Initializing camera...';
    
    // Initialize the QR scanner
    const html5QrCode = new Html5Qrcode("camera-container");
    
    html5QrCode.start(
        { facingMode: "environment" },  // Use the back camera
        {
            fps: 10,
            qrbox: 250
        },
        (decodedText, decodedResult) => {
            // QR code scanned successfully
            console.log(`QR Code detected: ${decodedText}`, decodedResult);
            
            // Stop scanning
            html5QrCode.stop().then(() => {
                // Show success message
                scanResult.innerHTML = `<div class="status-success">QR Code scanned: ${decodedText}</div>`;
                
                // Process attendance marking
                processAttendance(decodedText);
            }).catch((err) => {
                console.error("Error stopping QR Code scanner:", err);
            });
        },
        (errorMessage) => {
            // Error or QR not detected
            console.log(`QR Code scanning error: ${errorMessage}`);
        }
    ).catch((err) => {
        scanResult.innerHTML = `<div class="status-error">Error accessing camera: ${err}</div>`;
        console.error("Error starting QR Code scanner:", err);
    });
}

// Process the attendance after scanning a QR code
function processAttendance(qrData) {
    try {
        // Parse the QR data (assuming it's a JSON string)
        const attendanceData = JSON.parse(qrData);
        
        // Get status element
        const attendanceStatus = document.getElementById('attendance-status');
        
        // In a real app, you would send this to your backend
        setTimeout(() => {
            const modal = document.getElementById('camera-modal');
            modal.style.display = 'none';
            
            // Show success message in the main page
            attendanceStatus.innerHTML = `
                <div class="status-success">
                    <i class="fas fa-check-circle"></i>
                    Attendance marked successfully for ${attendanceData.course}!
                </div>
            `;
            
            // Add the new attendance to history
            addAttendanceToHistory({
                course: attendanceData.course,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                status: 'Present'
            });
            
            // In a real app, you would update the attendance history from the server
        }, 1500);
        
    } catch (error) {
        console.error("Error processing QR data:", error);
        
        const attendanceStatus = document.getElementById('attendance-status');
        attendanceStatus.innerHTML = `
            <div class="status-error">
                <i class="fas fa-times-circle"></i>
                Invalid QR code. Please try again.
            </div>
        `;
    }
}

// Load attendance history
function loadAttendanceHistory() {
    const attendanceHistory = document.getElementById('attendance-history');
    if (!attendanceHistory) return;
    
    // Mock attendance data (replace with actual API call)
    const attendanceRecords = [
        {
            course: "CS232 Database Management Systems",
            date: "2025-05-06",
            time: "09:15 AM",
            status: "Present"
        },
        {
            course: "CS101 Introduction to Programming",
            date: "2025-05-05",
            time: "11:30 AM",
            status: "Present"
        },
        {
            course: "MATH205 Linear Algebra",
            date: "2025-05-05",
            time: "02:00 PM",
            status: "Late"
        },
        {
            course: "ENG101 Technical Communication",
            date: "2025-05-04",
            time: "10:00 AM",
            status: "Absent"
        }
    ];
    
    // Format dates
    const formattedRecords = attendanceRecords.map(record => {
        const date = new Date(record.date);
        return {
            ...record,
            date: date.toLocaleDateString()
        };
    });
    
    // Generate table rows
    let historyHTML = '';
    
    formattedRecords.forEach(record => {
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
        
        historyHTML += `
            <tr>
                <td>${record.course}</td>
                <td>${record.date}</td>
                <td>${record.time}</td>
                <td><span class="attendance-status-badge ${statusClass}">${record.status}</span></td>
            </tr>
        `;
    });
    
    attendanceHistory.innerHTML = historyHTML;
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