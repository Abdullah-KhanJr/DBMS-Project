document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const userTypeSelect = document.getElementById('userType');
    const studentFacultyGroup = document.getElementById('studentFacultyGroup');
    const facultyDeptGroup = document.getElementById('facultyDeptGroup');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');

    // Show/hide appropriate dropdowns based on user type
    userTypeSelect.addEventListener('change', function() {
        const isStudent = this.value === 'student';
        const isFaculty = this.value === 'faculty';
        
        studentFacultyGroup.style.display = isStudent ? 'block' : 'none';
        facultyDeptGroup.style.display = isFaculty ? 'block' : 'none';
        
        // Clear selections when switching
        if (!isStudent) document.getElementById('studentFaculty').value = '';
        if (!isFaculty) document.getElementById('facultyDept').value = '';
        
        // Trigger email validation when changing type
        validateEmail();
    });

    // Email validation
    emailInput.addEventListener('blur', validateEmail);
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const userType = userTypeSelect.value;
        
        if (userType === 'student') {
            const studentRegex = /^u\d{7}@giki\.edu\.pk$/;
            if (!studentRegex.test(email)) {
                emailError.textContent = 'Student email must be in format u1234567@giki.edu.pk';
                emailError.style.display = 'block';
                return false;
            }
        } else if (userType === 'faculty') {
            const facultyRegex = /^[a-zA-Z.]+@giki\.edu\.pk$/;
            if (!facultyRegex.test(email)) {
                emailError.textContent = 'Faculty email must be in format name@giki.edu.pk';
                emailError.style.display = 'block';
                return false;
            }
        }
        
        emailError.style.display = 'none';
        return true;
    }

    // Password validation
    confirmPasswordInput.addEventListener('input', validatePassword);
    
    function validatePassword() {
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

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        if (isEmailValid && isPasswordValid) {
            // Here you would typically send the data to your server
            alert('Registration successful!');
            form.reset();
            studentFacultyGroup.style.display = 'none';
            facultyDeptGroup.style.display = 'none';
        }
    });
});