require('dotenv').config();
const connectDB = require('../src/config/db');
const Student = require('../src/models/Student');
const bcrypt = require('bcryptjs');

const enrollment = process.argv[2];
const newPassword = process.argv[3] || enrollment;

if (!enrollment) {
  console.error('Usage: node tools/resetStudentPassword.js <enrollmentNo> [newPassword]');
  process.exit(1);
}

async function run() {
  await connectDB();
  const student = await Student.findOne({ enrollmentNo: enrollment.toString().trim() });
  if (!student) {
    console.log(`Student not found for enrollmentNo='${enrollment}'`);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword.toString(), salt);
  student.password = hashed;
  await student.save();
  console.log(`Password updated for enrollmentNo='${enrollment}' (new password: '${newPassword}')`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
