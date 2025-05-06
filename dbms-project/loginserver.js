// Check authentication status immediately when script loads
if (localStorage.getItem('authToken')) {
  const userData = JSON.parse(localStorage.getItem('userData'));
  window.location.href = `${userData.user_type}-dashboard.html`;
}

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  // Enhanced email validation
  function validateEmail() {
      const email = emailInput.value.trim();
      const isValid = /^u\d{7}@giki\.edu\.pk$/.test(email) || 
                    /^[a-zA-Z.]+@giki\.edu\.pk$/.test(email);
      
      if (!email) {
          emailError.textContent = 'Email is required';
          emailError.style.display = 'block';
          return false;
      }
      
      if (!isValid) {
          emailError.textContent = 'Please enter a valid GIKI email address';
          emailError.style.display = 'block';
          return false;
      }
      
      emailError.style.display = 'none';
      return true;
  }

  // Enhanced password validation
  function validatePassword() {
      const password = passwordInput.value;
      
      if (!password) {
          passwordError.textContent = 'Password is required';
          passwordError.style.display = 'block';
          return false;
      }
      
      if (password.length < 8) {
          passwordError.textContent = 'Password must be at least 8 characters';
          passwordError.style.display = 'block';
          return false;
      }
      
      passwordError.style.display = 'none';
      return true;
  }

  // Real-time validation
  emailInput.addEventListener('input', validateEmail);
  passwordInput.addEventListener('input', validatePassword);

  // Form submission with proper validation
  loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      
      if (!isEmailValid || !isPasswordValid) {
          return;
      }
      
      try {
          const response = await fetch('http://localhost:5001/api/login', {
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

          if (!response.ok) {
              throw new Error(data.error || 'Login failed');
          }

          if (data.success) {
              // Store token and user data
              localStorage.setItem('authToken', data.token);
              localStorage.setItem('userData', JSON.stringify(data.user));
              
              // Redirect to appropriate dashboard
              const dashboardPath = data.redirectTo || `${data.user.user_type}-dashboard.html`;
              window.location.href = dashboardPath;
          } else {
              alert(`Error: ${data.error}`);
          }
      } catch (error) {
          console.error('Login error:', error);
          passwordError.textContent = 'Invalid email or password';
          passwordError.style.display = 'block';
          emailInput.focus();
      }
  });
});