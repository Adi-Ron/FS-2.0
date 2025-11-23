import React, { useState, useCallback, memo } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, Button, TextField, FormControl, InputLabel, Typography } from '@mui/material';
import { feedbackQuestions, ratingScale, openFeedbackFields } from '../data/feedbackQuestions';
import { semesterSubjects } from '../data/feedbackSubjects';
import { feedback as feedbackApi } from '../api';

interface Props {
  view: string; // '1'|'2' etc
  onComplete: () => void;
  enrollmentNo: string;
}

// Memoized table row component to prevent re-renders
interface FeedbackTableRowProps {
  subject: any;
  subjectIndex: number;
  rowData: any;
  feedbackQuestions: any[];
  ratingScale: any[];
  openFeedbackFields: any[];
  onFacultyChange: (idx: number, val: string) => void;
  onRatingChange: (idx: number, qid: number, val: number) => void;
  onOpenChange: (idx: number, field: 'likedMost'|'improvements', val: string) => void;
  getWordCount: (text: string) => number;
}

const FeedbackTableRow = memo(({ subject, subjectIndex, rowData, feedbackQuestions, ratingScale, openFeedbackFields, onFacultyChange, onRatingChange, onOpenChange, getWordCount }: FeedbackTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{subject.name}</TableCell>
      <TableCell>
        <FormControl fullWidth>
          <InputLabel>Faculty</InputLabel>
          <Select 
            value={rowData.faculty} 
            label="Faculty" 
            onChange={(e) => onFacultyChange(subjectIndex, String(e.target.value))}
          >
            {subject.faculty.map((f: string) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            <MenuItem value="Not Applicable">Not Applicable</MenuItem>
          </Select>
        </FormControl>
      </TableCell>
      {feedbackQuestions.map((q: any) => (
        <TableCell key={q.id} align="center">
          {rowData.notApplicable ? '-' : (
            <Select 
              value={rowData.answers[q.id] || ''} 
              onChange={(e) => onRatingChange(subjectIndex, q.id, Number(e.target.value))}
              size="small"
            >
              {ratingScale.map((r: any) => <MenuItem key={r.value} value={r.value}>{r.value}</MenuItem>)}
            </Select>
          )}
        </TableCell>
      ))}
      <TableCell>
        <TextField 
          value={rowData.likedMost} 
          onChange={(e) => onOpenChange(subjectIndex, 'likedMost', e.target.value)}
          multiline
          rows={2}
          placeholder={openFeedbackFields[0].placeholder}
          helperText={`${getWordCount(rowData.likedMost)}/100 words`}
          sx={{ minWidth: 200 }}
          size="small"
        />
      </TableCell>
      <TableCell>
        <TextField 
          value={rowData.improvements} 
          onChange={(e) => onOpenChange(subjectIndex, 'improvements', e.target.value)}
          multiline
          rows={2}
          helperText={`${getWordCount(rowData.improvements)}/100 words`}
          sx={{ minWidth: 200 }}
          size="small"
        />
      </TableCell>
    </TableRow>
  );
});

const SubjectTableFeedback: React.FC<Props> = ({ view, onComplete }) => {
  const sem = Number(view);
  const subjects = semesterSubjects[sem as 1 | 2] || [];

  // state: per subject index -> faculty, answers, open fields
  const [rows, setRows] = useState(() => subjects.map(s => ({
    faculty: '',
    notApplicable: false,
    answers: {} as Record<number, number>,
    likedMost: '',
    improvements: ''
  })));

  const handleFacultyChange = useCallback((idx: number, val: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], faculty: val, notApplicable: val === 'Not Applicable' };
      return copy;
    });
  }, []);

  const handleRating = useCallback((idx: number, qid: number, val: number) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], answers: { ...copy[idx].answers, [qid]: val } };
      return copy;
    });
  }, []);

  const handleOpenChange = useCallback((idx: number, field: 'likedMost'|'improvements', val: string) => {
    // Count words
    const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length;
    // Only update if within 100 words limit or if deleting
    if (wordCount <= 100 || val.length < (rows[idx][field]?.length || 0)) {
      setRows(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: val };
        return copy;
      });
    }
  }, [rows]);

  const getWordCount = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate required fields for non-NA rows
    for (let i = 0; i < subjects.length; i++) {
      const row = rows[i];
      if (!row.notApplicable) {
        // ensure faculty selected
        if (!row.faculty) {
          alert(`Please select faculty for ${subjects[i].name} or mark Not Applicable`);
          return;
        }
        // ensure all questions answered
        for (const q of feedbackQuestions) {
          if (!row.answers[q.id]) {
            alert(`Please answer question "${q.text}" for ${subjects[i].name}`);
            return;
          }
        }
      }
    }

    // Submit each subject feedback
    try {
      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        const r = rows[i];
        const answersArray = r.notApplicable ? [] : feedbackQuestions.map(q => ({ question: q.text, rating: r.answers[q.id], category: q.category }));
        const payload = {
          subjectName: s.name,
          facultyName: r.notApplicable ? '' : r.faculty,
          answers: answersArray,
          notApplicable: r.notApplicable,
          likedMost: r.likedMost,
          improvements: r.improvements
        };
        await feedbackApi.submit(payload);
      }
      onComplete();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Error submitting feedback. Check console.');
    }
  }, [rows, subjects, onComplete]);

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell>Faculty</TableCell>
            {feedbackQuestions.map(q => (
              <TableCell key={q.id} align="center" sx={{ maxWidth: 240, whiteSpace: 'normal' }}>
                <div style={{ fontSize: 12, lineHeight: '1.2' }}>{q.text}</div>
              </TableCell>
            ))}
            <TableCell>What did you like most about ____ course? (Max 100 words)</TableCell>
            <TableCell>What improvements would you suggest? (Max 100 words)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subjects.map((s, idx) => (
            <FeedbackTableRow
              key={s.name}
              subject={s}
              subjectIndex={idx}
              rowData={rows[idx]}
              feedbackQuestions={feedbackQuestions}
              ratingScale={ratingScale}
              openFeedbackFields={openFeedbackFields}
              onFacultyChange={handleFacultyChange}
              onRatingChange={handleRating}
              onOpenChange={handleOpenChange}
              getWordCount={getWordCount}
            />
          ))}
        </TableBody>
      </Table>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>Submit {view} Feedback</Button>
      </Box>
    </Box>
  );
};

export default SubjectTableFeedback;
