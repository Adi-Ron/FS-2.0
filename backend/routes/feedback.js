import express from 'express';
import Feedback from '../models/Feedback.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Faculty from '../models/Faculty.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

function authStudent(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') throw new Error();
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Submit feedback
router.post('/', authStudent, async (req, res) => {
  const { faculty, subject, semester, year, answers, notApplicable } = req.body;
  const feedback = new Feedback({
    student: req.user.id,
    faculty,
    subject,
    semester,
    year,
    answers,
    notApplicable: !!notApplicable,
  });
  await feedback.save();
  res.json({ message: 'Feedback submitted' });
});

export default router;
