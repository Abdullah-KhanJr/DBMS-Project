// Form submission handler - async function to support await
async function handleFormSubmission(event) {
  event.preventDefault();
  
  // Get form data - matching the actual IDs in the HTML form
  const courseCode = document.getElementById('course_code').value.trim();
  const courseName = document.getElementById('course_title').value.trim();
  const creditHours = parseInt(document.getElementById('credit_hours').value);
  const section = document.getElementById('section').value;
  const description = document.getElementById('description')?.value.trim() || '';
  const semester = document.getElementById('semester')?.value.trim() || 'Spring 2025';
  
  // Log what we're submitting for debugging  console.log('Form values:');
  console.log('- courseCode:', courseCode);
  console.log('- courseName:', courseName);
  console.log('- creditHours:', creditHours);
  console.log('- section:', section);
  console.log('- description:', description);
  console.log('- semester:', semester);
  
  // Validate required fields
  const errors = [];
  if (!courseCode) errors.push('Course Code');
  if (!courseName) errors.push('Course Name');
  if (isNaN(creditHours) || creditHours < 1 || creditHours > 3) errors.push('Credit Hours');
  if (!section) errors.push('Section');
  if (!semester) errors.push('Semester');
  
  if (errors.length > 0) {
    alert(`Please fill in the following required fields: ${errors.join(', ')}`);
    return;
  }
  // Use the getFacultyId helper if available, or fallback to localStorage lookup
  let facultyId = null;
  
  if (typeof getFacultyId === 'function') {
    try {
      // Wait for the async function to complete
      facultyId = await getFacultyId();
      console.log('Retrieved faculty ID using helper function:', facultyId);
    } catch (error) {
      console.error('Error getting faculty ID with helper function:', error);
    }
  }
  
  // Fallback to direct localStorage access if helper function fails or isn't available
  if (!facultyId) {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Check all possible places where faculty ID might be stored
        facultyId = userData.facultyId || 
                   userData.faculty_id || 
                   (userData.additionalInfo && userData.additionalInfo.facultyId);
                   
        console.log('Found facultyId in userData:', facultyId);
      }
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
    }
  }
  
  // Prepare course data - use exactly the same field names as expected by backend
  const courseData = {
    course_code: courseCode,
    course_name: courseName,
    credit_hours: creditHours,
    section: section,
    description: description,
    semester: semester,
    faculty_id: facultyId // Include the faculty ID in the request
  };
  
  console.log('Submitting course data:', courseData);
    // Get status message element for feedback
  const statusMessage = document.getElementById('status-message');
  
  // Show loading state
  if (statusMessage) {
    statusMessage.className = 'status-message';
    statusMessage.textContent = 'Creating course...';
    statusMessage.style.display = 'block';
    statusMessage.style.backgroundColor = '#e3f2fd';
    statusMessage.style.color = '#1565c0';
    statusMessage.style.border = '1px solid #90caf9';
  }
  
  // Setup form button loading state if it exists
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Check if faculty ID is available
    if (!courseData.faculty_id) {
      console.warn('No faculty ID available - trying to create course without it.');
      // This is allowed as the backend will try to determine it from the user ID
    }
    
    // Send API request
    const response = await fetch('http://localhost:5000/api/faculty/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      credentials: 'include', // Include cookies for HTTP-only auth
      body: JSON.stringify(courseData)
    });
    
    // Log raw response for debugging
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('Server response:', result);
    
    if (!response.ok) {
      // Format the error message
      let errorMessage = result.message || 'Failed to create course';
      
      // If it contains the specific null faculty_id error we're working on
      if (errorMessage.includes('faculty_id') && errorMessage.includes('null value')) {
        errorMessage = 'Faculty ID missing. Please try logging out and logging in again.';
        
        // Attempt to fix by fetching faculty ID directly
        if (typeof getFacultyId === 'function') {
          if (statusMessage) {
            statusMessage.textContent = 'Trying to fix faculty ID issue...';
          }
          
          // Wait a moment to show the message
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to get faculty ID
          const facultyId = await getFacultyId();
          if (facultyId) {
            errorMessage += ' Refreshing page with updated faculty information...';
            if (statusMessage) {
              statusMessage.textContent = errorMessage;
            }
            
            // Wait 2 seconds then reload the page
            setTimeout(() => window.location.reload(), 2000);
            return;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Success handling - show message
    if (statusMessage) {
      statusMessage.className = 'status-message success';
      statusMessage.textContent = 'Course created successfully!';
    } else {
      alert('Course created successfully!');
    }
    
    // Reset form if not redirecting
    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
      courseForm.reset();
    }
    
    // Reset button state
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-plus-circle"></i> Add Course';
    }
      // Redirect to dashboard page after a short delay
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error creating course:', error);
    
    // Show error in status message
    if (statusMessage) {
      statusMessage.className = 'status-message error';
      statusMessage.textContent = 'Error: ' + error.message;
    } else {
      alert('Error creating course: ' + error.message);
    }
    
    // Reset button state
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-plus-circle"></i> Add Course';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Auth validation is now primarily handled by auth-utils.js
  // This is just a backup check
  if (!localStorage.getItem('token') || !localStorage.getItem('userData')) {
    window.location.replace('/pages/login.html');
    return;
  }
    // Load sections dropdown - hardcode sections A-F
  const sectionSelect = document.getElementById('section');
  if (sectionSelect) {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    // Clear and populate sections dropdown
    sectionSelect.innerHTML = '<option value="">Select Section</option>';
    
    sections.forEach(section => {
      const option = document.createElement('option');
      option.value = section;
      option.textContent = section;
      sectionSelect.appendChild(option);
    });
  }
  
  // Set default semester if the field exists
  const semesterField = document.getElementById('semester');
  if (semesterField && !semesterField.value) {
    semesterField.value = 'Spring 2025';
  }
    // Handle form submission - make sure we're using the correct form ID from HTML
  const courseForm = document.getElementById('add-course-form');
  if (courseForm) {
    console.log('Found course form with ID: add-course-form');
    courseForm.addEventListener('submit', handleFormSubmission);
  } else {
    console.error('Course form not found with ID: add-course-form');
    // Try to find any form and attach the handler as a fallback
    const anyForm = document.querySelector('form');
    if (anyForm) {
      console.log('Found alternate form, attaching event handler');
      anyForm.addEventListener('submit', handleFormSubmission);
    }
  }
});