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
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { feedbackQuestions, ratingScale, openFeedbackFields } from '../data/feedbackQuestions';
import { feedback as feedbackApi, subjects as subjectsApi, student as studentApi } from '../api';
import GeneralFeedbackForm from './GeneralFeedbackForm';
import Footer from './Footer';

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
  const { studentData, updateStudentData, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [completedSemesters, setCompletedSemesters] = useState<number[]>([]);
  const [generalFeedbackCompleted, setGeneralFeedbackCompleted] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGeneralFeedback, setShowGeneralFeedback] = useState(false);
  const [semesterFeedback, setSemesterFeedback] = useState({ likedMost: '', improvements: '' });
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

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
      setSemesterFeedback({ likedMost: '', improvements: '' });
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

  const handleLogout = () => {
    logout();
    navigate('/student/login');
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

  const handleSemesterFeedbackChange = (field: 'likedMost' | 'improvements', value: string) => {
    // Count words
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    // Only update if within 100 words limit or if deleting
    if (wordCount <= 100 || value.length < (semesterFeedback[field]?.length || 0)) {
      setSemesterFeedback(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const getWordCount = (text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
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
            likedMost: semesterFeedback.likedMost || '',
            improvements: semesterFeedback.improvements || '',
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

      setSuccessDialogOpen(true);
      
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A3D7A 0%, #1A5BA8 50%, #2E70B8 100%)',
      backgroundAttachment: 'fixed',
    }}>
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
      {/* Header with Logout Button */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 61, 122, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
            Student Feedback Portal
          </Typography>
        </Box>
        <Button
          onClick={handleLogout}
          variant="contained"
          size="small"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '6px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LogoutIcon sx={{ fontSize: 20 }} />
          Logout
        </Button>
      </Paper>

      {/* Thank You Page - Show when all feedbacks are completed */}
      {availableSemesters.length > 0 && 
       availableSemesters.every(s => completedSemesters.includes(s)) && 
       generalFeedbackCompleted ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '500px',
          mb: 3
        }}>
          <Paper elevation={3} sx={{
            p: 6,
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 61, 122, 0.15)'
          }}>
            <CheckCircleIcon sx={{ fontSize: 100, color: '#4CAF50', mb: 3 }} />
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#003D7A',
              mb: 2,
              fontSize: '32px'
            }}>
              Thank You!
            </Typography>
            <Typography variant="body1" sx={{
              color: '#666',
              fontSize: '18px',
              lineHeight: '1.6',
              mb: 3
            }}>
              Thank you for completing all the feedback forms. Your valuable responses have been recorded and will help us improve our educational services and experience.
            </Typography>
            <Typography variant="body2" sx={{
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              You have successfully completed all available feedbacks.
            </Typography>
          </Paper>
        </Box>
      ) : (
        <>
      {/* Top Row - Name, Enrollment, and Semester */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Side - Name and Enrollment */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FFFFFF', borderLeft: '5px solid #FDB913', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, fontSize: '0.85rem' }} gutterBottom>
                Name
              </Typography>
              <Typography variant="h6" sx={{ color: '#003D7A', fontWeight: 700 }}>{studentData.name}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#666666', fontWeight: 600, fontSize: '0.85rem' }} gutterBottom>
                Enrollment Number
              </Typography>
              <Typography variant="h6" sx={{ color: '#003D7A', fontWeight: 700 }}>{studentData.enrollmentNo}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Semester Dropdown */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FFFFFF', borderLeft: '5px solid #FDB913', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                      Semester {sem} {isCompleted ? "(Completed )" : ""}
                    </MenuItem>
                  );
                })}
                <MenuItem 
                  value="general"
                  disabled={generalFeedbackCompleted || !isGeneralFeedbackEnabled()}
                >
                  General Feedback {generalFeedbackCompleted ? "(Completed )" : ""}
                </MenuItem>
              </Select>
            </FormControl>
            
            {/* Alert below semester selector */}
            {nextSemester && !completedSemesters.includes(nextSemester) && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2, backgroundColor: '#E3F2FD', color: '#003D7A', fontWeight: 600 }}>
                Please complete Semester {nextSemester} first
              </Alert>
            )}
            {availableSemesters.length > 0 && availableSemesters.every(s => completedSemesters.includes(s)) && !generalFeedbackCompleted && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2, backgroundColor: '#E3F2FD', color: '#003D7A', fontWeight: 600 }}>
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
              <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: "#FFFFFF", border: "3px solid #FDB913", borderRadius: 2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#003D7A", mb: 3, fontSize: '1.3rem' }}>
                  Rating Scale
                </Typography>
                <Grid container spacing={2}>
                  {[...ratingScale].reverse().map((scale) => (
                    <Grid item xs={6} sm={3} key={scale.value}>
                      <Box sx={{ 
                        backgroundColor: '#F0F4F8', 
                        border: '2px solid #003D7A',
                        borderRadius: '8px',
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography sx={{ fontWeight: 700, color: '#003D7A', fontSize: '1.5rem', mb: 1 }}>
                          {scale.value}
                        </Typography>
                        <Typography sx={{ color: '#333333', fontSize: '0.9rem', fontWeight: 500 }}>
                          {scale.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* General Feedback Form */}
            {showGeneralFeedback && selectedSemester === 'general' && !generalFeedbackCompleted && (
              <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FFFFFF', borderLeft: '5px solid #FDB913' }}>
                <GeneralFeedbackForm onComplete={handleGeneralFeedbackComplete} />
              </Paper>
            )}

            {/* Completed Semester Alert */}
            {selectedSemester && selectedSemester !== 'general' && completedSemesters.includes(Number(selectedSemester)) && (
              <Alert severity="success" sx={{ mb: 3, backgroundColor: '#C8E6C9', color: '#1B5E20', fontWeight: 600 }}>
                Semester {selectedSemester} feedback has been completed successfully. You cannot modify completed feedback.
              </Alert>
            )}

            {/* Completed General Feedback Alert */}
            {selectedSemester === 'general' && generalFeedbackCompleted && (
              <Alert severity="success" sx={{ mb: 3, backgroundColor: '#C8E6C9', color: '#1B5E20', fontWeight: 600 }}>
                General feedback has been completed successfully. You cannot modify completed feedback.
              </Alert>
            )}

            {/* Semester Feedback Form */}
            {selectedSemester && selectedSemester !== 'general' && !showGeneralFeedback && !completedSemesters.includes(Number(selectedSemester)) && (
              <>
                {/* Course-Faculty Feedback Table - Visible when semester is selected */}
                <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FFFFFF', borderLeft: '5px solid #FDB913' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#003D7A', fontSize: '1.3rem' }}>
                    Course Feedback - Semester {selectedSemester}
                  </Typography>
                  {loading ? (
                    <Typography sx={{ color: '#003D7A', fontWeight: 600 }}>Loading courses...</Typography>
                  ) : subjects.length === 0 ? (
                    <Typography sx={{ color: '#666666', fontWeight: 600 }}>No subjects found for this semester.</Typography>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#F0F4F8' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#003D7A' }}>Course / Faculty</TableCell>
                            {feedbackQuestions.map((q) => (
                              <TableCell key={q.id} align="center">
                                <Tooltip title={q.text} arrow>
                                  <Typography variant="body2" sx={{ cursor: 'help', fontWeight: 700, color: '#003D7A' }}>
                                    Q{q.id}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subjects.map((subject, index) => {
                            // Calculate row background for alternating pattern
                            const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
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
                                <TableRow key={subject._id} sx={{ backgroundColor: rowBg, '&:hover': { backgroundColor: '#F0F4F8' } }}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#003D7A' }}>
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
                              <TableRow key={subject._id} sx={{ backgroundColor: rowBg, '&:hover': { backgroundColor: '#F0F4F8' } }}>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: '#003D7A' }}>
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
                  
                  {/* Open-ended feedback questions */}
                  {selectedSemester && subjects.length > 0 && (
                    <Box sx={{ mt: 4, p: 3, bgcolor: '#FFFFFF', borderRadius: 2, border: '3px solid #FDB913', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#003D7A', fontWeight: 700, fontSize: '1.2rem' }}>
                        Additional Feedback (Section D)
                      </Typography>
                      {openFeedbackFields.map(field => (
                        <Box key={field.id} sx={{ mb: 3 }}>
                          <TextField
                            label={field.label}
                            placeholder={field.placeholder}
                            fullWidth
                            multiline
                            rows={3}
                            value={semesterFeedback[field.id as 'likedMost' | 'improvements'] || ''}
                            onChange={e => handleSemesterFeedbackChange(field.id as 'likedMost' | 'improvements', e.target.value)}
                            helperText={`${getWordCount(semesterFeedback[field.id as 'likedMost' | 'improvements'] || '')}/100 words`}
                          />
                        </Box>
                      ))}
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
              <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FFFFFF', borderLeft: '5px solid #FDB913' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#003D7A', fontSize: '1.3rem' }}>
                  Feedback Questions
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F0F4F8' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#003D7A' }}>Question ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003D7A' }}>Question</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#003D7A' }}>Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feedbackQuestions.map((q, idx) => (
                      <TableRow key={q.id} sx={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB', '&:hover': { backgroundColor: '#F0F4F8' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Q{q.id}</TableCell>
                        <TableCell sx={{ color: '#333333' }}>{q.text}</TableCell>
                        <TableCell sx={{ color: '#666666', fontWeight: 500 }}>{q.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
      </>
      )}

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 61, 122, 0.2)',
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#4CAF50' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#003D7A',
              mb: 1,
              fontSize: '24px',
            }}
          >
            Feedback Submitted Successfully!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 3,
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            Thank you for completing the feedback form. Your responses have been recorded and will help us improve our services.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setSuccessDialogOpen(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
              }
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    <Footer />
    </Box>
  );
};

export default NewStudentDashboard;










