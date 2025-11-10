const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/feedback-system');
    console.log('Connected to MongoDB');
    
    const Subject = require('./backend/src/models/Subject');
    
    // Check for 2024 CSE subjects
    const subjects = await Subject.find({ batch: 2024, course: 'CSE' });
    console.log(`Found ${subjects.length} subjects for 2024 CSE batch:`);
    
    subjects.forEach(subject => {
      console.log(`- ${subject.code}: ${subject.name} (Semesters: [${subject.semesterOptions.join(', ')}])`);
    });
    
    // Check all subjects
    const allSubjects = await Subject.find({});
    console.log(`\nTotal subjects in database: ${allSubjects.length}`);
    
    // Check distinct batches and courses
    const batches = await Subject.distinct('batch');
    const courses = await Subject.distinct('course');
    console.log(`Batches: [${batches.join(', ')}]`);
    console.log(`Courses: [${courses.join(', ')}]`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();