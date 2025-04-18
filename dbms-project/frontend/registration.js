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
    // Add these with your other DOM element declarations
    const registrationNumberGroup = document.getElementById('registrationNumberGroup');
    const registrationNumberInput = document.getElementById('registrationNumber');
    const regNumberError = document.getElementById('regNumberError');
    const facultyIdGroup = document.getElementById('facultyIdGroup');
    const facultyIdInput = document.getElementById('facultyId');
    const facultyIdError = document.getElementById('facultyIdError');

    console.log("Registration form loaded");

    // Show/hide appropriate dropdowns based on user type
    // Replace your existing userTypeSelect event listener with this:
    userTypeSelect.addEventListener('change', function() {
        const isStudent = this.value === 'student';
        const isFaculty = this.value === 'faculty';
        
        studentFacultyGroup.style.display = isStudent ? 'block' : 'none';
        registrationNumberGroup.style.display = isStudent ? 'block' : 'none';
        facultyDeptGroup.style.display = isFaculty ? 'block' : 'none';
        facultyIdGroup.style.display = isFaculty ? 'block' : 'none';
        
        // Clear fields when switching types
        if (!isStudent) {
            document.getElementById('studentFaculty').value = '';
            registrationNumberInput.value = '';
        }
        if (!isFaculty) {
            document.getElementById('facultyDept').value = '';
            facultyIdInput.value = '';
        }
        
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

    // Student Registration Number validation
    function validateRegNumber() {
        if (userTypeSelect.value !== 'student') return true;
        
        const regNumber = registrationNumberInput.value.trim();
        const isValid = /^[0-9]{7}$/.test(regNumber);
        
        regNumberError.textContent = isValid ? '' : 'Enter valid registration number';
        regNumberError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }

    // Faculty ID validation
    function validateFacultyId() {
        if (userTypeSelect.value !== 'faculty') return true;
        
        const facultyId = facultyIdInput.value.trim();
        // Example pattern: 2-3 letters followed by 4-5 numbers (CS12345)
        const isValid = /^[0-9]{5}$/.test(facultyId);
        
        facultyIdError.textContent = isValid ? '' : 'Enter valid Faculty ID';
        facultyIdError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }

    // Add event listeners for the new fields (place with your other event listeners)
    registrationNumberInput.addEventListener('blur', validateRegNumber);
    facultyIdInput.addEventListener('blur', validateFacultyId);

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
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isRegNumberValid = userTypeSelect.value !== 'student' || validateRegNumber();
        const isFacultyIdValid = userTypeSelect.value !== 'faculty' || validateFacultyId();
        
        if (!isEmailValid || !isPasswordValid || !isRegNumberValid || !isFacultyIdValid) {
            return;
        }
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            userType: userTypeSelect.value,
            faculty: userTypeSelect.value === 'student' 
                ? document.getElementById('studentFaculty').value 
                : null,
            department: userTypeSelect.value === 'faculty' 
                ? document.getElementById('facultyDept').value 
                : null,
            registrationNumber: userTypeSelect.value === 'student'
                ? registrationNumberInput.value.trim()
                : null,
            facultyId: userTypeSelect.value === 'faculty'
                ? facultyIdInput.value.trim()
                : null
        };

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert(`Registration successful! ${data.user.user_type === 'student' ? 'Your student ID: ' + data.user.student_id : ''}`);
                window.location.href = 'login.html';
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    });
});