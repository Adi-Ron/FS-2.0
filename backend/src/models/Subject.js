const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  batch: { type: Number }, // e.g., 2023, 2024 - which batch this subject belongs to
  course: { type: String }, // e.g., 'CSE', 'ECE' - which course this subject is for
  year: { type: Number },
  semesterOptions: [{ type: String }],
  faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }],
  createdAt: { type: Date, default: Date.now }
});

// Compound index for better querying
SubjectSchema.index({ batch: 1, course: 1, code: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
