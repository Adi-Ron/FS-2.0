const express = require('express');
const Feedback = require('../models/Feedback');
const Setting = require('../models/Setting');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const auth = require('../utils/authMiddleware');
const pdfGenerator = require('../utils/pdfGenerator');

const router = express.Router();

// Toggle or get portal status
router.get('/portal-status', auth('admin'), async (req, res) => {
  try {
    const s = await Setting.findOne({ key: 'portalEnabled' });
    res.json({ enabled: s ? !!s.value : true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/portal-status', auth('admin'), async (req, res) => {
  try {
    const { enabled } = req.body;
    let s = await Setting.findOneAndUpdate({ key: 'portalEnabled' }, { value: !!enabled, updatedAt: new Date() }, { new: true, upsert: true });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedbacks with filters
router.get('/feedbacks', auth('admin'), async (req, res) => {
  try {
    const { facultyId, subjectId, enrollment } = req.query;
    const q = {};
    if (facultyId) q.faculty = facultyId;
    if (subjectId) q.subject = subjectId;
    if (enrollment) q.enrollment = enrollment;

    const feedbacks = await Feedback.find(q).populate('student').populate('faculty').populate('subject');
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PDF of a single feedback
router.get('/feedbacks/:id/pdf', auth('admin'), async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id).populate('student').populate('faculty').populate('subject');
    if (!fb) return res.status(404).json({ message: 'Not found' });

    const buffer = await pdfGenerator.generateFeedbackPDF(fb);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=feedback_${fb.enrollment}_${fb._id}.pdf`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get faculties for a specific batch/course/semester
router.get('/faculties', auth('admin'), async (req, res) => {
  try {
    const { batch, course, semester } = req.query;
    
    if (!batch || !course) {
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    // Find subjects for the given batch, course, and semester
    const query = {
      batch: Number(batch),
      course: course.toUpperCase()
    };

    if (semester) {
      query.semesterOptions = semester.toString();
    }

    const subjects = await Subject.find(query).populate('faculties');
    
    // Extract unique faculties
    const facultyMap = new Map();
    subjects.forEach(subject => {
      subject.faculties.forEach(faculty => {
        if (!facultyMap.has(faculty._id.toString())) {
          facultyMap.set(faculty._id.toString(), {
            _id: faculty._id,
            name: faculty.name,
            email: faculty.email,
            department: faculty.department
          });
        }
      });
    });

    const faculties = Array.from(facultyMap.values());
    res.json({ faculties });
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get faculty report
router.get('/faculty-report', auth('admin'), async (req, res) => {
  try {
    const { batch, course, semester, facultyId } = req.query;
    
    if (!batch || !course) {
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    // Get all students in the batch and course
    const students = await Student.find({ batch: Number(batch), course: course.toUpperCase() });
    const totalStudents = students.length;

    // Get all feedbacks for the specified filters
    const query = {
      feedbackType: 'semester',
      notApplicable: false
    };

    if (semester) {
      query.semester = Number(semester);
    }

    if (facultyId) {
      query.faculty = facultyId;
    }

    // Get students who have submitted feedback
    const feedbacks = await Feedback.find(query)
      .populate('student')
      .populate('faculty');

    // Filter by batch and course
    const relevantFeedbacks = feedbacks.filter(fb => {
      const student = fb.student;
      return student && student.batch === Number(batch) && student.course === course.toUpperCase();
    });

    const studentsWhoFilled = new Set(relevantFeedbacks.map(fb => fb.student._id.toString()));
    const studentsFilledCount = studentsWhoFilled.size;

    // Calculate rating percentages (1-4 scale)
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalRatings = 0;

    relevantFeedbacks.forEach(fb => {
      if (fb.answers && fb.answers.length > 0) {
        fb.answers.forEach(answer => {
          if (answer.rating >= 1 && answer.rating <= 4) {
            ratingCounts[answer.rating]++;
            totalRatings++;
          }
        });
      }
    });

    const ratingPercentages = {};
    Object.keys(ratingCounts).forEach(rating => {
      ratingPercentages[rating] = totalRatings > 0 
        ? ((ratingCounts[rating] / totalRatings) * 100).toFixed(2) 
        : '0.00';
    });

    // Calculate average score percentage (out of max rating of 4)
    let totalScore = 0;
    Object.keys(ratingCounts).forEach(rating => {
      totalScore += parseInt(rating) * ratingCounts[rating];
    });
    const averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;
    const averagePercentage = ((averageRating / 4) * 100).toFixed(2); // Out of 4 max rating

    res.json({
      totalStudents,
      studentsFilledCount,
      studentsFilledPercentage: totalStudents > 0 
        ? ((studentsFilledCount / totalStudents) * 100).toFixed(2) 
        : '0.00',
      averageRating: averageRating.toFixed(2),
      averagePercentage: averagePercentage,
      ratingCounts,
      ratingPercentages,
      totalRatings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student report
router.get('/student-report', auth('admin'), async (req, res) => {
  try {
    const { batch, course } = req.query;
    
    if (!batch || !course) {
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    // Get all students in the batch and course who have submitted feedback
    const students = await Student.find({ 
      batch: Number(batch), 
      course: course.toUpperCase(),
      $or: [
        { completedSemesters: { $exists: true, $ne: [] } },
        { generalFeedbackCompleted: true }
      ]
    }).select('name enrollmentNo batch course');

    // Get feedbacks for these students
    const studentIds = students.map(s => s._id);
    const feedbacks = await Feedback.find({
      student: { $in: studentIds },
      feedbackType: 'semester',
      notApplicable: false
    })
      .populate('student')
      .populate('faculty')
      .populate('subject');

    // Group feedbacks by student
    const studentReports = students.map(student => {
      const studentFeedbacks = feedbacks.filter(fb => 
        fb.student._id.toString() === student._id.toString()
      );

      // Group by faculty
      const facultyGroups = {};
      studentFeedbacks.forEach(fb => {
        if (fb.faculty && fb.facultyName) {
          const facultyKey = fb.faculty._id.toString();
          if (!facultyGroups[facultyKey]) {
            facultyGroups[facultyKey] = {
              facultyId: fb.faculty._id,
              facultyName: fb.facultyName,
              subjects: [],
              ratings: []
            };
          }
          
          // Add subject and ratings
          if (fb.subject) {
            facultyGroups[facultyKey].subjects.push({
              subjectId: fb.subject._id,
              subjectName: fb.subjectName,
              semester: fb.semester
            });
          }

          // Add all ratings
          if (fb.answers && fb.answers.length > 0) {
            fb.answers.forEach(answer => {
              facultyGroups[facultyKey].ratings.push({
                question: answer.question,
                rating: answer.rating,
                category: answer.category
              });
            });
          }
        }
      });

      return {
        studentId: student._id,
        name: student.name,
        enrollmentNo: student.enrollmentNo,
        facultyFeedback: Object.values(facultyGroups)
      };
    });

    res.json(studentReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get general feedback report
router.get('/general-feedback-report', auth('admin'), async (req, res) => {
  try {
    const { batch, course } = req.query;
    
    if (!batch || !course) {
      return res.status(400).json({ message: 'Batch and course are required' });
    }

    // Get all students in the batch and course
    const students = await Student.find({ 
      batch: Number(batch), 
      course: course.toUpperCase() 
    });
    const totalStudents = students.length;

    // Get general feedbacks
    const feedbacks = await Feedback.find({
      feedbackType: 'general'
    })
      .populate('student');

    // Filter by batch and course
    const relevantFeedbacks = feedbacks.filter(fb => {
      const student = fb.student;
      return student && student.batch === Number(batch) && student.course === course.toUpperCase();
    });

    const studentsFilledCount = relevantFeedbacks.length;

    // Prepare individual feedback responses with full details
    const feedbackDetails = relevantFeedbacks.map(fb => ({
      feedbackId: fb._id,
      studentName: fb.student.name,
      enrollmentNo: fb.student.enrollmentNo,
      answers: fb.answers || [],
      likedMost: fb.likedMost || 'N/A',
      improvements: fb.improvements || 'N/A',
      submittedAt: fb.submittedAt
    }));

    res.json({
      totalStudents,
      studentsFilledCount,
      studentsFilledPercentage: totalStudents > 0 
        ? ((studentsFilledCount / totalStudents) * 100).toFixed(2) 
        : '0.00',
      feedbackDetails
    });
  } catch (err) {
    console.error('Error fetching general feedback report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
