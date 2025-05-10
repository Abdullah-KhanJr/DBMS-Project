document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const studentFields = document.getElementById('studentFields');
    const facultyFields = document.getElementById('facultyFields');
    const adminFields = document.getElementById('adminFields');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const registrationNumberInput = document.getElementById('registrationNumber');
    const regNumberError = document.getElementById('regNumberError');
    const facultyIdInput = document.getElementById('facultyId');
    const facultyIdError = document.getElementById('facultyIdError');
    
    console.log("Registration form loaded");
    
    // Toggle visibility based on user type
    roleSelect.addEventListener('change', function() {
        // Hide all dynamic fields first
        studentFields.style.display = 'none';
        facultyFields.style.display = 'none';
        adminFields.style.display = 'none';
        
        // Show fields based on selected role
        const selectedRole = this.value;
        if (selectedRole === 'student') {
            studentFields.style.display = 'block';
        } else if (selectedRole === 'faculty') {
            facultyFields.style.display = 'block';
        } else if (selectedRole === 'admin') {
            adminFields.style.display = 'block';
        }
        
        validateEmail();
    });
    
    // Email validation
    emailInput.addEventListener('blur', validateEmail);
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const userType = roleSelect.value;
        
        if (email === '') return true;
        
        if (userType === 'student') {
            const studentRegex = /^u\d{7}@giki\.edu\.pk$/;
            if (!studentRegex.test(email)) {
                emailError.textContent = 'Student email must be in format u1234567@giki.edu.pk';
                emailError.style.display = 'block';
                return false;
            }
        } else if (userType === 'faculty' || userType === 'admin') {
            const facultyRegex = /^[a-zA-Z.]+@giki\.edu\.pk$/;
            if (!facultyRegex.test(email)) {
                emailError.textContent = 'Email must be in format name@giki.edu.pk';
                emailError.style.display = 'block';
                return false;
            }
        }
        
        emailError.style.display = 'none';
        return true;
    }
    
    // Validate student registration number
    registrationNumberInput?.addEventListener('blur', validateRegNumber);
    
    function validateRegNumber() {
        if (roleSelect.value !== 'student') return true;
        
        const regNumber = registrationNumberInput.value.trim();
        if (regNumber === '') return true;
        
        const isValid = /^[0-9]{7}$/.test(regNumber);
        
        regNumberError.textContent = isValid ? '' : 'Enter valid 7-digit registration number';
        regNumberError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }
    
    // Validate faculty ID
    facultyIdInput?.addEventListener('blur', validateFacultyId);
    
    function validateFacultyId() {
        if (roleSelect.value !== 'faculty') return true;
        
        const facultyId = facultyIdInput.value.trim();
        if (facultyId === '') return true;
        
        const isValid = /^[0-9]{5}$/.test(facultyId);
        
        facultyIdError.textContent = isValid ? '' : 'Enter valid 5-digit Faculty ID';
        facultyIdError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }
    
    // Password validation
    confirmPasswordInput.addEventListener('input', validatePassword);
    
    function validatePassword() {
        if (passwordInput.value === '' && confirmPasswordInput.value === '') return true;
        
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordError.textContent = 'Passwords do not match';
            passwordError.style.display = 'block';
            return false;
        } else if (passwordInput.value.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
            passwordError.style.display = 'block';
            return false;
        }
        
        passwordError.style.display = 'none';
        return true;
    }
    
    // Form submission handling
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate all fields
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isRegNumberValid = validateRegNumber();
        const isFacultyIdValid = validateFacultyId();
        
        if (!isEmailValid || !isPasswordValid || !isRegNumberValid || !isFacultyIdValid) {
            return;
        }
        
        // Get all form data
        const username = document.getElementById('username').value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const role = roleSelect.value;
        
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
        
        // Send the registration request
        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Registration successful! Please log in.');
                window.location.href = 'login.html';
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        });
    });
});

// Add this to the bottom of your existing auth.js file

// Login form handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    console.log("Login form detected");
    
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
        .then(response => response.json())
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
            alert('Login failed. Please try again.');
        });
    });
}

// Function to redirect based on user role
function redirectBasedOnRole(role) {
    switch(role) {
        case 'student':
            window.location.href = 'student/dashboard.html';
            break;
        case 'faculty':
            window.location.href = 'faculty/dashboard.html';
            break;
        case 'admin':
            window.location.href = 'admin/dashboard.html';
            break;
        default:
            window.location.href = 'login.html';
            alert('Unknown user role');
    }
}

// Check if user is already logged in
function checkLoggedInStatus() {
    const currentPath = window.location.pathname;
    const token = localStorage.getItem('token');
    
    // If on login or register page but already logged in
    if ((currentPath.includes('login.html') || currentPath.includes('register.html')) && token) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.role) {
            redirectBasedOnRole(userData.role);
        }
    }
}

// Run logged-in check when page loads
checkLoggedInStatus();