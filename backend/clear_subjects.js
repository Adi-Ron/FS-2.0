// Utility script to clear subjects and faculties for a specific batch/course
// Run this before re-importing to avoid data conflicts

const mongoose = require('mongoose');
const Subject = require('./src/models/Subject');
const Faculty = require('./src/models/Faculty');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback-system';

async function clearData(batch, course) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const batchNum = parseInt(batch);
    const courseStr = course.toUpperCase().trim();

    console.log(`\nClearing data for Batch: ${batchNum}, Course: ${courseStr}`);

    // Find subjects for this batch/course
    const subjects = await Subject.find({ batch: batchNum, course: courseStr });
    console.log(`Found ${subjects.length} subjects to delete`);

    // Get all faculty IDs from these subjects
    const facultyIds = new Set();
    subjects.forEach(subject => {
      subject.faculties.forEach(fId => facultyIds.add(fId.toString()));
    });

    console.log(`Found ${facultyIds.size} faculties linked to these subjects`);

    // Delete subjects
    const deleteSubjectsResult = await Subject.deleteMany({ 
      batch: batchNum, 
      course: courseStr 
    });
    console.log(`Deleted ${deleteSubjectsResult.deletedCount} subjects`);

    // Clean up faculty references
    // Remove subject references and delete faculties if they have no other subjects
    for (const facultyId of facultyIds) {
      const faculty = await Faculty.findById(facultyId);
      if (faculty) {
        // Remove references to deleted subjects
        faculty.subjects = faculty.subjects.filter(
          subId => !subjects.some(s => s._id.equals(subId))
        );
        
        // If faculty has no more subjects, delete them
        if (faculty.subjects.length === 0) {
          await Faculty.findByIdAndDelete(facultyId);
          console.log(`Deleted faculty: ${faculty.name} (no subjects left)`);
        } else {
          await faculty.save();
          console.log(`Updated faculty: ${faculty.name} (${faculty.subjects.length} subjects remaining)`);
        }
      }
    }

    console.log('\n✅ Data cleared successfully!');
    console.log('You can now re-import your Excel file.');

  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get batch and course from command line arguments
const batch = process.argv[2];
const course = process.argv[3];

if (!batch || !course) {
  console.log('Usage: node clear_subjects.js <batch> <course>');
  console.log('Example: node clear_subjects.js 2024 CSE');
  process.exit(1);
}

clearData(batch, course);
