import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Select, MenuItem, Button, TextField, FormControl, InputLabel } from '@mui/material';
import { feedbackQuestions, ratingScale } from '../data/feedbackQuestions';
import { semesterSubjects } from '../data/feedbackSubjects';
import { feedback as feedbackApi } from '../api';

interface Props {
  view: string; // '1'|'2' etc
  onComplete: () => void;
  enrollmentNo: string;
}

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

  const handleFacultyChange = (idx: number, val: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx].faculty = val;
      copy[idx].notApplicable = val === 'Not Applicable';
      return copy;
    });
  };

  const handleRating = (idx: number, qid: number, val: number) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx].answers = { ...copy[idx].answers, [qid]: val };
      return copy;
    });
  };

  const handleOpenChange = (idx: number, field: 'likedMost'|'improvements', val: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleSubmit = async () => {
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
  };

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
            <TableCell>Liked Most</TableCell>
            <TableCell>Improvements</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subjects.map((s, idx) => (
            <TableRow key={s.name}>
              <TableCell>{s.name}</TableCell>
              <TableCell>
                <FormControl fullWidth>
                  <InputLabel>Faculty</InputLabel>
                  <Select value={rows[idx].faculty} label="Faculty" onChange={e => handleFacultyChange(idx, String(e.target.value))}>
                    {s.faculty.map((f: string) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    <MenuItem value="Not Applicable">Not Applicable</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>
              {feedbackQuestions.map(q => (
                <TableCell key={q.id} align="center">
                  {rows[idx].notApplicable ? '-' : (
                    <Select value={rows[idx].answers[q.id] || ''} onChange={e => handleRating(idx, q.id, Number(e.target.value))}>
                      {ratingScale.map(r => <MenuItem key={r.value} value={r.value}>{r.value}</MenuItem>)}
                    </Select>
                  )}
                </TableCell>
              ))}
              <TableCell>
                <TextField value={rows[idx].likedMost} onChange={e => handleOpenChange(idx, 'likedMost', e.target.value)} />
              </TableCell>
              <TableCell>
                <TextField value={rows[idx].improvements} onChange={e => handleOpenChange(idx, 'improvements', e.target.value)} />
              </TableCell>
            </TableRow>
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
