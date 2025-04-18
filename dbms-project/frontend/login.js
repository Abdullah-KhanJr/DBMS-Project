document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Email validation
    function validateEmail() {
        const email = emailInput.value.trim();
        
        // Check for either student or faculty/admin format
        const isValid = /^u\d{7}@giki\.edu\.pk$/.test(email) || 
                      /^[a-zA-Z.]+@giki\.edu\.pk$/.test(email);
        
        if (!isValid) {
            emailError.textContent = 'Please enter a valid GIKI email address';
            emailError.style.display = 'block';
            return false;
        }
        
        emailError.style.display = 'none';
        return true;
    }

    // Password validation
    function validatePassword() {
        if (passwordInput.value.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
            passwordError.style.display = 'block';
            return false;
        }
        
        passwordError.style.display = 'none';
        return true;
    }

    // Event listeners
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('input', validatePassword);

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Redirect based on user type with appropriate data
                let redirectUrl = '';
                switch(data.user.user_type) {
                    case 'student':
                        redirectUrl = `student-dashboard.html?student_id=${data.user.student_id}`;
                        break;
                    case 'faculty':
                        redirectUrl = `faculty-dashboard.html?faculty_id=${data.user.faculty_id}`;
                        break;
                    case 'admin':
                        redirectUrl = 'admin-dashboard.html';
                        break;
                    default:
                        redirectUrl = 'dashboard.html';
                }
                window.location.href = redirectUrl;
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });
});