const mongoose = require('mongoose');
const Subject = require('./src/models/Subject');

mongoose.connect('mongodb://localhost:27017/feedback-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  const subjects2024 = await Subject.find({ 
    batch: 2024, 
    course: { $regex: /^CSE$/i } 
  });
  
  console.log('Total 2024 CSE subjects found:', subjects2024.length);
  console.log('Subjects with semester options:');
  subjects2024.forEach(subject => {
    console.log('  - ' + subject.name + ' (' + subject.code + '): semesters [' + subject.semesterOptions.join(', ') + ']');
  });
  
  // Get unique semester options
  const allSemesters = new Set();
  subjects2024.forEach(subject => {
    subject.semesterOptions.forEach(sem => allSemesters.add(sem));
  });
  console.log('All semester options found:', Array.from(allSemesters).sort());
  
  // Check all subjects for 2024 batch regardless of course
  console.log('\nAll 2024 batch subjects (any course):');
  const all2024Subjects = await Subject.find({ batch: 2024 });
  all2024Subjects.forEach(subject => {
    console.log('  - ' + subject.name + ' (' + subject.code + ') - ' + subject.course + ': semesters [' + subject.semesterOptions.join(', ') + ']');
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});