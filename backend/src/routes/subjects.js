
const express = require('express');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const auth = require('../utils/authMiddleware');
const router = express.Router();

// Get all faculty (for compatibility with frontend)
router.get('/faculty', async (req, res) => {
  try {
    const facultyList = await Faculty.find();
    res.json(facultyList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get faculty for a subject (for compatibility with frontend)
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId).populate('faculties');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject.faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subjects by semester
router.get('/semester/:semester', auth(), async (req, res) => {
  try {
    const semester = Number(req.params.semester);
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ message: 'Invalid semester. Must be between 1 and 8' });
    }
    
    // Get student info to filter by batch and course
    const studentId = req.user?.id;
    let student = null;
    if (studentId) {
      const Student = require('../models/Student');
      student = await Student.findById(studentId);
    }
    
    // Build query - must have semesterOptions matching the semester
    // semesterOptions is an array of strings, so we check if it contains the semester number as a string
    const semesterStr = semester.toString();
    
    // Try multiple patterns to match semester (for flexibility)
    const semesterPatterns = [
      semesterStr, // "1", "2", etc.
      `Semester ${semester}`, // "Semester 1"
      `Sem ${semester}`, // "Sem 1"
      `${semester}st`, // "1st"
      `${semester}nd`, // "2nd"
      `${semester}rd`, // "3rd"
      `${semester}th`, // "4th", etc.
    ];
    
    const query = {
      semesterOptions: { $in: semesterPatterns }
    };
    
    // Filter by batch and course if student info is available
    // Use exact match - admin-specified batch/course during import are authoritative
    if (student && student.batch && student.course) {
      query.batch = student.batch;
      // Case-insensitive exact match for course
      query.course = { $regex: new RegExp(`^${student.course.trim()}$`, 'i') };
    }
    
    // Find subjects - only those with matching semester
    let subjects = await Subject.find(query).populate('faculties');
    
    console.log(`Query:`, JSON.stringify(query, null, 2));
    console.log(`Found ${subjects.length} subjects for semester ${semester}, batch ${student?.batch}, course ${student?.course}`);
    
    if (subjects.length > 0) {
      console.log('Subjects found:', subjects.map(s => ({
        code: s.code,
        name: s.name,
        semesterOptions: s.semesterOptions,
        batch: s.batch,
        course: s.course,
        facultiesCount: s.faculties?.length || 0
      })));
    } else {
      // Log what subjects exist for debugging
      const debugQuery = {};
      if (student && student.batch && student.course) {
        debugQuery.batch = student.batch;
        debugQuery.course = { $regex: new RegExp(`^${student.course}$`, 'i') };
      }
      const allSubjects = await Subject.find(debugQuery).limit(10);
      console.log(`No subjects found for semester ${semester}. Available subjects for batch ${student?.batch}, course ${student?.course}:`, 
        allSubjects.map(s => ({
          code: s.code,
          name: s.name,
          semesterOptions: s.semesterOptions
        }))
      );
    }
    
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all subjects (optionally filter by year)
router.get('/', auth(), async (req, res) => {
  try {
    const { year } = req.query;
    const q = {};
    if (year) q.year = Number(year);
    const subjects = await Subject.find(q).populate('faculties');
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin can create subjects
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { code, name, year, semesterOptions, faculties } = req.body;
    const subject = await Subject.create({ code, name, year, semesterOptions, faculties });
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get faculties for a subject
router.get('/:id/faculties', auth(), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('faculties');
    if (!subject) return res.status(404).json({ message: 'Not found' });
    res.json(subject.faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
