// Test script for registration API validation
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Function to test registration with different scenarios
async function testRegistrationApi() {
  console.log('Starting registration API validation tests...');
  
  try {
    // Test 1: Valid student registration
    console.log('\n--- Test 1: Valid Student Registration ---');
    const studentData = {
      name: 'Test Student',
      email: 'u1234567@giki.edu.pk',
      password: 'password123',
      userType: 'student',
      registrationNumber: '1234567',
      faculty: 'Computer Science'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, studentData);
      console.log('✅ Student registered successfully:', response.data);
    } catch (error) {
      console.log('❌ Student registration failed:', error.response?.data || error.message);
    }
    
    // Test 2: Invalid student email format
    console.log('\n--- Test 2: Invalid Student Email Format ---');
    const invalidStudentEmail = {
      name: 'Invalid Student Email',
      email: 'student@gmail.com', // Not in correct format
      password: 'password123',
      userType: 'student',
      registrationNumber: '7654321',
      faculty: 'Mechanical Engineering'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, invalidStudentEmail);
      console.log('❌ Test failed: Registered with invalid student email', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected invalid student email:', error.response?.data);
    }
    
    // Test 3: Valid faculty registration
    console.log('\n--- Test 3: Valid Faculty Registration ---');
    const facultyData = {
      name: 'Test Faculty',
      email: 'faculty@giki.edu.pk',
      password: 'password123',
      userType: 'faculty',
      facultyId: '12345',
      department: 'Computer Science'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, facultyData);
      console.log('✅ Faculty registered successfully:', response.data);
    } catch (error) {
      console.log('❌ Faculty registration failed:', error.response?.data || error.message);
    }
    
    // Test 4: Invalid faculty ID format
    console.log('\n--- Test 4: Invalid Faculty ID Format ---');
    const invalidFacultyId = {
      name: 'Invalid Faculty ID',
      email: 'faculty2@giki.edu.pk',
      password: 'password123',
      userType: 'faculty',
      facultyId: '123', // Not 5 digits
      department: 'Electrical Engineering'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, invalidFacultyId);
      console.log('❌ Test failed: Registered with invalid faculty ID', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected invalid faculty ID:', error.response?.data);
    }
    
    // Test 5: Admin registration
    console.log('\n--- Test 5: Admin Registration ---');
    const adminData = {
      name: 'Test Admin',
      email: 'admin@giki.edu.pk',
      password: 'password123',
      userType: 'admin'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, adminData);
      console.log('✅ Admin registered successfully:', response.data);
    } catch (error) {
      console.log('❌ Admin registration failed:', error.response?.data || error.message);
    }
    
    // Test 6: Second admin registration (should fail if first succeeded)
    console.log('\n--- Test 6: Second Admin Registration (should fail) ---');
    const secondAdminData = {
      name: 'Second Admin',
      email: 'admin2@giki.edu.pk',
      password: 'password123',
      userType: 'admin'
    };
    
    try {
      const response = await axios.post(`${API_URL}/register`, secondAdminData);
      console.log('❌ Test failed: Registered a second admin', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected second admin registration:', error.response?.data);
    }
    
    // Test 7: Login with registered student
    console.log('\n--- Test 7: Login with registered student ---');
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: 'u1234567@giki.edu.pk',
        password: 'password123'
      });
      console.log('✅ Student login successful:', response.data);
      
      // Test 8: Get user profile with token
      if (response.data.token) {
        console.log('\n--- Test 8: Get user profile with token ---');
        try {
          const profileResponse = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          console.log('✅ Profile fetched successfully:', profileResponse.data);
        } catch (error) {
          console.log('❌ Profile fetch failed:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }
    
    // Test 9: Check if admin exists
    console.log('\n--- Test 9: Check if admin exists ---');
    try {
      const response = await axios.get(`${API_URL}/admin/exists`);
      console.log('✅ Admin exists check:', response.data);
    } catch (error) {
      console.log('❌ Admin exists check failed:', error.response?.data || error.message);
    }
    
    console.log('\nAll registration API tests completed.');
    
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

testRegistrationApi();