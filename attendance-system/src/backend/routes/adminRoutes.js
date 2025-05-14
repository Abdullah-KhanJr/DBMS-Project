const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Admin: Get all courses with faculty and section info
router.get('/courses', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.course_id, c.course_code, c.course_title, c.section, c.faculty_id, u.name AS instructor_name
             FROM courses c
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             LEFT JOIN users u ON f.user_id = u.user_id`
        );
        res.json({ courses: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 