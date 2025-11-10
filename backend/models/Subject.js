import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  semester: { type: String, required: true },
  faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],
});

export default mongoose.model('Subject', subjectSchema);
