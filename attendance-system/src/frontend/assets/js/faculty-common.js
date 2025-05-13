// Common function to fetch and display faculty name
async function displayFacultyName() {
    // Get DOM elements
    const facultyNameElements = document.querySelectorAll('#faculty-name');
    const welcomeNameElements = document.querySelectorAll('#welcome-name');
    
    if (facultyNameElements.length === 0 && welcomeNameElements.length === 0) {
        return; // No elements to update
    }
    
    try {
        // Try to get data from localStorage first
        const token = localStorage.getItem('token');
        let userData = null;
        
        try {
            userData = JSON.parse(localStorage.getItem('userData'));
        } catch (error) {
            console.error('Error parsing userData from localStorage:', error);
        }
        
        // If we have complete user data with name, use it
        if (userData && userData.name) {
            updateNameElements(userData.name, facultyNameElements, welcomeNameElements);
            return;
        }
        
        // Otherwise fetch from API
        if (token) {
            try {
                const response = await fetch('/api/faculty/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const { data } = await response.json();
                    
                    // Update localStorage with the latest data
                    if (userData) {
                        userData.name = data.name;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } else {
                        localStorage.setItem('userData', JSON.stringify({
                            name: data.name,
                            faculty_id: data.id
                        }));
                    }
                    
                    updateNameElements(data.name, facultyNameElements, welcomeNameElements);
                    return;
                }
            } catch (error) {
                console.error('Error fetching faculty profile:', error);
            }
        }
        
        // Fallback to default name if API call fails
        updateNameElements("Faculty Member", facultyNameElements, welcomeNameElements);
        
    } catch (error) {
        console.error('Error in displayFacultyName:', error);
        updateNameElements("Faculty Member", facultyNameElements, welcomeNameElements);
    }
}

// Helper function to update name elements
function updateNameElements(name, facultyNameElements, welcomeNameElements) {
    facultyNameElements.forEach(element => {
        element.textContent = name;
    });
    
    welcomeNameElements.forEach(element => {
        element.textContent = name;
    });
}

// Run this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', displayFacultyName);

// Reusable notification function
function showNotification(message, type = 'success') {
    let statusBox = document.getElementById('status-message');
    if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.id = 'status-message';
        statusBox.className = 'status-message';
        document.body.appendChild(statusBox);
    }
    statusBox.textContent = message;
    if (type === 'success') {
        statusBox.style.color = 'green';
        statusBox.style.background = '#e8f5e9';
    } else {
        statusBox.style.color = 'red';
        statusBox.style.background = '#ffebee';
    }
    statusBox.style.display = 'block';
    setTimeout(() => {
        statusBox.textContent = '';
        statusBox.style.display = 'none';
    }, 3000);
}
