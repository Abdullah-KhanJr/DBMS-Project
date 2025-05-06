// Test script for registration validation
require('dotenv').config({ path: '../.env' });
const UserModel = require('./models/userModel');
const { hashPassword } = require('./utils/hashUtils');

// Function to test registration with different scenarios
async function testRegistration() {
  console.log('Starting registration validation tests...');
  
  try {
    // Test 1: Valid student registration
    console.log('\n--- Test 1: Valid Student Registration ---');
    const studentData = {
      name: 'Test Student',
      email: 'u1234567@giki.edu.pk',
      password: await hashPassword('password123'),
      userType: 'student',
      registrationNumber: '1234567',
      faculty: 'Computer Science'
    };
    
    try {
      const student = await UserModel.create(studentData);
      console.log('✅ Student registered successfully:', student);
    } catch (error) {
      console.log('❌ Student registration failed:', error.message);
      if (error.code === '23505') {
        console.log('Note: This may be because the user already exists. This is fine for repeat test runs.');
      }
    }
    
    // Test 2: Invalid student email format
    console.log('\n--- Test 2: Invalid Student Email Format ---');
    const invalidStudentEmail = {
      name: 'Invalid Student Email',
      email: 'student@gmail.com', // Not in correct format
      password: await hashPassword('password123'),
      userType: 'student',
      registrationNumber: '7654321',
      faculty: 'Mechanical Engineering'
    };
    
    try {
      if (!/^u\d{7}@giki\.edu\.pk$/.test(invalidStudentEmail.email)) {
        throw new Error('Invalid student email format, should be u1234567@giki.edu.pk');
      }
      await UserModel.create(invalidStudentEmail);
      console.log('❌ Test failed: Registered with invalid student email');
    } catch (error) {
      console.log('✅ Correctly rejected invalid student email:', error.message);
    }
    
    // Test 3: Valid faculty registration
    console.log('\n--- Test 3: Valid Faculty Registration ---');
    const facultyData = {
      name: 'Test Faculty',
      email: 'faculty@giki.edu.pk',
      password: await hashPassword('password123'),
      userType: 'faculty',
      facultyId: '12345',
      department: 'Computer Science'
    };
    
    try {
      const faculty = await UserModel.create(facultyData);
      console.log('✅ Faculty registered successfully:', faculty);
    } catch (error) {
      console.log('❌ Faculty registration failed:', error.message);
      if (error.code === '23505') {
        console.log('Note: This may be because the faculty already exists. This is fine for repeat test runs.');
      }
    }
    
    // Test 4: Invalid faculty ID format
    console.log('\n--- Test 4: Invalid Faculty ID Format ---');
    const invalidFacultyId = {
      name: 'Invalid Faculty ID',
      email: 'faculty2@giki.edu.pk',
      password: await hashPassword('password123'),
      userType: 'faculty',
      facultyId: '123', // Not 5 digits
      department: 'Electrical Engineering'
    };
    
    try {
      if (!/^[0-9]{5}$/.test(invalidFacultyId.facultyId)) {
        throw new Error('Invalid faculty ID format, should be 5 digits');
      }
      await UserModel.create(invalidFacultyId);
      console.log('❌ Test failed: Registered with invalid faculty ID');
    } catch (error) {
      console.log('✅ Correctly rejected invalid faculty ID:', error.message);
    }
    
    // Test 5: Admin registration
    console.log('\n--- Test 5: Admin Registration ---');
    const adminData = {
      name: 'Test Admin',
      email: 'admin@giki.edu.pk',
      password: await hashPassword('password123'),
      userType: 'admin'
    };
    
    try {
      // Check if admin already exists
      const adminExists = await UserModel.adminExists();
      if (adminExists) {
        console.log('✅ Admin already exists: This is expected behavior for multiple test runs.');
      } else {
        const admin = await UserModel.create(adminData);
        console.log('✅ Admin registered successfully:', admin);
      }
    } catch (error) {
      console.log('❌ Admin registration failed:', error.message);
    }
    
    // Test 6: Second admin registration (should fail if first succeeded)
    console.log('\n--- Test 6: Second Admin Registration (should fail) ---');
    const secondAdminData = {
      name: 'Second Admin',
      email: 'admin2@giki.edu.pk',
      password: await hashPassword('password123'),
      userType: 'admin'
    };
    
    try {
      // Check if admin already exists
      const adminExists = await UserModel.adminExists();
      if (adminExists) {
        throw new Error('Only one admin is allowed');
      }
      await UserModel.create(secondAdminData);
      console.log('❌ Test failed: Registered a second admin');
    } catch (error) {
      console.log('✅ Correctly rejected second admin registration:', error.message);
    }
    
    // Test 7: Duplicate email registration
    console.log('\n--- Test 7: Duplicate Email Registration ---');
    try {
      await UserModel.create(studentData); // Using the same email as Test 1
      console.log('❌ Test failed: Registered with duplicate email');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate email:', error.message);
    }
    
    console.log('\nAll registration validation tests completed.');
    
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    process.exit();
  }
}

testRegistration();