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
        const registerMessage = document.getElementById('registerMessage');
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (registerMessage) {
                registerMessage.style.display = 'none';
                registerMessage.className = 'alert';
                registerMessage.textContent = '';
            }
            try {
                // Get form field values
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const role = roleSelect.value;
                
                // Basic validation
                if (!username || !email || !password || !confirmPassword || !role) {
                    if (registerMessage) {
                        registerMessage.textContent = 'Please fill out all required fields.';
                        registerMessage.className = 'alert alert-danger';
                        registerMessage.style.display = 'block';
                    }
                    return;
                }
                
                // Check if passwords match
                if (password !== confirmPassword) {
                    if (registerMessage) {
                        registerMessage.textContent = 'Passwords do not match!';
                        registerMessage.className = 'alert alert-danger';
                        registerMessage.style.display = 'block';
                    }
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
                .then(async response => {
                    let data = {};
                    try { data = await response.json(); } catch {}
                    if (!response.ok) {
                        if (response.status === 409) {
                            if (registerMessage) {
                                registerMessage.textContent = data.message || 'Email already registered.';
                                registerMessage.className = 'alert alert-danger';
                                registerMessage.style.display = 'block';
                            }
                        } else {
                            if (registerMessage) {
                                registerMessage.textContent = data.message || 'Registration failed. Please try again.';
                                registerMessage.className = 'alert alert-danger';
                                registerMessage.style.display = 'block';
                            }
                        }
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return data;
                })
                .then(data => {
                    if (data.success) {
                        if (registerMessage) {
                            registerMessage.textContent = 'Registration successful! Please log in.';
                            registerMessage.className = 'alert alert-success';
                            registerMessage.style.display = 'block';
                        }
                        setTimeout(() => {
                            window.location.href = '/pages/login.html';
                        }, 1500); // 1.5 seconds delay
                    } else {
                        if (registerMessage) {
                            registerMessage.textContent = data.message || 'Registration failed. Please try again.';
                            registerMessage.className = 'alert alert-danger';
                            registerMessage.style.display = 'block';
                        }
                    }
                })
                .catch(error => {
                    console.error('Registration error:', error);
                });
            } catch (err) {
                console.error('Error in registration form submission:', err);
                if (registerMessage) {
                    registerMessage.textContent = 'An error occurred during form submission. Please try again.';
                    registerMessage.className = 'alert alert-danger';
                    registerMessage.style.display = 'block';
                }
            }
        });
        // Hide error message when user starts typing
        registerForm.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                if (registerMessage) {
                    registerMessage.style.display = 'none';
                }
            });
        });
    }

    // Handle login form submission
    if (loginForm) {
        const loginMessage = document.getElementById('loginMessage');
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (loginMessage) {
                loginMessage.style.display = 'none';
                loginMessage.className = 'alert';
                loginMessage.textContent = '';
            }
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validate login inputs
            if (!email || !password) {
                if (loginMessage) {
                    loginMessage.textContent = 'Please enter both email and password';
                    loginMessage.className = 'alert alert-danger';
                    loginMessage.style.display = 'block';
                }
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
            .then(async response => {
                let data = {};
                try { data = await response.json(); } catch {}
                if (!response.ok) {
                    if (response.status === 401) {
                        if (loginMessage) {
                            loginMessage.textContent = data.message || 'Invalid email or password.';
                            loginMessage.className = 'alert alert-danger';
                            loginMessage.style.display = 'block';
                        }
                    } else {
                        if (loginMessage) {
                            loginMessage.textContent = data.message || 'Login failed. Please try again.';
                            loginMessage.className = 'alert alert-danger';
                            loginMessage.style.display = 'block';
                        }
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return data;
            })
            .then(data => {
                if (data.success) {
                    if (loginMessage) {
                        loginMessage.style.display = 'none';
                    }
                    // Store user data and token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    
                    // Redirect based on role
                    redirectBasedOnRole(data.user.role);
                } else {
                    if (loginMessage) {
                        loginMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                        loginMessage.className = 'alert alert-danger';
                        loginMessage.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Login error:', error);
            });
        });
        // Hide error message when user starts typing
        loginForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (loginMessage) {
                    loginMessage.style.display = 'none';
                }
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