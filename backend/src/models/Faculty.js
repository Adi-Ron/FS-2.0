const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  department: { type: String, required: true },
  batches: [{ type: Number }], // Array of batches this faculty teaches in (e.g., [2023, 2024])
  feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
  createdAt: { type: Date, default: Date.now }
});

// Faculty email should be unique, but they can teach multiple batches
FacultySchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Faculty', FacultySchema);
