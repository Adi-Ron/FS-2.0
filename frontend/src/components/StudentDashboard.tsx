import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Rating,
  Divider,
} from '@mui/material';
import { subjects, faculty, feedback } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StudentHeader from './StudentHeader';
import SemesterSelection from './SemesterSelection';

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Faculty {
  _id: string;
  name: string;
}

interface FeedbackQuestion {
  id: number;
  question: string;
  category: string;
}

const questions: FeedbackQuestion[] = [
  { id: 1, question: "The teacher's subject knowledge is comprehensive and up-to-date", category: "Knowledge" },
  { id: 2, question: "The teacher explains concepts clearly and effectively", category: "Teaching" },
  { id: 3, question: "The teacher encourages student participation and discussion", category: "Interaction" },
  { id: 4, question: "The teacher completes the syllabus on time", category: "Course Management" },
  { id: 5, question: "The teacher provides helpful feedback on assignments", category: "Assessment" },
];

const StudentDashboard: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableFaculty, setAvailableFaculty] = useState<Faculty[]>([]);
  const { studentData } = useAuth();
  const [showSemesterSelection, setShowSemesterSelection] = useState<boolean>(
    !studentData?.currentSemester
  );
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadFaculty(selectedSubject);
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    try {
      const response = await subjects.getAll();
      setAvailableSubjects(response.data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadFaculty = async (subjectId: string) => {
    try {
      const response = await faculty.getBySubject(subjectId);
      setAvailableFaculty(response.data);
    } catch (error) {
      console.error('Failed to load faculty:', error);
    }
  };

  const handleSubjectChange = (event: any) => {
    setSelectedSubject(event.target.value);
    setSelectedFaculty('');
    setRatings({});
  };

  const handleFacultyChange = (event: any) => {
    setSelectedFaculty(event.target.value);
    setRatings({});
  };

  const handleRatingChange = (questionId: number, value: number | null) => {
    if (value !== null) {
      setRatings(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const feedbackData = {
        subjectId: selectedSubject,
        facultyId: selectedFaculty,
        answers: questions.map(q => ({
          question: q.question,
          rating: ratings[q.id] || 0,
          category: q.category,
        })),
      };
      await feedback.submit(feedbackData);
      // Reset form after submission
      setSelectedSubject('');
      setSelectedFaculty('');
      setRatings({});
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleNotApplicable = async () => {
    try {
      const feedbackData = {
        subjectId: selectedSubject,
        notApplicable: true,
      };
      await feedback.submit(feedbackData);
      setSelectedSubject('');
    } catch (error) {
      console.error('Failed to mark as not applicable:', error);
    }
  };

  if (showSemesterSelection) {
    return <SemesterSelection onComplete={() => setShowSemesterSelection(false)} />;
  }

  return (
    <Container maxWidth="md">
      <StudentHeader />
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Student Feedback Form
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
              >
                {availableSubjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedSubject && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={selectedFaculty}
                  label="Faculty"
                  onChange={handleFacultyChange}
                >
                  {availableFaculty.map((f) => (
                    <MenuItem key={f._id} value={f._id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {selectedSubject && !selectedFaculty && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleNotApplicable}
            >
              Mark as Not Applicable
            </Button>
          </Box>
        )}

        {selectedFaculty && (
          <>
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Please rate the following aspects:
              </Typography>
              <List>
                {questions.map((q) => (
                  <React.Fragment key={q.id}>
                    <ListItem>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={8}>
                          <ListItemText 
                            primary={q.question}
                            secondary={q.category}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Rating
                            value={ratings[q.id] || 0}
                            onChange={(_, value) => handleRatingChange(q.id, value)}
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={questions.some(q => !ratings[q.id])}
              >
                Submit Feedback
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default StudentDashboard;