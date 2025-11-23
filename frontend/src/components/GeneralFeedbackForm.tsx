import React, { useState, useCallback } from 'react';
import { Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { feedback as feedbackApi } from '../api';

const generalQuestions = [
  { id: 1, text: 'The Accessibility and responsiveness of non-teaching /administrative staff members' },
  { id: 2, text: 'Availability of guidance for administrative and personal issues' },
  { id: 3, text: 'Access to library, digital resources, and learning tools' },
  { id: 4, text: 'Availability of co-curricular/extra-curricular activities (NCC, NSS, etc.)' },
  { id: 5, text: 'Grievance redressal mechanism effectiveness' },
  { id: 6, text: 'Conduct of examination and result declaration' },
  { id: 7, text: 'Scholarship/fellowship/accounts related processing efficiency' },
  { id: 8, text: 'Efficiency and transparency of administrative processes' },
  { id: 9, text: 'Communication of important notices and updates' },
  { id: 10, text: 'Inclusivity and support for students from diverse backgrounds' },
  { id: 11, text: 'Quality of career counselling and guidance' },
  { id: 12, text: 'Availability of internships and placements opportunity' },
  { id: 13, text: 'Industry interaction and guest lectures' },
  { id: 14, text: 'Alumni network and mentoring support' },
  { id: 15, text: 'Communication on placement opportunities and updates' },
  { id: 16, text: 'Classroom facilities and seating arrangements' },
  { id: 17, text: 'Laboratory, practical and workshop facilities' },
  { id: 18, text: 'Cleanliness and maintenance of campus' },
  { id: 19, text: 'IT infrastructure and internet availability' },
  { id: 20, text: 'Hostel (if applicable) – Cleanliness, safety, facilities' },
  { id: 21, text: 'Mess Services – Cleanliness, food quality, safety' },
  { id: 22, text: 'Medical care facilities/emergency services' },
  { id: 23, text: 'Sport facilities (e.g. Gym, Outdoor, Indoor)' },
  { id: 24, text: 'Adequacy and punctuality of transport service (if applicable)' }
];

const ratingOptions = [
  { value: 4, label: 'Excellent' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Average' },
  { value: 1, label: 'Poor' }
];

const GeneralFeedbackForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [suggestions, setSuggestions] = useState({ admin: '', welfare: '', other: '' });

  const handleRating = useCallback((qid: number, val: number) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  }, []);

  const handleSuggestionChange = useCallback((field: 'admin' | 'welfare' | 'other', value: string) => {
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount <= 100 || value.length < (suggestions[field]?.length || 0)) {
      setSuggestions(prev => ({ ...prev, [field]: value }));
    }
  }, [suggestions]);

  const getWordCount = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const handleSubmit = async () => {
    // validate all answered
    for (const q of generalQuestions) {
      if (!answers[q.id]) {
        alert(`Please answer: ${q.text}`);
        return;
      }
    }

    // build payload as a single general feedback doc
    const payload = {
      subjectName: 'General',
      facultyName: '',
      answers: generalQuestions.map(q => ({ question: q.text, rating: answers[q.id], category: 'General' })),
      notApplicable: false,
      likedMost: suggestions.admin || '',
      improvements: `${suggestions.welfare || ''}\n${suggestions.other || ''}`,
      feedbackType: 'general'
    };

    try {
      await feedbackApi.submit(payload);
      onComplete();
    } catch (err) {
      console.error('Error submitting general feedback:', err);
      alert('Error submitting.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>General Feedback</Typography>
      {generalQuestions.map(q => (
        <Box key={q.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>{q.text}</Box>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Rating</InputLabel>
            <Select value={answers[q.id] || ''} label="Rating" onChange={e => handleRating(q.id, Number(e.target.value))}>
              {ratingOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      ))}

      <Box sx={{ mt: 2 }}>
        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          label="Suggestions for improving administrative processes (Max 100 words)" 
          value={suggestions.admin} 
          onChange={e => handleSuggestionChange('admin', e.target.value)}
          helperText={`${getWordCount(suggestions.admin)}/100 words`}
          sx={{ mb: 2 }} 
        />
        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          label="Suggestions for improving student welfare and campus life (Max 100 words)" 
          value={suggestions.welfare} 
          onChange={e => handleSuggestionChange('welfare', e.target.value)}
          helperText={`${getWordCount(suggestions.welfare)}/100 words`}
          sx={{ mb: 2 }} 
        />
        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          label="Any other comments or observations (Max 100 words)" 
          value={suggestions.other} 
          onChange={e => handleSuggestionChange('other', e.target.value)}
          helperText={`${getWordCount(suggestions.other)}/100 words`}
          sx={{ mb: 2 }} 
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>Submit General Feedback</Button>
      </Box>
    </Box>
  );
};

export default GeneralFeedbackForm;
