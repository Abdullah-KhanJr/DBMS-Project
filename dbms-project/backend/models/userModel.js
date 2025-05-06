const pool = require('../config/db');

class UserModel {
  // Find user by email with role information
  static async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, 
        s.registration_number, s.faculty as student_faculty,
        f.faculty_id, f.department as faculty_dept,
        a.admin_id
        FROM users u
        LEFT JOIN students s ON u.user_id = s.user_id
        LEFT JOIN faculty f ON u.user_id = f.user_id
        LEFT JOIN admin a ON u.user_id = a.user_id
        WHERE u.email = $1
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  // Find user by ID with role information
  static async findById(userId) {
    try {
      const query = `
        SELECT u.*, 
        s.registration_number, s.faculty as student_faculty,
        f.faculty_id, f.department as faculty_dept,
        a.admin_id
        FROM users u
        LEFT JOIN students s ON u.user_id = s.user_id
        LEFT JOIN faculty f ON u.user_id = f.user_id
        LEFT JOIN admin a ON u.user_id = a.user_id
        WHERE u.user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  // Create a new user in a transaction
  static async create(userData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert into users table
      const userQuery = `
        INSERT INTO users (name, email, password, user_type) 
        VALUES ($1, $2, $3, $4) 
        RETURNING user_id, name, email, user_type
      `;
      const userResult = await client.query(userQuery, [
        userData.name, 
        userData.email, 
        userData.password, 
        userData.userType
      ]);
      
      const user = userResult.rows[0];
      
      // Based on user type, insert into appropriate role table
      if (userData.userType === 'student') {
        await client.query(
          `INSERT INTO students (user_id, registration_number, faculty) 
          VALUES ($1, $2, $3)`,
          [user.user_id, userData.registrationNumber, userData.faculty]
        );
      } else if (userData.userType === 'faculty') {
        await client.query(
          `INSERT INTO faculty (faculty_id, user_id, department) 
          VALUES ($1, $2, $3)`,
          [userData.facultyId, user.user_id, userData.department]
        );
      } else if (userData.userType === 'admin') {
        await client.query(
          `INSERT INTO admin (user_id) VALUES ($1)`,
          [user.user_id]
        );
      }
      
      await client.query('COMMIT');
      return user;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if any admin already exists
  static async adminExists() {
    try {
      const result = await pool.query('SELECT 1 FROM admin LIMIT 1');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking if admin exists:', error);
      throw error;
    }
  }
}

module.exports = UserModel;