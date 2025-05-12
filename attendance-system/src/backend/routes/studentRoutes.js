const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Route to check if a student exists by registration number
router.get('/check/:regNumber', authMiddleware, roleMiddleware('faculty'), async (req, res) => {
    try {
        const { regNumber } = req.params;
        
        // Check if student exists
        const result = await db.query(
            `SELECT s.registration_number, u.name, u.email, s.faculty
             FROM students s
             JOIN users u ON s.user_id = u.user_id
             WHERE s.registration_number = $1`,
            [regNumber]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            student: result.rows[0]
        });
    } catch (error) {
        console.error('Error checking student:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check student',
            error: error.message
        });
    }
});

module.exports = router;
