const express = require('express');
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const auth = require('../utils/authMiddleware');
const router = express.Router();

// Submit feedback (student)
router.post('/', auth('student'), async (req, res) => {
  try {
    const { id: studentId } = req.user;
    const { 
      subjectId, 
      subjectName,
      facultyId, 
      facultyName,
      answers,
      notApplicable,
      course,
      likedMost,
      improvements,
      semester,
      feedbackType = 'semester'
    } = req.body;

    // Basic validation: accept either subjectId or subjectName
    if ((!subjectId && !subjectName) || (!notApplicable && !answers)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Resolve or create subject
    let subject = null;
    if (subjectId) subject = await Subject.findById(subjectId);
    if (!subject && subjectName) {
      // For general feedback, create or find a special "General" subject
      if (subjectName === 'General' || feedbackType === 'general') {
        subject = await Subject.findOne({ 
          name: 'General',
          batch: student.batch,
          course: student.course
        });
        if (!subject) {
          subject = await Subject.create({ 
            name: 'General',
            code: 'GEN',
            batch: student.batch,
            course: student.course
          });
        }
      } else {
        subject = await Subject.findOne({ name: new RegExp(`^${subjectName.trim()}$`, 'i') });
        if (!subject) {
          subject = await Subject.create({ name: subjectName.trim() });
        }
      }
    }
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Resolve or create faculty if provided
    let faculty = null;
    if (facultyId) faculty = await Faculty.findById(facultyId);
    if (!faculty && facultyName) {
      faculty = await Faculty.findOne({ name: new RegExp(`^${facultyName.trim()}$`, 'i') });
      if (!faculty) {
        faculty = await Faculty.create({ name: facultyName.trim() });
      }
    }
    if (!notApplicable && !faculty && !facultyName && !facultyId && feedbackType !== 'general') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const feedbackDoc = await Feedback.create({
      student: studentId,
      username: student.enrollmentNo,
      subject: subject._id,
      subjectName: subject.name,
      faculty: faculty ? faculty._id : null,
      facultyName: faculty ? faculty.name : (facultyName || ''),
      semester: feedbackType === 'general' ? null : (semester ? Number(semester) : null),
      feedbackType: feedbackType,
      answers: notApplicable ? [] : answers,
      notApplicable: !!notApplicable,
      likedMost: likedMost || '',
      improvements: improvements || ''
    });

    // Update student's completed semesters or general feedback status
    if (feedbackType === 'general') {
      student.generalFeedbackCompleted = true;
    } else if (semester && !student.completedSemesters.includes(Number(semester))) {
      // Check if all subjects for this semester are completed
      // We'll mark semester as completed after all feedbacks are submitted
      // For now, we'll track it when the last feedback is submitted
      // This will be handled by checking all subjects when submitting
    }

    await student.save();

    res.json(feedbackDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark semester as completed (called after all subjects for a semester are submitted)
router.post('/complete-semester', auth('student'), async (req, res) => {
  try {
    const { id: studentId } = req.user;
    const { semester } = req.body;

    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ message: 'Invalid semester' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.completedSemesters.includes(Number(semester))) {
      student.completedSemesters.push(Number(semester));
      await student.save();
    }

    res.json({ message: 'Semester marked as completed', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
