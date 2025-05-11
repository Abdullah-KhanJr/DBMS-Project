// Test script to verify course creation
const axios = require('axios');

async function testCourseCreation() {
  try {
    // You'll need to login first to get a token
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'faculty@test.com',
      password: 'password123'
    });
    
    const token = authResponse.data.token;
    console.log('Login successful. Got token:', token);
    
    // Try to create a course
    const courseData = {
      course_code: "CS324",
      course_name: "Advanced Database Systems",
      credit_hours: 3,
      section: "A",
      description: "Advanced topics in database systems",
      semester: "Spring 2025"
    };
    
    console.log('Creating course with data:', courseData);
    
    const response = await axios.post('http://localhost:5000/api/faculty/courses', 
      courseData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Course created successfully!');
    console.log(response.data);
    
  } catch (error) {
    console.error('Error testing course creation:');
    console.error(error.response ? error.response.data : error.message);
  }
}

testCourseCreation();
