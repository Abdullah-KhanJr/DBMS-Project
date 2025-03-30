document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('registrationForm');
    const step1 = document.getElementById('registrationStep1');
    const verificationStep = document.getElementById('verificationStep');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const resendCodeLink = document.getElementById('resendCode');
    const countdownElement = document.getElementById('countdown');
    
    // Variables
    let verificationCode = '';
    let countdownInterval;
    let countdown = 60;

    // Role selection
    const roleOptions = document.querySelectorAll('.role-option');
    const userRoleInput = document.getElementById('userRole');
    const studentFields = document.getElementById('studentFields');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const role = this.getAttribute('data-role');
            userRoleInput.value = role;
            
            if (role === 'student') {
                studentFields.style.display = 'block';
            } else {
                studentFields.style.display = 'none';
            }
        });
    });

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        confirmPasswordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Validate GIK email domain
    function validateGIKEmail(email) {
        return email.endsWith('@giki.edu.pk');
    }

    // Generate random 6-digit code
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Start countdown timer
    function startCountdown() {
        countdown = 60;
        resendCodeLink.style.pointerEvents = 'none';
        resendCodeLink.style.color = 'var(--medium-grey)';
        
        countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = `Resend available in ${countdown}s`;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                resendCodeLink.style.pointerEvents = 'auto';
                resendCodeLink.style.color = 'var(--black)';
                countdownElement.textContent = '';
            }
        }, 1000);
    }

    // Send verification code
    sendCodeBtn.addEventListener('click', function() {
        // Validate form first
        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        let isValid = true;

        // Reset errors
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });

        // Validate name
        if (name === '') {
            document.getElementById('nameError').textContent = 'Please enter your full name';
            document.getElementById('nameError').style.display = 'block';
            isValid = false;
        }

        // Validate email
        if (email === '') {
            document.getElementById('emailError').textContent = 'Please enter your email';
            document.getElementById('emailError').style.display = 'block';
            isValid = false;
        } else if (!validateGIKEmail(email)) {
            document.getElementById('emailError').textContent = 'Please use your GIK email (@giki.edu.pk)';
            document.getElementById('emailError').style.display = 'block';
            isValid = false;
        }

        // Validate password
        if (password.length < 8) {
            document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
            document.getElementById('passwordError').style.display = 'block';
            isValid = false;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            document.getElementById('confirmError').textContent = 'Passwords do not match';
            document.getElementById('confirmError').style.display = 'block';
            isValid = false;
        }

        // Validate terms checkbox
        if (!document.getElementById('agreeTerms').checked) {
            alert('Please agree to the terms and conditions');
            isValid = false;
        }

        // Role-specific validation
        if (userRoleInput.value === 'student') {
            if (document.getElementById('rollNumber').value.trim() === '' || 
                document.getElementById('department').value === '') {
                alert('Please fill all student fields');
                isValid = false;
            }
        }

        if (isValid) {
            // Generate and "send" verification code (in production, this would be an API call)
            verificationCode = generateVerificationCode();
            console.log(`Verification code for ${email}: ${verificationCode}`); // For testing
            
            // Show verification step
            step1.style.display = 'none';
            verificationStep.style.display = 'block';
            userEmailDisplay.textContent = email;
            
            // Start countdown for resend
            startCountdown();
        }
    });

    // Resend verification code
    resendCodeLink.addEventListener('click', function(e) {
        e.preventDefault();
        verificationCode = generateVerificationCode();
        console.log(`New verification code for ${document.getElementById('email').value}: ${verificationCode}`); // For testing
        startCountdown();
    });

    // Form submission (verification)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const enteredCode = document.getElementById('verificationCode').value.trim();
        const codeError = document.getElementById('codeError');
        
        if (enteredCode === '') {
            codeError.textContent = 'Please enter the verification code';
            codeError.style.display = 'block';
            return;
        }
        
        if (enteredCode !== verificationCode) {
            codeError.textContent = 'Invalid verification code';
            codeError.style.display = 'block';
            return;
        }
        
        // If code is valid, proceed with registration
        alert('Registration successful!');
        // In production: form.submit() or AJAX call to your backend
    });

    // Input validation on blur
    document.getElementById('fullName').addEventListener('blur', function() {
        if (this.value.trim() === '') {
            document.getElementById('nameError').textContent = 'Please enter your full name';
            document.getElementById('nameError').style.display = 'block';
        } else {
            document.getElementById('nameError').style.display = 'none';
        }
    });
    
    document.getElementById('email').addEventListener('blur', function() {
        const email = this.value.trim();
        if (email === '') {
            document.getElementById('emailError').textContent = 'Please enter your email';
            document.getElementById('emailError').style.display = 'block';
        } else if (!validateGIKEmail(email)) {
            document.getElementById('emailError').textContent = 'Please use your GIK email (@giki.edu.pk)';
            document.getElementById('emailError').style.display = 'block';
        } else {
            document.getElementById('emailError').style.display = 'none';
        }
    });
});

// Add this to the existing register.js (replace password-related code)

// Real-time password validation
passwordInput.addEventListener('input', validatePasswords);
confirmPasswordInput.addEventListener('input', validatePasswords);

function validatePasswords() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const errorElement = document.getElementById('confirmError');
    
    if (password && confirmPassword) {
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
            confirmPasswordInput.style.borderColor = 'var(--error-red)';
        } else {
            errorElement.style.display = 'none';
            confirmPasswordInput.style.borderColor = 'var(--light-grey)';
        }
    } else {
        errorElement.style.display = 'none';
        confirmPasswordInput.style.borderColor = 'var(--light-grey)';
    }
}

// Update toggle password icons (replace existing toggle password code)
togglePassword.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
`;

let passwordVisible = false;
togglePassword.addEventListener('click', function() {
    passwordVisible = !passwordVisible;
    const type = passwordVisible ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    confirmPasswordInput.setAttribute('type', type);
    
    this.innerHTML = passwordVisible ? `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    ` : `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
});

// Update the email validation function
function validateGIKEmail(email, isStudent) {
    if (isStudent) {
        const studentEmailRegex = /^u\d{7}@giki\.edu\.pk$/;
        return studentEmailRegex.test(email);
    }
    // Faculty can use any giki email
    return email.endsWith('@giki.edu.pk');
}

    // Update the sendCodeBtn click handler to include faculty validation
    sendCodeBtn.addEventListener('click', function() {
        // ... existing validation code ...
        
        // Faculty-specific validation
        if (userRoleInput.value === 'faculty') {
            if (document.getElementById('facultyId').value.trim() === '' || 
                document.getElementById('facultyDepartment').value === '' ||
                document.getElementById('designation').value === '') {
                alert('Please fill all faculty fields');
                isValid = false;
            }
        }
        
        // ... rest of the code ...
    });
    
    // Update email validation
    const isStudent = userRoleInput.value === 'student';
    if (email === '') {
        document.getElementById('emailError').textContent = 'Please enter your email';
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    } else if (!validateGIKEmail(email, isStudent)) {
        document.getElementById('emailError').textContent = isStudent 
            ? 'Student email must be u[7 digits]@giki.edu.pk (e.g., u1234567@giki.edu.pk)'
            : 'Please use your GIK email (@giki.edu.pk)';
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }
    
    // ... rest of the code ...
// });

// Update the email blur event
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const isStudent = userRoleInput.value === 'student';
    
    if (email === '') {
        document.getElementById('emailError').textContent = 'Please enter your email';
        document.getElementById('emailError').style.display = 'block';
    } else if (!validateGIKEmail(email, isStudent)) {
        document.getElementById('emailError').textContent = isStudent 
            ? 'Student email must be u[7 digits]@giki.edu.pk (e.g., u1234567@giki.edu.pk)'
            : 'Please use your GIK email (@giki.edu.pk)';
        document.getElementById('emailError').style.display = 'block';
    } else {
        document.getElementById('emailError').style.display = 'none';
    }
});