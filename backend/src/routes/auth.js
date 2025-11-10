const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const router = express.Router();

// Import students from Excel if needed
router.post('/import-students', async (req, res) => {
  try {
    const importStudents = require('../utils/importStudents');
    await importStudents();
    res.json({ message: 'Students imported successfully' });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ message: 'Error importing students' });
  }
});

// Student login with enrollment number
router.post('/student-login', async (req, res) => {
  try {
    // Normalize and trim input to avoid mismatches from whitespace or types
    const enrollmentNo = req.body.enrollmentNo ? req.body.enrollmentNo.toString().trim() : '';
    const password = req.body.password ? req.body.password.toString().trim() : '';
    if (!enrollmentNo || !password) {
      return res.status(400).json({ message: 'Enrollment number and password required' });
    }

    // Find student by trimmed enrollment number
    console.log(`Login attempt for enrollmentNo='${enrollmentNo}'`);
    const student = await Student.findOne({ enrollmentNo });
    if (!student) {
      console.log(`Student not found for enrollmentNo='${enrollmentNo}'`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      console.log(`Password mismatch for enrollmentNo='${enrollmentNo}' (provided password did not match stored hash)`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'supersecret_jwt_key',
      { expiresIn: '8h' }
    );

    // Remove sensitive fields before returning the student object
    const studentObj = student.toObject ? student.toObject() : { ...student };
    if (studentObj.password) delete studentObj.password;
    res.json({ token, student: studentObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login (hardcoded)
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'supersecret_jwt_key',
        { expiresIn: '24h' }
      );
      res.json({ token, message: 'Admin logged in successfully' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
