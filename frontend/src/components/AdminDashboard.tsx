import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { admin } from '../api';
import DataImport from './DataImport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FacultyReport {
  totalStudents: number;
  studentsFilledCount: number;
  studentsFilledPercentage: string;
  averageRating: string;
  averagePercentage: string;
  ratingCounts: { [key: string]: number };
  ratingPercentages: { [key: string]: string };
  totalRatings: number;
}

interface StudentReportItem {
  studentId: string;
  name: string;
  enrollmentNo: string;
  facultyFeedback: Array<{
    facultyId: string;
    facultyName: string;
    subjects: Array<{ subjectId: string; subjectName: string }>;
    ratings: Array<{ question: string; rating: number }>;
  }>;
}

interface GeneralFeedbackReport {
  totalStudents: number;
  studentsFilledCount: number;
  studentsFilledPercentage: string;
  feedbackDetails: Array<{
    feedbackId: string;
    studentName: string;
    enrollmentNo: string;
    answers: Array<{ question: string; rating: number; category?: string }>;
    likedMost: string;
    improvements: string;
    submittedAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportTab, setReportTab] = useState(0); // 0: Faculty Report, 1: Student Report, 2: General Feedback
  const [portalEnabled, setPortalEnabled] = useState(true);

  // Faculty Report State
  const [facultyBatch, setFacultyBatch] = useState<string>('');
  const [facultyCourse, setFacultyCourse] = useState<string>('');
  const [facultySemester, setFacultySemester] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [availableFaculties, setAvailableFaculties] = useState<any[]>([]);
  const [facultyReport, setFacultyReport] = useState<FacultyReport | null>(null);
  const [loadingFacultyReport, setLoadingFacultyReport] = useState(false);

  // Student Report State
  const [studentBatch, setStudentBatch] = useState<string>('');
  const [studentCourse, setStudentCourse] = useState<string>('');
  const [studentReport, setStudentReport] = useState<StudentReportItem[]>([]);
  const [loadingStudentReport, setLoadingStudentReport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentReportItem | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  // General Feedback Report State
  const [generalBatch, setGeneralBatch] = useState<string>('');
  const [generalCourse, setGeneralCourse] = useState<string>('');
  const [generalReport, setGeneralReport] = useState<GeneralFeedbackReport | null>(null);
  const [loadingGeneralReport, setLoadingGeneralReport] = useState(false);
  const [selectedGeneralFeedback, setSelectedGeneralFeedback] = useState<GeneralFeedbackReport['feedbackDetails'][0] | null>(null);
  const [generalDialogOpen, setGeneralDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReportTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setReportTab(newValue);
  };

  // Load faculties when batch/course/semester changes
  useEffect(() => {
    const loadFaculties = async () => {
      if (!facultyBatch || !facultyCourse) {
        setAvailableFaculties([]);
        return;
      }

      try {
        const params: any = {
          batch: Number(facultyBatch),
          course: facultyCourse,
        };
        if (facultySemester) {
          params.semester = Number(facultySemester);
        }
        const response = await admin.getFaculties(params);
        setAvailableFaculties(response.data.faculties || []);
        setSelectedFacultyId(''); // Reset selection when filters change
      } catch (error) {
        console.error('Failed to load faculties:', error);
        setAvailableFaculties([]);
      }
    };

    loadFaculties();
  }, [facultyBatch, facultyCourse, facultySemester]);

  const loadFacultyReport = async () => {
    if (!facultyBatch || !facultyCourse) {
      alert('Please select batch and course');
      return;
    }

    try {
      setLoadingFacultyReport(true);
      const params: any = {
        batch: Number(facultyBatch),
        course: facultyCourse,
      };
      if (facultySemester) {
        params.semester = Number(facultySemester);
      }
      if (selectedFacultyId) {
        params.facultyId = selectedFacultyId;
      }
      const response = await admin.getFacultyReport(params);
      setFacultyReport(response.data);
    } catch (error) {
      console.error('Failed to load faculty report:', error);
      alert('Failed to load faculty report');
    } finally {
      setLoadingFacultyReport(false);
    }
  };

  const loadStudentReport = async () => {
    if (!studentBatch || !studentCourse) {
      alert('Please select batch and course');
      return;
    }

    try {
      setLoadingStudentReport(true);
      const response = await admin.getStudentReport({
        batch: Number(studentBatch),
        course: studentCourse,
      });
      setStudentReport(response.data);
    } catch (error) {
      console.error('Failed to load student report:', error);
      alert('Failed to load student report');
    } finally {
      setLoadingStudentReport(false);
    }
  };

  const loadGeneralFeedbackReport = async () => {
    if (!generalBatch || !generalCourse) {
      alert('Please select batch and course');
      return;
    }

    try {
      setLoadingGeneralReport(true);
      const response = await admin.getGeneralFeedbackReport({
        batch: Number(generalBatch),
        course: generalCourse,
      });
      setGeneralReport(response.data);
    } catch (error) {
      console.error('Failed to load general feedback report:', error);
      alert('Failed to load general feedback report');
    } finally {
      setLoadingGeneralReport(false);
    }
  };

  const downloadFacultyReportPDF = () => {
    if (!facultyReport) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Faculty Feedback Report', 14, 20);
    doc.setFontSize(12);
    
    const selectedFaculty = availableFaculties.find(f => f._id === selectedFacultyId);
    let headerText = `Batch: ${facultyBatch} | Course: ${facultyCourse}${facultySemester ? ` | Semester: ${facultySemester}` : ''}`;
    if (selectedFaculty) {
      headerText += ` | Faculty: ${selectedFaculty.name}`;
    }
    doc.text(headerText, 14, 30);

    let yPos = 40;
    doc.setFontSize(11);
    doc.text(`Total Students in Batch: ${facultyReport.totalStudents}`, 14, yPos);
    yPos += 7;
    doc.text(`Students Filled Form: ${facultyReport.studentsFilledCount}`, 14, yPos);
    yPos += 7;
    doc.text(`Average Score: ${facultyReport.averageRating}/4 (${facultyReport.averagePercentage}%)`, 14, yPos);
    yPos += 7;
    doc.text(`Total Ratings: ${facultyReport.totalRatings}`, 14, yPos);
    yPos += 15;

    // Rating Percentages Table
    const tableData = [
      ['Rating', 'Count', 'Percentage'],
      ['1 (Disagree)', facultyReport.ratingCounts['1'].toString(), `${facultyReport.ratingPercentages['1']}%`],
      ['2 (Partially Agree)', facultyReport.ratingCounts['2'].toString(), `${facultyReport.ratingPercentages['2']}%`],
      ['3 (Agree)', facultyReport.ratingCounts['3'].toString(), `${facultyReport.ratingPercentages['3']}%`],
      ['4 (Strongly Agree)', facultyReport.ratingCounts['4'].toString(), `${facultyReport.ratingPercentages['4']}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
    });

    doc.save(`Faculty_Report_${facultyBatch}_${facultyCourse}${facultySemester ? `_Sem${facultySemester}` : ''}.pdf`);
  };

  const downloadStudentReportPDF = (student: StudentReportItem) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Student Feedback Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${student.name}`, 14, 30);
    doc.text(`Enrollment: ${student.enrollmentNo}`, 14, 37);
    doc.text(`Batch: ${studentBatch} | Course: ${studentCourse}`, 14, 44);

    let yPos = 55;
    doc.setFontSize(11);

    student.facultyFeedback.forEach((faculty, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.text(`Faculty: ${faculty.facultyName}`, 14, yPos);
      yPos += 7;

      doc.setFontSize(10);
      const subjectsList = faculty.subjects.map(s => s.subjectName).join(', ');
      doc.text(`Subjects: ${subjectsList}`, 14, yPos);
      yPos += 10;

      // Ratings Table
      const tableData = [
        ['Question', 'Rating'],
        ...faculty.ratings.map(r => [r.question.substring(0, 50) + '...', r.rating.toString()]),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Student_Report_${student.enrollmentNo}.pdf`);
  };

  const downloadGeneralFeedbackPDF = (feedback: GeneralFeedbackReport['feedbackDetails'][0]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('General Feedback Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Student: ${feedback.studentName}`, 14, 30);
    doc.text(`Enrollment: ${feedback.enrollmentNo}`, 14, 37);
    doc.text(`Batch: ${generalBatch} | Course: ${generalCourse}`, 14, 44);

    let yPos = 55;
    doc.setFontSize(11);

    // Add answers if available
    if (feedback.answers && feedback.answers.length > 0) {
      doc.setFontSize(12);
      doc.text('Ratings:', 14, yPos);
      yPos += 10;

      const tableData = [
        ['Question', 'Rating'],
        ...feedback.answers.map(a => [
          a.question.substring(0, 70) + (a.question.length > 70 ? '...' : ''),
          a.rating.toString()
        ]),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Add open-ended responses
    doc.setFontSize(12);
    doc.text('What did you like most about this course?', 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    const likedText = doc.splitTextToSize(feedback.likedMost, 180);
    doc.text(likedText, 14, yPos);
    yPos += likedText.length * 5 + 10;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.text('What improvements would you suggest?', 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    const improvementsText = doc.splitTextToSize(feedback.improvements, 180);
    doc.text(improvementsText, 14, yPos);

    doc.save(`General_Feedback_${feedback.enrollmentNo}.pdf`);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Admin Dashboard
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Feedback Reports" />
              <Tab label="Import Data" />
            </Tabs>
          </Box>
          {tabValue === 0 && (
            <FormControlLabel
              control={
                <Switch
                  checked={portalEnabled}
                  onChange={(e) => setPortalEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={`Student Portal is ${portalEnabled ? 'Enabled' : 'Disabled'}`}
            />
          )}
        </Box>

        {/* Feedback Reports Tab */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={reportTab} onChange={handleReportTabChange}>
                <Tab label="Faculty Report" />
                <Tab label="Student Report" />
                <Tab label="General Feedback" />
              </Tabs>
            </Box>

            {/* Faculty Report Panel */}
            {reportTab === 0 && (
              <Box>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Faculty Report Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Batch"
                        type="number"
                        value={facultyBatch}
                        onChange={(e) => setFacultyBatch(e.target.value)}
                        placeholder="e.g., 2024"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                          value={facultyCourse}
                          label="Course"
                          onChange={(e) => setFacultyCourse(e.target.value)}
                        >
                          <MenuItem value="CSE">CSE</MenuItem>
                          <MenuItem value="ECE">ECE</MenuItem>
                          <MenuItem value="AIML">AIML</MenuItem>
                          <MenuItem value="M.TECH (CSE)">M.TECH (CSE)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Semester (Optional)</InputLabel>
                        <Select
                          value={facultySemester}
                          label="Semester (Optional)"
                          onChange={(e) => setFacultySemester(e.target.value)}
                        >
                          <MenuItem value="">All Semesters</MenuItem>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <MenuItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Faculty (Optional)</InputLabel>
                        <Select
                          value={selectedFacultyId}
                          label="Faculty (Optional)"
                          onChange={(e) => setSelectedFacultyId(e.target.value)}
                          disabled={availableFaculties.length === 0}
                        >
                          <MenuItem value="">All Faculties</MenuItem>
                          {availableFaculties.map((faculty) => (
                            <MenuItem key={faculty._id} value={faculty._id}>
                              {faculty.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={loadFacultyReport}
                        disabled={loadingFacultyReport}
                        sx={{ height: '56px' }}
                      >
                        {loadingFacultyReport ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {facultyReport && (
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">Faculty Report Results</Typography>
                        {selectedFacultyId && (
                          <Typography variant="body2" color="textSecondary">
                            Faculty: {availableFaculties.find(f => f._id === selectedFacultyId)?.name || 'Unknown'}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={downloadFacultyReportPDF}
                      >
                        Download PDF
                      </Button>
                    </Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Total Students in Batch
                          </Typography>
                          <Typography variant="h4">{facultyReport.totalStudents}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Students Filled Form
                          </Typography>
                          <Typography variant="h4">
                            {facultyReport.studentsFilledCount}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Average Score
                          </Typography>
                          <Typography variant="h4">
                            {facultyReport.averagePercentage}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {facultyReport.averageRating}/4
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Total Ratings
                          </Typography>
                          <Typography variant="h4">{facultyReport.totalRatings}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Rating</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[1, 2, 3, 4].map((rating) => (
                            <TableRow key={rating}>
                              <TableCell>
                                {rating} - {rating === 1 ? 'Disagree' : rating === 2 ? 'Partially Agree' : rating === 3 ? 'Agree' : 'Strongly Agree'}
                              </TableCell>
                              <TableCell align="right">{facultyReport.ratingCounts[rating.toString()]}</TableCell>
                              <TableCell align="right">{facultyReport.ratingPercentages[rating.toString()]}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}

            {/* Student Report Panel */}
            {reportTab === 1 && (
              <Box>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Student Report Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Batch"
                        type="number"
                        value={studentBatch}
                        onChange={(e) => setStudentBatch(e.target.value)}
                        placeholder="e.g., 2024"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                          value={studentCourse}
                          label="Course"
                          onChange={(e) => setStudentCourse(e.target.value)}
                        >
                          <MenuItem value="CSE">CSE</MenuItem>
                          <MenuItem value="ECE">ECE</MenuItem>
                          <MenuItem value="AIML">AIML</MenuItem>
                          <MenuItem value="M.TECH (CSE)">M.TECH (CSE)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={loadStudentReport}
                        disabled={loadingStudentReport}
                        sx={{ height: '56px' }}
                      >
                        {loadingStudentReport ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {studentReport.length > 0 && (
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Students Who Filled Feedback ({studentReport.length})
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Enrollment No</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {studentReport.map((student) => (
                            <TableRow key={student.studentId}>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.enrollmentNo}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setStudentDialogOpen(true);
                                  }}
                                  sx={{ mr: 1 }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => downloadStudentReportPDF(student)}
                                >
                                  Download PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}

            {/* General Feedback Report Panel */}
            {reportTab === 2 && (
              <Box>
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    General Feedback Report Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Batch"
                        type="number"
                        value={generalBatch}
                        onChange={(e) => setGeneralBatch(e.target.value)}
                        placeholder="e.g., 2024"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                          value={generalCourse}
                          label="Course"
                          onChange={(e) => setGeneralCourse(e.target.value)}
                        >
                          <MenuItem value="CSE">CSE</MenuItem>
                          <MenuItem value="ECE">ECE</MenuItem>
                          <MenuItem value="AIML">AIML</MenuItem>
                          <MenuItem value="M.TECH (CSE)">M.TECH (CSE)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={loadGeneralFeedbackReport}
                        disabled={loadingGeneralReport}
                        sx={{ height: '56px' }}
                      >
                        {loadingGeneralReport ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {generalReport && (
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      General Feedback Report Results
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Total Students in Batch
                          </Typography>
                          <Typography variant="h4">{generalReport.totalStudents}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Students Filled Form
                          </Typography>
                          <Typography variant="h4">
                            {generalReport.studentsFilledCount}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Completion Rate
                          </Typography>
                          <Typography variant="h4">
                            {generalReport.studentsFilledPercentage}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student Name</TableCell>
                            <TableCell>Enrollment No</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {generalReport.feedbackDetails.map((feedback, index) => (
                            <TableRow key={index}>
                              <TableCell>{feedback.studentName}</TableCell>
                              <TableCell>{feedback.enrollmentNo}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedGeneralFeedback(feedback);
                                    setGeneralDialogOpen(true);
                                  }}
                                  sx={{ mr: 1 }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => downloadGeneralFeedbackPDF(feedback)}
                                >
                                  Download PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Import Data Tab */}
        {tabValue === 1 && (
          <Box>
            <DataImport />
          </Box>
        )}
      </Paper>

      {/* Student Details Dialog */}
      <Dialog
        open={studentDialogOpen}
        onClose={() => setStudentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Feedback Details - {selectedStudent?.name} ({selectedStudent?.enrollmentNo})
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              {selectedStudent.facultyFeedback.map((faculty, index) => (
                <Accordion key={index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">{faculty.facultyName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2" gutterBottom>
                      Subjects: {faculty.subjects.map(s => s.subjectName).join(', ')}
                    </Typography>
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell align="right">Rating</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {faculty.ratings.map((rating, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{rating.question}</TableCell>
                              <TableCell align="right">{rating.rating}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialogOpen(false)}>Close</Button>
          {selectedStudent && (
            <Button
              variant="contained"
              onClick={() => {
                downloadStudentReportPDF(selectedStudent);
                setStudentDialogOpen(false);
              }}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* General Feedback Details Dialog */}
      <Dialog
        open={generalDialogOpen}
        onClose={() => setGeneralDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          General Feedback Details - {selectedGeneralFeedback?.studentName} ({selectedGeneralFeedback?.enrollmentNo})
        </DialogTitle>
        <DialogContent>
          {selectedGeneralFeedback && (
            <Box>
              {/* Ratings Section */}
              {selectedGeneralFeedback.answers && selectedGeneralFeedback.answers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Ratings
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Question</TableCell>
                          <TableCell align="right">Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedGeneralFeedback.answers.map((answer, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{answer.question}</TableCell>
                            <TableCell align="right">{answer.rating}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Open-Ended Responses Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  What did you like most about this course?
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body1">
                    {selectedGeneralFeedback.likedMost}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  What improvements would you suggest?
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body1">
                    {selectedGeneralFeedback.improvements}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneralDialogOpen(false)}>Close</Button>
          {selectedGeneralFeedback && (
            <Button
              variant="contained"
              onClick={() => {
                downloadGeneralFeedbackPDF(selectedGeneralFeedback);
                setGeneralDialogOpen(false);
              }}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
