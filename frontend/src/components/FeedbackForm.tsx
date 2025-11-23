import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper, Button, MenuItem, Select, TextField, FormControl, InputLabel } from '@mui/material';
import { feedbackQuestions, ratingScale, openFeedbackFields } from '../data/feedbackQuestions';
import { semesterSubjects } from '../data/feedbackSubjects';
import { auth } from '../api';

interface FeedbackFormProps {
  semester: number;
  subjectIndex: number;
  onSubmit: (result: any) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ semester, subjectIndex, onSubmit }) => {
  const subjectData = semesterSubjects[semester as 1 | 2][subjectIndex];
  const [faculty, setFaculty] = useState('');
  const [notApplicable, setNotApplicable] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [openFeedback, setOpenFeedback] = useState<{ [key: string]: string }>({});

  const handleFacultyChange = useCallback((e: any) => {
    setFaculty(e.target.value);
    setNotApplicable(e.target.value === 'Not Applicable');
  }, []);

  const handleRatingChange = useCallback((qid: number, value: number) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  }, []);

  const handleOpenFeedbackChange = useCallback((field: string, value: string) => {
    // Count words (split by whitespace and filter out empty strings)
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    // Only update if within 100 words limit
    if (wordCount <= 100 || value.length < (openFeedback[field]?.length || 0)) {
      setOpenFeedback(prev => ({ ...prev, [field]: value }));
    }
  }, [openFeedback]);

  const getWordCount = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare payload
    const payload = {
      subjectName: subjectData.name,
      facultyName: notApplicable ? '' : faculty,
      answers: notApplicable
        ? []
        : feedbackQuestions.map(q => ({
            question: q.text,
            rating: answers[q.id] || null,
            category: q.category
          })),
      notApplicable,
      likedMost: openFeedback.likedMost || '',
      improvements: openFeedback.improvements || ''
    };
    onSubmit(payload);
  };

  return (
    <Paper sx={{ p: 4, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Feedback for: {subjectData.name}
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Faculty</InputLabel>
          <Select
            value={faculty}
            label="Faculty"
            onChange={handleFacultyChange}
            required
          >
            {subjectData.faculty.map((f: string) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
            <MenuItem value="Not Applicable">Not Applicable</MenuItem>
          </Select>
        </FormControl>
        {!notApplicable && (
          <Box>
            {feedbackQuestions.map(q => (
              <FormControl key={q.id} fullWidth sx={{ mb: 2 }}>
                <InputLabel>{q.text}</InputLabel>
                <Select
                  value={answers[q.id] || ''}
                  label={q.text}
                  onChange={e => handleRatingChange(q.id, Number(e.target.value))}
                  required
                >
                  {ratingScale.map(r => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Box>
        )}
        {openFeedbackFields.map(field => (
          <Box key={field.id} sx={{ mb: 2 }}>
            <TextField
              label={field.label}
              placeholder={field.placeholder}
              fullWidth
              multiline
              rows={3}
              value={openFeedback[field.id] || ''}
              onChange={e => handleOpenFeedbackChange(field.id, e.target.value)}
              helperText={`${getWordCount(openFeedback[field.id] || '')}/100 words`}
            />
          </Box>
        ))}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Submit Feedback
        </Button>
      </form>
    </Paper>
  );
};

export default FeedbackForm;
