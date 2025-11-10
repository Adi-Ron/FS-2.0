const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  username: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  subjectName: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  facultyName: { type: String },
  semester: { type: Number }, // Semester number (1-8) or null for general feedback
  feedbackType: { type: String, enum: ['semester', 'general'], default: 'semester' }, // Type of feedback
  answers: [{
    question: String,
    rating: { type: Number, min: 1, max: 5 }, // Updated to max 5 to match rating scale
    category: String
  }],
  likedMost: { type: String },
  improvements: { type: String },
  notApplicable: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
