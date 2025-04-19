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
    const registrationNumberGroup = document.getElementById('registrationNumberGroup');
    const registrationNumberInput = document.getElementById('registrationNumber');
    const regNumberError = document.getElementById('regNumberError');
    const facultyIdGroup = document.getElementById('facultyIdGroup');
    const facultyIdInput = document.getElementById('facultyId');
    const facultyIdError = document.getElementById('facultyIdError');

    console.log("Registration form loaded");

    // Toggle visibility based on user type
    userTypeSelect.addEventListener('change', function() {
        const isStudent = this.value === 'student';
        const isFaculty = this.value === 'faculty';
        
        studentFacultyGroup.style.display = isStudent ? 'block' : 'none';
        registrationNumberGroup.style.display = isStudent ? 'block' : 'none';
        facultyDeptGroup.style.display = isFaculty ? 'block' : 'none';
        facultyIdGroup.style.display = isFaculty ? 'block' : 'none';
        
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

    // Validate student registration number
    function validateRegNumber() {
        if (userTypeSelect.value !== 'student') return true;

        const regNumber = registrationNumberInput.value.trim();
        const isValid = /^[0-9]{7}$/.test(regNumber);

        regNumberError.textContent = isValid ? '' : 'Enter valid registration number';
        regNumberError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }

    // Validate faculty ID
    function validateFacultyId() {
        if (userTypeSelect.value !== 'faculty') return true;

        const facultyId = facultyIdInput.value.trim();
        const isValid = /^[0-9]{5}$/.test(facultyId); // Adjust this if pattern differs

        facultyIdError.textContent = isValid ? '' : 'Enter valid Faculty ID';
        facultyIdError.style.display = isValid ? 'none' : 'block';
        return isValid;
    }

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
            password: passwordInput.value, // Original password
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
                alert(`Registration successful!`);
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
