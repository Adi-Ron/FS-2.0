import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';

const router = express.Router();

// Student login
router.post('/student-login', async (req, res) => {
  const { enrollmentNo, password } = req.body;
  
  try {
    console.log('Looking for student with enrollment:', enrollmentNo);
    const student = await Student.findOne({ enrollmentNo });
    
    if (!student) {
      console.log(`Student not found for enrollmentNo='${enrollmentNo}'`);
      // Let's check what students exist in the database
      const allStudents = await Student.find({}, 'enrollmentNo');
      console.log('Available students in database:', allStudents.map(s => s.enrollmentNo));
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      console.log(`Invalid password for enrollmentNo='${enrollmentNo}'`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, student });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login
router.post('/admin', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid admin credentials' });
});

export default router;
