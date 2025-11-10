import express from 'express';
import Feedback from '../models/Feedback.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

const router = express.Router();

function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get all feedbacks (optionally filter by faculty/subject)
router.get('/feedbacks', authAdmin, async (req, res) => {
  const { faculty, subject } = req.query;
  const filter = {};
  if (faculty) filter.faculty = faculty;
  if (subject) filter.subject = subject;
  const feedbacks = await Feedback.find(filter).populate('student faculty subject');
  res.json(feedbacks);
});

// Get all students
router.get('/students', authAdmin, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// Get all faculties
router.get('/faculties', authAdmin, async (req, res) => {
  const faculties = await Faculty.find();
  res.json(faculties);
});

// Get all subjects
router.get('/subjects', authAdmin, async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
});

// Download PDF report for a feedback
router.get('/report/:feedbackId', authAdmin, async (req, res) => {
  const feedback = await Feedback.findById(req.params.feedbackId).populate('student faculty subject');
  if (!feedback) return res.status(404).json({ message: 'Not found' });
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
  doc.pipe(res);
  doc.fontSize(16).text('Feedback Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Student: ${feedback.student.name} (${feedback.student.enrollment})`);
  doc.text(`Faculty: ${feedback.faculty.name}`);
  doc.text(`Subject: ${feedback.subject.name}`);
  doc.text(`Semester: ${feedback.semester}`);
  doc.text(`Year: ${feedback.year}`);
  doc.moveDown();
  feedback.answers.forEach((a, i) => {
    doc.text(`${i + 1}. ${a.question}: ${a.rating}`);
  });
  doc.end();
});

export default router;
