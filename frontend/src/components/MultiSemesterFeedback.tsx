import React, { useState } from 'react';
import FeedbackForm from './FeedbackForm';
import { semesterSubjects } from '../data/feedbackSubjects';
import { Box, Typography, Button } from '@mui/material';

const MultiSemesterFeedback: React.FC<{ semester: number }> = ({ semester }) => {
  const [currentSemester, setCurrentSemester] = useState(1);
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [feedbackResults, setFeedbackResults] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);

  const handleFormSubmit = (result: any) => {
    setFeedbackResults(prev => [...prev, { ...result, semester: currentSemester }]);
    const subjects = semesterSubjects[currentSemester as 1 | 2];
    if (subjectIndex < subjects.length - 1) {
      setSubjectIndex(subjectIndex + 1);
    } else if (currentSemester === 1) {
      setCurrentSemester(2);
      setSubjectIndex(0);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <Box sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Thank you for submitting your feedback!</Typography>
        <Typography variant="body1">Your responses have been recorded.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mt: 4 }}>
        Semester {currentSemester} Feedback
      </Typography>
      <FeedbackForm
        semester={currentSemester}
        subjectIndex={subjectIndex}
        onSubmit={handleFormSubmit}
      />
    </Box>
  );
};

export default MultiSemesterFeedback;
