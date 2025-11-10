const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  enrollmentNo: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, required: true }, // e.g., 'CSE', 'ECE', etc.
  batch: { type: Number, required: true }, // e.g., 2023, 2024, etc.
  currentSemester: { type: Number, enum: [1, 2, 3, 4, 5, 6, 7, 8], default: null },
  completedSemesters: [{ type: Number }], // Array of completed semester numbers
  generalFeedbackCompleted: { type: Boolean, default: false }, // Track if general feedback is completed
  feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
  createdAt: { type: Date, default: Date.now }
});

// Compound unique index: enrollment number should be unique per batch+course combination
// This allows same enrollment number in different batches/courses
StudentSchema.index({ enrollmentNo: 1, batch: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
