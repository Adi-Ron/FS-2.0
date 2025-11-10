import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enrollmentNo: { type: String, required: true, unique: true },
  email: { type: String },
  course: { type: String },
  currentSemester: { type: Number },
  password: { type: String, required: true }
});

export default mongoose.model('Student', studentSchema);
