const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const authMiddleware = require('../utils/authMiddleware');

// Update student semester
router.put('/update-semester', authMiddleware(), async (req, res) => {
    try {
        const { semester } = req.body;
        if (!semester || ![3, 5].includes(Number(semester))) {
            return res.status(400).json({ message: 'Invalid semester. Must be 3 or 5' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        student.currentSemester = Number(semester);
        await student.save();

        res.json({ message: 'Semester updated successfully', student });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student details
router.get('/details', authMiddleware(), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available semesters for student based on their batch and course
router.get('/available-semesters', authMiddleware(), async (req, res) => {
    try {
        console.log('Available semesters endpoint called, user:', req.user);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            console.log('Student not found for id:', req.user.id);
            return res.status(404).json({ message: 'Student not found' });
        }

        console.log('Fetching available semesters for student:', {
            id: student._id,
            batch: student.batch,
            course: student.course,
            enrollmentNo: student.enrollmentNo
        });

        // Check if student has batch and course
        if (!student.batch || !student.course) {
            console.error('Student missing batch or course:', {
                batch: student.batch,
                course: student.course
            });
            return res.status(400).json({ 
                message: 'Student batch or course not set. Please contact administrator.',
                semesters: [],
                completedSemesters: student.completedSemesters || [],
                generalFeedbackCompleted: student.generalFeedbackCompleted || false
            });
        }

        const Subject = require('../models/Subject');
        
        // IMPORTANT: Use exact match for batch and course
        // The admin-specified batch and course during import are authoritative
        // Student's batch and course should match exactly what was specified during import
        const studentBatch = student.batch;
        const studentCourse = student.course.toUpperCase().trim();
        
        console.log(`Finding subjects for student: Batch ${studentBatch}, Course "${studentCourse}"`);
        
        // Find subjects with exact batch and course match (case-insensitive for course)
        let subjects = await Subject.find({
            batch: studentBatch,
            course: { $regex: new RegExp(`^${studentCourse}$`, 'i') }
        });
        
        console.log(`Found ${subjects.length} subjects for batch ${studentBatch}, course ${studentCourse}`);
        
        // If still no subjects, try without course filter to see what's available
        if (subjects.length === 0) {
            const allSubjectsForBatch = await Subject.find({ batch: student.batch }).limit(10);
            console.log(`No subjects found for batch ${student.batch}, course ${student.course}`);
            console.log(`Available courses for batch ${student.batch}:`, 
                [...new Set(allSubjectsForBatch.map(s => s.course))].join(', ')
            );
            console.log('Sample subjects in database:', allSubjectsForBatch.map(s => ({
                code: s.code,
                name: s.name,
                course: s.course,
                batch: s.batch,
                semesterOptions: s.semesterOptions
            })));
            
            // Also check all subjects in database
            const allSubjectsCount = await Subject.countDocuments();
            const allBatches = await Subject.distinct('batch');
            const allCourses = await Subject.distinct('course');
            console.log(`Total subjects in database: ${allSubjectsCount}`);
            console.log(`Available batches: ${allBatches.join(', ')}`);
            console.log(`Available courses: ${allCourses.join(', ')}`);
        } else {
            // Log sample subjects for debugging
            console.log('Sample subjects found:', subjects.slice(0, 3).map(s => ({
                code: s.code,
                name: s.name,
                course: s.course,
                batch: s.batch,
                semesterOptions: s.semesterOptions,
                semesterOptionsType: typeof s.semesterOptions,
                semesterOptionsIsArray: Array.isArray(s.semesterOptions)
            })));
        }

        // Extract unique semesters from semesterOptions
        // Only include numeric semesters (1-8), exclude "General" or other non-numeric values
        const availableSemesters = new Set();
        const semesterCounts = {};
        let subjectsWithNoSemesters = 0;
        let subjectsWithInvalidSemesters = 0;
        
        subjects.forEach((subject, index) => {
            if (!subject.semesterOptions) {
                subjectsWithNoSemesters++;
                console.warn(`Subject ${subject.code} (${subject.name}) has no semesterOptions`);
                return;
            }
            
            if (!Array.isArray(subject.semesterOptions)) {
                subjectsWithInvalidSemesters++;
                console.warn(`Subject ${subject.code} (${subject.name}) has invalid semesterOptions (not an array):`, 
                    typeof subject.semesterOptions, subject.semesterOptions);
                return;
            }
            
            if (subject.semesterOptions.length === 0) {
                subjectsWithNoSemesters++;
                console.warn(`Subject ${subject.code} (${subject.name}) has empty semesterOptions array`);
                return;
            }
            
            subject.semesterOptions.forEach(sem => {
                // Only parse numeric semesters, ignore "General" or other text
                const semStr = sem ? sem.toString().trim() : '';
                if (!semStr) return;
                
                const semNum = parseInt(semStr);
                
                // Only include if it's a valid number between 1-8 
                if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
                    // Additional check: make sure it's actually a number, not something like "1st" or "Semester 1"
                    // We want only pure numbers like "1", "2", etc.
                    // But also accept "1st", "2nd" etc. by extracting the number
                    if (semStr === semNum.toString() || /^[1-8]$/.test(semStr)) {
                        availableSemesters.add(semNum);
                        semesterCounts[semNum] = (semesterCounts[semNum] || 0) + 1;
                    } else {
                        // Try to extract number from strings like "1st", "2nd", etc.
                        const numMatch = semStr.match(/^(\d+)/);
                        if (numMatch) {
                            const extractedNum = parseInt(numMatch[1]);
                            if (extractedNum >= 1 && extractedNum <= 8) {
                                availableSemesters.add(extractedNum);
                                semesterCounts[extractedNum] = (semesterCounts[extractedNum] || 0) + 1;
                            }
                        }
                    }
                }
            });
        });
        
        console.log('Semester extraction summary:');
        console.log(`- Subjects with no semesterOptions: ${subjectsWithNoSemesters}`);
        console.log(`- Subjects with invalid semesterOptions: ${subjectsWithInvalidSemesters}`);
        console.log(`- Semester counts (subjects per semester):`, semesterCounts);
        console.log(`- All subjects and their semesterOptions:`, subjects.map(s => ({
            code: s.code,
            name: s.name,
            semesterOptions: s.semesterOptions,
            semesterOptionsType: typeof s.semesterOptions
        })));

        // Convert to sorted array (only numeric semesters)
        const semesters = Array.from(availableSemesters).sort((a, b) => a - b);
        
        // Note: "General" feedback option should be handled separately in the frontend
        // based on student's completed semesters, not based on semesterOptions

        console.log('Final available semesters:', semesters);
        
        if (semesters.length === 0 && subjects.length > 0) {
            console.error('WARNING: Found subjects but no valid semesters extracted!');
            console.error('This might indicate an issue with how semesterOptions are stored in the database.');
        }

        const response = {
            semesters,
            completedSemesters: student.completedSemesters || [],
            generalFeedbackCompleted: student.generalFeedbackCompleted || false
        };
        
        // Add debug info in development
        if (process.env.NODE_ENV !== 'production') {
            response._debug = {
                studentBatch: student.batch,
                studentCourse: student.course,
                subjectsFound: subjects.length,
                subjectsWithNoSemesters,
                subjectsWithInvalidSemesters,
                semesterCounts
            };
        }
        
        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Error fetching available semesters:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;