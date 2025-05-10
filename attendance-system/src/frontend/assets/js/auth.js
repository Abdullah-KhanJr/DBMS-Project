document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const studentFields = document.getElementById('studentFields');
    const facultyFields = document.getElementById('facultyFields');
    const adminFields = document.getElementById('adminFields');
    const loginForm = document.getElementById('loginForm');
    
    console.log("Auth script loaded");
    
    // Toggle role-specific fields in registration form
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            // Hide all dynamic fields first
            if (studentFields) studentFields.style.display = 'none';
            if (facultyFields) facultyFields.style.display = 'none';
            if (adminFields) adminFields.style.display = 'none';
            
            // Show fields based on selected role
            const selectedRole = this.value;
            if (selectedRole === 'student' && studentFields) {
                studentFields.style.display = 'block';
            } else if (selectedRole === 'faculty' && facultyFields) {
                facultyFields.style.display = 'block';
            } else if (selectedRole === 'admin') {
                // Check if admin already exists
                fetch('/api/auth/check-admin')
                    .then(response => response.json())
                    .then(data => {
                        if (data.adminExists) {
                            alert('An administrator account already exists. Only one admin account is allowed.');
                            roleSelect.value = ''; // Reset selection
                        } else if (adminFields) {
                            adminFields.style.display = 'block';
                        }
                    })
                    .catch(error => {
                        console.error('Error checking admin existence:', error);
                    });
            }
        });
    }
    
    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            try {
                // Get form field values
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const role = roleSelect.value;
                
                // Basic validation
                if (!username || !email || !password || !confirmPassword || !role) {
                    alert('Please fill out all required fields.');
                    return;
                }
                
                // Check if passwords match
                if (password !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }
                
                // Create a data object to send
                const userData = {
                    username: username,
                    email: email,
                    password: password,
                    role: role
                };
                
                // Add role-specific fields
                if (role === 'student') {
                    userData.registrationNumber = document.getElementById('registrationNumber').value;
                    userData.faculty = document.getElementById('faculty').value;
                } else if (role === 'faculty') {
                    userData.facultyId = document.getElementById('facultyId').value;
                    userData.department = document.getElementById('department').value;
                } else if (role === 'admin') {
                    userData.adminId = document.getElementById('adminId').value;
                }
                
                console.log('Sending registration data:', userData);
                
                // Send the registration request
                fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        alert('Registration successful! Please log in.');
                        window.location.href = '/pages/login.html';
                    } else {
                        alert(data.message || 'Registration failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Registration error:', error);
                    alert('Registration failed. Please try again. Server might be down or not properly configured.');
                });
            } catch (err) {
                console.error('Error in registration form submission:', err);
                alert('An error occurred during form submission. Please try again.');
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validate login inputs
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }
            
            // Create login data object
            const loginData = {
                email: email,
                password: password
            };
            
            // Send login request
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Store user data and token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    
                    // Redirect based on role
                    redirectBasedOnRole(data.user.role);
                } else {
                    alert(data.message || 'Login failed. Please check your credentials.');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                alert('Login failed. Please try again. Server might be down.');
            });
        });
    }
    
    // Check if user is already logged in
    checkLoggedInStatus();
});

// Function to redirect based on user role
function redirectBasedOnRole(role) {
    switch(role) {
        case 'student':
            window.location.href = '/pages/student/dashboard.html';
            break;
        case 'faculty':
            window.location.href = '/pages/faculty/dashboard.html';
            break;
        case 'admin':
            window.location.href = '/pages/admin/dashboard.html';
            break;
        default:
            window.location.href = '/pages/login.html';
            alert('Unknown user role');
    }
}

// Check if user is already logged in
function checkLoggedInStatus() {
    const currentPath = window.location.pathname;
    const token = localStorage.getItem('token');
    
    // If on login or register page but already logged in
    if ((currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath === '/' || currentPath.includes('index.html')) && token) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.role) {
            redirectBasedOnRole(userData.role);
        }
    }
    
    // If on a protected page but not logged in
    if (!token && 
        (currentPath.includes('/student/') || 
         currentPath.includes('/faculty/') || 
         currentPath.includes('/admin/'))) {
        window.location.href = '/pages/login.html';
    }
}