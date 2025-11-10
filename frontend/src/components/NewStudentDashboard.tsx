import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  SelectChangeEvent,
  Alert,
  TextField,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { feedbackQuestions, ratingScale } from '../data/feedbackQuestions';
import { feedback as feedbackApi, subjects as subjectsApi, student as studentApi } from '../api';
import GeneralFeedbackForm from './GeneralFeedbackForm';

interface Subject {
  _id: string;
  name: string;
  code: string;
  faculties?: Array<{ _id: string; name: string }>;
}

interface CourseRow {
  subjectId: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  notApplicable: boolean;
  answers: { [questionId: number]: number };
}

const NewStudentDashboard: React.FC = () => {
  const { studentData, updateStudentData } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [completedSemesters, setCompletedSemesters] = useState<number[]>([]);
  const [generalFeedbackCompleted, setGeneralFeedbackCompleted] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGeneralFeedback, setShowGeneralFeedback] = useState(false);

  // Load available semesters on mount
  useEffect(() => {
    loadAvailableSemesters();
  }, [studentData]);

  // Load subjects when semester is selected
  useEffect(() => {
    if (selectedSemester && selectedSemester !== 'general' && !completedSemesters.includes(Number(selectedSemester))) {
      loadSubjectsForSemester(Number(selectedSemester));
    } else {
      setSubjects([]);
      setCourseRows([]);
    }
  }, [selectedSemester, completedSemesters]);

  const loadAvailableSemesters = async () => {
    try {
      const response = await studentApi.getAvailableSemesters();
      const { semesters, completedSemesters: completed, generalFeedbackCompleted: generalCompleted, _debug } = response.data;
      console.log('Available semesters response:', response.data);
      
      // Log debug info if available
      if (_debug) {
        console.log('Debug info:', _debug);
        console.log(`Student Batch: ${_debug.studentBatch}, Course: ${_debug.studentCourse}`);
        console.log(`Subjects found: ${_debug.subjectsFound}`);
        console.log(`Subjects with no semesters: ${_debug.subjectsWithNoSemesters}`);
        console.log(`Subjects with invalid semesters: ${_debug.subjectsWithInvalidSemesters}`);
        console.log(`Semester counts:`, _debug.semesterCounts);
      }
      
      setAvailableSemesters(semesters || []);
      setCompletedSemesters(completed || []);
      setGeneralFeedbackCompleted(generalCompleted || false);
      
      if (!semesters || semesters.length === 0) {
        console.warn('No semesters found for this student.');
        if (_debug) {
          console.warn('Possible issues:');
          if (_debug.subjectsFound === 0) {
            console.warn(`- No subjects found for batch ${_debug.studentBatch}, course ${_debug.studentCourse}`);
            console.warn('  -> Check if subjects were imported for this batch/course combination');
          } else if (_debug.subjectsWithNoSemesters > 0 || _debug.subjectsWithInvalidSemesters > 0) {
            console.warn(`- ${_debug.subjectsWithNoSemesters} subjects have no semesterOptions`);
            console.warn(`- ${_debug.subjectsWithInvalidSemesters} subjects have invalid semesterOptions`);
            console.warn('  -> Subjects may need to be re-imported with correct semester data');
          }
        } else {
          console.warn('Please ensure faculty/subjects data is imported correctly.');
        }
      }
    } catch (error: any) {
      console.error('Failed to load available semesters:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.data.message) {
          console.error('Error message:', error.response.data.message);
        }
      }
    }
  };

  const loadSubjectsForSemester = async (semester: number) => {
    try {
      setLoading(true);
      const response = await subjectsApi.getBySemester(semester);
      const subjectsData = response.data;
      console.log(`Loaded ${subjectsData.length} subjects for semester ${semester}:`, subjectsData.map((s: Subject) => s.name));
      setSubjects(subjectsData);
      
      // Initialize course rows for all subjects
      const initialRows: CourseRow[] = subjectsData.map((subject: Subject) => ({
        subjectId: subject._id,
        subjectName: subject.name,
        facultyId: '',
        facultyName: '',
        notApplicable: false,
        answers: {},
      }));
      setCourseRows(initialRows);
      console.log(`Initialized ${initialRows.length} course rows`);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      alert('Failed to load subjects for this semester');
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    
    // Check if trying to select a completed semester
    if (value !== 'general' && completedSemesters.includes(Number(value))) {
      alert('This semester is already completed. You cannot modify feedback for completed semesters.');
      return;
    }
    
    // Check if trying to select completed general feedback
    if (value === 'general' && generalFeedbackCompleted) {
      alert('General feedback is already completed. You cannot modify it.');
      return;
    }
    
    if (value === 'general') {
      setShowGeneralFeedback(true);
      setSelectedSemester('general');
    } else {
      setShowGeneralFeedback(false);
      setSelectedSemester(value);
    }
  };

  const handleFacultyChange = (index: number, facultyId: string, facultyName: string) => {
    setCourseRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        facultyId,
        facultyName,
        notApplicable: facultyId === 'not-applicable',
        answers: facultyId === 'not-applicable' ? {} : updated[index].answers,
      };
      return updated;
    });
  };

  const handleRatingChange = (index: number, questionId: number, value: string) => {
    // Validate input: only allow numbers 1-5
    const numValue = value.trim();
    if (numValue === '') {
      // Allow empty to clear the field
      setCourseRows(prev => {
        const updated = [...prev];
        const newAnswers = { ...updated[index].answers };
        delete newAnswers[questionId];
        updated[index] = {
          ...updated[index],
          answers: newAnswers,
        };
        return updated;
      });
      return;
    }
    
    const rating = parseInt(numValue);
    if (isNaN(rating) || rating < 1 || rating > 4) {
      alert('Please enter a number between 1 and 4');
      return;
    }
    
    setCourseRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        answers: {
          ...updated[index].answers,
          [questionId]: rating,
        },
      };
      return updated;
    });
  };
  
  const handleRatingKeyPress = (e: React.KeyboardEvent, index: number, questionId: number, nextQuestionId?: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();
      
      if (value) {
        const rating = parseInt(value);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          // Move to next question if available
          if (nextQuestionId) {
            const nextInput = document.querySelector(`input[data-question-id="${nextQuestionId}"][data-row-index="${index}"]`) as HTMLInputElement;
            if (nextInput) {
              nextInput.focus();
              nextInput.select();
            }
          } else {
            // Move to next row's first question
            const nextRowFirstInput = document.querySelector(`input[data-question-id="1"][data-row-index="${index + 1}"]`) as HTMLInputElement;
            if (nextRowFirstInput) {
              nextRowFirstInput.focus();
              nextRowFirstInput.select();
            }
          }
        }
      }
    }
  };

  const isSemesterEnabled = (semester: number): boolean => {
    if (completedSemesters.includes(semester)) return true; // Already completed, can view
    if (semester === availableSemesters[0]) return true; // First semester is always enabled
    
    // Check if previous semester is completed
    const previousSemester = semester - 1;
    if (availableSemesters.includes(previousSemester)) {
      return completedSemesters.includes(previousSemester);
    }
    
    // If previous semester doesn't exist in available semesters, check if all previous are completed
    const previousSemesters = availableSemesters.filter(s => s < semester);
    return previousSemesters.every(s => completedSemesters.includes(s));
  };

  const isGeneralFeedbackEnabled = (): boolean => {
    // General feedback is enabled only if all semesters are completed
    // Also check that there are semesters available
    if (availableSemesters.length === 0) return false;
    return availableSemesters.every(sem => completedSemesters.includes(sem));
  };

  const handleSubmit = async () => {
    if (!selectedSemester || selectedSemester === 'general') {
      return;
    }

    const semester = Number(selectedSemester);
    
    // Get all rows (including not applicable)
    const allRows = courseRows;
    
    // Filter out rows that are not applicable for validation
    const rowsToSubmit = allRows.filter(row => !row.notApplicable);
    
    // Validate that at least one non-not-applicable row has faculty and all questions answered
    if (rowsToSubmit.length === 0) {
      alert('Please select at least one course with a faculty (or mark courses as Not Applicable)');
      return;
    }

    // Validate all non-not-applicable rows
    for (const row of rowsToSubmit) {
      if (!row.facultyId || row.facultyId === 'not-applicable') {
        alert(`Please select faculty for ${row.subjectName} or mark it as Not Applicable`);
        return;
      }
      // Check if all questions are answered
      for (const question of feedbackQuestions) {
        if (!row.answers[question.id]) {
          alert(`Please answer all questions for ${row.subjectName}`);
          return;
        }
      }
    }

    // Submit feedback for each course (including not-applicable rows)
    try {
      for (const row of allRows) {
        if (row.notApplicable) {
          // Submit as not applicable
          await feedbackApi.submit({
            subjectId: row.subjectId,
            subjectName: row.subjectName,
            facultyId: '',
            facultyName: '',
            answers: [],
            notApplicable: true,
            semester: semester,
            feedbackType: 'semester',
          });
        } else {
          // Submit with answers
          const answers = feedbackQuestions.map(q => ({
            question: q.text,
            rating: row.answers[q.id],
            category: q.category,
          }));

          await feedbackApi.submit({
            subjectId: row.subjectId,
            subjectName: row.subjectName,
            facultyId: row.facultyId,
            facultyName: row.facultyName,
            answers,
            notApplicable: false,
            semester: semester,
            feedbackType: 'semester',
          });
        }
      }

      // Mark semester as completed
      await feedbackApi.completeSemester(semester);
      
      // Refresh available semesters
      await loadAvailableSemesters();
      
      // Refresh student data
      const studentDetails = await studentApi.getDetails();
      updateStudentData(studentDetails.data);

      alert('Feedback submitted successfully!');
      
      // Reset form
      setSelectedSemester('');
      setCourseRows([]);
      setSubjects([]);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  const handleGeneralFeedbackComplete = async () => {
    // Refresh available semesters
    await loadAvailableSemesters();
    
    // Refresh student data
    const studentDetails = await studentApi.getDetails();
    updateStudentData(studentDetails.data);
    
    setShowGeneralFeedback(false);
    setSelectedSemester('');
  };

  if (!studentData) {
    return <div>Loading...</div>;
  }

  // Determine next available semester
  const getNextAvailableSemester = (): number | null => {
    for (const sem of availableSemesters) {
      if (!completedSemesters.includes(sem)) {
        return sem;
      }
    }
    return null;
  };

  const nextSemester = getNextAvailableSemester();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Row - Name, Enrollment, and Semester */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Side - Name and Enrollment */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Name
              </Typography>
              <Typography variant="h6">{studentData.name}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Enrollment Number
              </Typography>
              <Typography variant="h6">{studentData.enrollmentNo}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Semester Dropdown */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Semester</InputLabel>
              <Select
                value={selectedSemester}
                label="Select Semester"
                onChange={handleSemesterChange}
              >
                {availableSemesters.map((sem) => {
                  const isCompleted = completedSemesters.includes(sem);
                  const isEnabled = isSemesterEnabled(sem);
                  return (
                    <MenuItem 
                      key={sem} 
                      value={sem.toString()}
                      disabled={isCompleted || (!isEnabled && !isCompleted)}
                    >
                      Semester {sem} {isCompleted ? '(Completed ✓)' : ''}
                    </MenuItem>
                  );
                })}
                <MenuItem 
                  value="general"
                  disabled={generalFeedbackCompleted || !isGeneralFeedbackEnabled()}
                >
                  General Feedback {generalFeedbackCompleted ? '(Completed ✓)' : ''}
                </MenuItem>
              </Select>
            </FormControl>
            {nextSemester && !completedSemesters.includes(nextSemester) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please complete Semester {nextSemester} first
              </Alert>
            )}
            {availableSemesters.length > 0 && availableSemesters.every(s => completedSemesters.includes(s)) && !generalFeedbackCompleted && (
              <Alert severity="info" sx={{ mt: 2 }}>
                All semesters completed. You can now fill General Feedback.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Center - Content Area */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box>
            {/* Ratings Table - Visible only for semester feedback, not for general feedback */}
            {selectedSemester !== 'general' && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rating Scale
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rating</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...ratingScale].reverse().map((scale) => (
                      <TableRow key={scale.value}>
                        <TableCell>{scale.value}</TableCell>
                        <TableCell>{scale.label}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {/* General Feedback Form */}
            {showGeneralFeedback && selectedSemester === 'general' && !generalFeedbackCompleted && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <GeneralFeedbackForm onComplete={handleGeneralFeedbackComplete} />
              </Paper>
            )}

            {/* Completed Semester Alert */}
            {selectedSemester && selectedSemester !== 'general' && completedSemesters.includes(Number(selectedSemester)) && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Semester {selectedSemester} feedback has been completed successfully. You cannot modify completed feedback.
              </Alert>
            )}

            {/* Completed General Feedback Alert */}
            {selectedSemester === 'general' && generalFeedbackCompleted && (
              <Alert severity="success" sx={{ mb: 3 }}>
                General feedback has been completed successfully. You cannot modify completed feedback.
              </Alert>
            )}

            {/* Semester Feedback Form */}
            {selectedSemester && selectedSemester !== 'general' && !showGeneralFeedback && !completedSemesters.includes(Number(selectedSemester)) && (
              <>
                {/* Course-Faculty Feedback Table - Visible when semester is selected */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Course Feedback - Semester {selectedSemester}
                  </Typography>
                  {loading ? (
                    <Typography>Loading courses...</Typography>
                  ) : subjects.length === 0 ? (
                    <Typography color="textSecondary">No subjects found for this semester.</Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Course / Faculty</TableCell>
                            {feedbackQuestions.map((q) => (
                              <TableCell key={q.id} align="center">
                                <Tooltip title={q.text} arrow>
                                  <Typography variant="body2" sx={{ cursor: 'help' }}>
                                    Q{q.id}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subjects.map((subject, index) => {
                            const rowIndex = courseRows.findIndex(r => r.subjectId === subject._id);
                            if (rowIndex === -1) {
                              console.warn(`No course row found for subject ${subject.name} (${subject._id})`);
                              // Create a new row if it doesn't exist
                              const newRow: CourseRow = {
                                subjectId: subject._id,
                                subjectName: subject.name,
                                facultyId: '',
                                facultyName: '',
                                notApplicable: false,
                                answers: {},
                              };
                              setCourseRows(prev => [...prev, newRow]);
                              const newRowIndex = courseRows.length;
                              const row = newRow;
                              return (
                                <TableRow key={subject._id}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        {subject.name}
                                      </Typography>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Select Faculty</InputLabel>
                                        <Select
                                          value={row.facultyId || ''}
                                          label="Select Faculty"
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'not-applicable') {
                                              handleFacultyChange(newRowIndex, 'not-applicable', 'Not Applicable');
                                            } else {
                                              const faculty = subject.faculties?.find(f => f._id === value);
                                              if (faculty) {
                                                handleFacultyChange(newRowIndex, faculty._id, faculty.name);
                                              }
                                            }
                                          }}
                                        >
                                          <MenuItem value="not-applicable">Not Applicable</MenuItem>
                                          {subject.faculties && subject.faculties.length > 0 ? (
                                            subject.faculties.map((faculty) => (
                                              <MenuItem key={faculty._id} value={faculty._id}>
                                                {faculty.name}
                                              </MenuItem>
                                            ))
                                          ) : (
                                            <MenuItem disabled>No faculty available</MenuItem>
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Box>
                                  </TableCell>
                                  {feedbackQuestions.map((q, qIndex) => {
                                    const nextQuestionId = qIndex < feedbackQuestions.length - 1 ? feedbackQuestions[qIndex + 1].id : undefined;
                                    return (
                                      <TableCell key={q.id} align="center">
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={row.answers[q.id] || ''}
                                          onChange={(e) => handleRatingChange(newRowIndex, q.id, e.target.value)}
                                          onKeyPress={(e) => handleRatingKeyPress(e, newRowIndex, q.id, nextQuestionId)}
                                          disabled={row.notApplicable}
                                          inputProps={{
                                            min: 1,
                                            max: 4,
                                            step: 1,
                                            'data-question-id': q.id,
                                            'data-row-index': newRowIndex,
                                            style: { textAlign: 'center', width: '60px' }
                                          }}
                                          sx={{
                                            '& input': {
                                              textAlign: 'center',
                                              padding: '8px',
                                            },
                                            width: '80px'
                                          }}
                                          error={row.answers[q.id] !== undefined && (row.answers[q.id] < 1 || row.answers[q.id] > 4)}
                                          helperText={row.answers[q.id] !== undefined && (row.answers[q.id] < 1 || row.answers[q.id] > 4) ? 'Must be 1-4' : ''}
                                        />
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            }
                            const row = courseRows[rowIndex];
                            
                            return (
                              <TableRow key={subject._id}>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      {subject.name}
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>Select Faculty</InputLabel>
                                      <Select
                                        value={row.facultyId || ''}
                                        label="Select Faculty"
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === 'not-applicable') {
                                            handleFacultyChange(rowIndex, 'not-applicable', 'Not Applicable');
                                          } else {
                                            const faculty = subject.faculties?.find(f => f._id === value);
                                            if (faculty) {
                                              handleFacultyChange(rowIndex, faculty._id, faculty.name);
                                            }
                                          }
                                        }}
                                      >
                                        <MenuItem value="not-applicable">Not Applicable</MenuItem>
                                        {subject.faculties && subject.faculties.length > 0 ? (
                                          subject.faculties.map((faculty) => (
                                            <MenuItem key={faculty._id} value={faculty._id}>
                                              {faculty.name}
                                            </MenuItem>
                                          ))
                                        ) : (
                                          <MenuItem disabled>No faculty available</MenuItem>
                                        )}
                                      </Select>
                                    </FormControl>
                                  </Box>
                                </TableCell>
                                {feedbackQuestions.map((q, qIndex) => {
                                  const nextQuestionId = qIndex < feedbackQuestions.length - 1 ? feedbackQuestions[qIndex + 1].id : undefined;
                                  return (
                                    <TableCell key={q.id} align="center">
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={row.answers[q.id] || ''}
                                        onChange={(e) => handleRatingChange(rowIndex, q.id, e.target.value)}
                                        onKeyPress={(e) => handleRatingKeyPress(e, rowIndex, q.id, nextQuestionId)}
                                        disabled={row.notApplicable}
                                        inputProps={{
                                          min: 1,
                                          max: 4,
                                          step: 1,
                                          'data-question-id': q.id,
                                          'data-row-index': rowIndex,
                                          style: { textAlign: 'center', width: '60px' }
                                        }}
                                        sx={{
                                          '& input': {
                                            textAlign: 'center',
                                            padding: '8px',
                                          },
                                          width: '80px'
                                        }}
                                        error={row.answers[q.id] !== undefined && (row.answers[q.id] < 1 || row.answers[q.id] > 4)}
                                        helperText={row.answers[q.id] !== undefined && (row.answers[q.id] < 1 || row.answers[q.id] > 4) ? 'Must be 1-4' : ''}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                  {selectedSemester && subjects.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        size="large"
                        fullWidth
                      >
                        Submit Feedback
                      </Button>
                    </Box>
                  )}
                </Paper>
              </>
            )}

            {/* Show Feedback Questions table when no semester is selected */}
            {!selectedSemester && !showGeneralFeedback && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Feedback Questions
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Question ID</TableCell>
                      <TableCell>Question</TableCell>
                      <TableCell>Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feedbackQuestions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>Q{q.id}</TableCell>
                        <TableCell>{q.text}</TableCell>
                        <TableCell>{q.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NewStudentDashboard;
