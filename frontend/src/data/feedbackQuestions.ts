// Feedback questions and rating scale
// Rating scale: 1 = lowest, 4 = highest
export const ratingScale = [
  { value: 4, label: 'Strongly Agree' },
  { value: 3, label: 'Agree' },
  { value: 2, label: 'Partially Agree' },
  { value: 1, label: 'Disagree' }
];

export const feedbackQuestions = [
  // Section A: Course Content
  { id: 1, text: 'The course objectives were clearly defined', category: 'Course Content' },
  { id: 2, text: 'The course content was well-organized and easy to follow', category: 'Course Content' },
  { id: 3, text: 'The course material was relevant and useful', category: 'Course Content' },
  { id: 4, text: 'The relevance of curriculum is closely aligned with current industry needs', category: 'Course Content' },
  { id: 5, text: 'Balance maintained between theory and practical components', category: 'Course Content' },
  // Section B: Teaching Effectiveness
  { id: 6, text: 'The faculty explained the concepts clearly', category: 'Teaching Effectiveness' },
  { id: 7, text: 'The faculty encouraged participation and interaction during the delivery', category: 'Teaching Effectiveness' },
  { id: 8, text: 'The faculty was available and helpful outside the class', category: 'Teaching Effectiveness' },
  { id: 9, text: 'The faculty was able to complete the syllabus timely', category: 'Teaching Effectiveness' },
  { id: 10, text: 'The faculty has good subject knowledge and expertise', category: 'Teaching Effectiveness' },
  { id: 11, text: 'The faculty is impartial and treats all students equally', category: 'Teaching Effectiveness' },
  // Section C: Learning Experience
  { id: 12, text: 'The course improved my knowledge and skills', category: 'Learning Experience' },
  { id: 13, text: 'The pace of the course was appropriate for learning and understanding', category: 'Learning Experience' },
  { id: 14, text: 'Classroom teaching and delivery was effective', category: 'Learning Experience' },
  { id: 15, text: 'Modern teaching aids/technology were used effectively', category: 'Learning Experience' },
  { id: 16, text: 'Teaching methods adopted were relevant to course objectives', category: 'Learning Experience' },
  { id: 17, text: 'The timing and frequency of assessments were reasonable and manageable.', category: 'Learning Experience' },
];

export const openFeedbackFields = [
  { id: 'likedMost', label: 'What did you like most about ____ course? (Max 100 words)', placeholder: 'Your feedback here' },
  { id: 'improvements', label: 'What improvements would you suggest? (Max 100 words)', placeholder: 'Your suggestions here' }
];
