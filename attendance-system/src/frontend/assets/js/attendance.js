document.addEventListener('DOMContentLoaded', async function() {
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
        localStorage.removeItem('userData');
        window.location.href = '../login.html';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutLink) logoutLink.addEventListener('click', handleLogout);
    
    // Get student data from local storage or API
    try {
        // First try to get from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (userData && userData.name) {
            // If user data exists in localStorage
            if (studentName) studentName.textContent = userData.name;
        } else {
            // If not in localStorage, fetch from API
            try {
                const response = await fetch('http://localhost:5000/api/student/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch student data');
                }
                
                const userData = await response.json();
                
                if (userData && userData.name) {
                    if (studentName) studentName.textContent = userData.name;
                    
                    // Save to localStorage for future use
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    throw new Error('Invalid user data received');
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
                // Show a default name if there's an error
                if (studentName) studentName.textContent = "Student";
            }
        }
    } catch (error) {
        console.error('Error processing user data:', error);
        if (studentName) studentName.textContent = "Student";
    }
    
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
async function processAttendance(qrData) {
    try {
        // Parse the QR data (assuming it's a JSON string)
        const attendanceData = JSON.parse(qrData);
        
        // Get status element
        const attendanceStatus = document.getElementById('attendance-status');
        
        // Get the token for API requests
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        // In a real app, you would send this to your backend
        // Example API call:
        try {
            const response = await fetch('http://localhost:5000/api/attendance/mark', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId: attendanceData.courseId,
                    sessionId: attendanceData.sessionId,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark attendance');
            }
            
            // Close the modal
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
            
            // Refresh attendance history from server
            loadAttendanceHistory();
            
        } catch (apiError) {
            console.error("API Error:", apiError);
            attendanceStatus.innerHTML = `
                <div class="status-error">
                    <i class="fas fa-times-circle"></i>
                    Error: ${apiError.message || 'Failed to mark attendance'}
                </div>
            `;
        }
        
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
async function loadAttendanceHistory() {
    const attendanceHistory = document.getElementById('attendance-history');
    if (!attendanceHistory) return;
    
    // Show loading state
    attendanceHistory.innerHTML = '<tr><td colspan="4" class="text-center">Loading attendance history...</td></tr>';
    
    // Get token for API calls
    const token = localStorage.getItem('token');
    if (!token) {
        attendanceHistory.innerHTML = '<tr><td colspan="4" class="text-center">Please log in to view attendance history</td></tr>';
        return;
    }
    
    try {
        // Fetch attendance history from the API
        const response = await fetch('http://localhost:5000/api/attendance/history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch attendance history');
        }
        
        const attendanceRecords = await response.json();
        
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
        
        if (formattedRecords.length === 0) {
            historyHTML = '<tr><td colspan="4" class="text-center">No attendance records found</td></tr>';
        } else {
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
        }
        
        attendanceHistory.innerHTML = historyHTML;
        
    } catch (error) {
        console.error('Error loading attendance history:', error);
        attendanceHistory.innerHTML = '<tr><td colspan="4" class="text-center">Failed to load attendance history</td></tr>';
    }
}

// Add new attendance record to history
function addAttendanceToHistory(record) {
    const attendanceHistory = document.getElementById('attendance-history');
    if (!attendanceHistory) return;
    
    // If the table shows "No records" message, clear it first
    if (attendanceHistory.innerHTML.includes('No attendance records found')) {
        attendanceHistory.innerHTML = '';
    }
    
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