// Form submission handler
async function handleFormSubmission(event) {
  event.preventDefault();
  
  // Get form data
  const courseCode = document.getElementById('courseCode').value.trim();
  const courseName = document.getElementById('courseName').value.trim();
  const creditHours = parseInt(document.getElementById('creditHours').value);
  const sectionId = document.getElementById('sectionId').value;
  const description = document.getElementById('description')?.value.trim() || '';
  const semester = document.getElementById('semester')?.value.trim() || 'Spring 2025';
  
  // Log what we're submitting for debugging
  console.log('Form values:');
  console.log('- courseCode:', courseCode);
  console.log('- courseName:', courseName);
  console.log('- creditHours:', creditHours);
  console.log('- sectionId:', sectionId);
  console.log('- description:', description);
  console.log('- semester:', semester);
  
  // Validate required fields
  const errors = [];
  if (!courseCode) errors.push('Course Code');
  if (!courseName) errors.push('Course Name');
  if (isNaN(creditHours) || creditHours < 1 || creditHours > 3) errors.push('Credit Hours');
  if (!sectionId) errors.push('Section');
  if (!semester) errors.push('Semester');
  
  if (errors.length > 0) {
    alert(`Please fill in the following required fields: ${errors.join(', ')}`);
    return;
  }
  
  // Prepare course data - use exactly the same field names as expected by backend
  const courseData = {
    course_code: courseCode,
    course_name: courseName,
    credit_hours: creditHours,
    section_id: sectionId,
    description: description,
    semester: semester
  };
  
  console.log('Submitting course data:', courseData);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Send API request
    const response = await fetch('http://localhost:5000/api/faculty/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    
    // Log raw response for debugging
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('Server response:', result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create course');
    }
    
    alert('Course created successfully!');
    // Redirect to courses page
    window.location.href = './courses.html';
    
  } catch (error) {
    console.error('Error creating course:', error);
    alert('Error creating course: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../login.html';
    return;
  }
  
  // Load sections dropdown - hardcode sections A-F
  const sectionSelect = document.getElementById('sectionId');
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
  
  // Handle form submission
  const courseForm = document.getElementById('courseForm');
  if (courseForm) {
    courseForm.addEventListener('submit', handleFormSubmission);
  }
});