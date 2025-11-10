require('dotenv').config();
const connectDB = require('../src/config/db');
const Student = require('../src/models/Student');
const bcrypt = require('bcryptjs');

const enrollment = process.argv[2];
const password = process.argv[3];

if (!enrollment) {
  console.error('Usage: node tools/checkStudent.js <enrollmentNo> [password]');
  process.exit(1);
}

async function run() {
  await connectDB();
  const student = await Student.findOne({ enrollmentNo: enrollment.toString().trim() });
  if (!student) {
    console.log(`Student not found for enrollmentNo='${enrollment}'`);
    process.exit(0);
  }

  console.log('Student record (sanitized):');
  const s = student.toObject();
  if (s.password) console.log(`- password hash: ${s.password}`);
  else console.log('- no password field');
  console.log(`- name: ${s.name}`);
  console.log(`- course: ${s.course}`);
  console.log(`- currentSemester: ${s.currentSemester}`);

  if (password) {
    const match = await bcrypt.compare(password.toString(), s.password);
    console.log(`Password compare with provided password: ${match}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
