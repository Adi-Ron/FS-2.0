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
import LogoutIcon from '@mui/icons-material/Logout';
import { admin } from '../api';
import DataImport from './DataImport';
import Footer from './Footer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface BatchReport {
  batch: number;
  totalStudents: number;
  studentsFilledCount: number;
  studentsFilledPercentage: string;
  ratingCounts: { [key: string]: number };
  ratingPercentages: { [key: string]: string };
  totalRatings: number;
  averageRating: string;
  averagePercentage: string;
}

interface FacultyBatchReport {
  facultyId: string;
  facultyName: string;
  email: string;
  department: string;
  batches: BatchReport[];
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
  const { logout } = useAuth();
  const navigate = useNavigate();

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
  
  // Faculty-Centric Report State
  const [viewMode, setViewMode] = useState<'semester' | 'faculty'>('semester');
  const [facultyCentricCourse, setFacultyCentricCourse] = useState<string>('');
  const [facultyCentricSemester, setFacultyCentricSemester] = useState<string>('');
  const [facultyBatchReports, setFacultyBatchReports] = useState<FacultyBatchReport[]>([]);
  const [loadingFacultyBatchReport, setLoadingFacultyBatchReport] = useState(false);
  const [expandedFaculty, setExpandedFaculty] = useState<string | false>(false);

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

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
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

  const loadFacultyBatchReport = async () => {
    if (!facultyCentricCourse) {
      alert('Please select course');
      return;
    }

    try {
      setLoadingFacultyBatchReport(true);
      const params: any = {
        course: facultyCentricCourse,
      };
      if (facultyCentricSemester) {
        params.semester = Number(facultyCentricSemester);
      }
      const response = await admin.getFacultyBatchReport(params);
      setFacultyBatchReports(response.data.faculties);
    } catch (error) {
      console.error('Failed to load faculty-batch report:', error);
      alert('Failed to load faculty-batch report');
    } finally {
      setLoadingFacultyBatchReport(false);
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
    doc.text('What did you like most about ____ course?', 14, yPos);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#003D7A' }}>
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, mt: 0, background: "linear-gradient(135deg, #003D7A 0%, #0055B3 100%)", color: "white", mb: 4, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 61, 122, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, letterSpacing: '0.5px' }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '16px' }}>
              Manage feedback reports and system configuration
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

        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 61, 122, 0.1)' }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 2, borderColor: '#E0E0E0', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#003D7A',
                      fontWeight: 600,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#003D7A',
                    height: '3px',
                    borderRadius: '2px'
                  }
                }}
              >
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
                sx={{ ml: 1 }}
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
                {/* View Mode Toggle */}
                <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'semester' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('semester')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                  >
                    Semester View
                  </Button>
                  <Button
                    variant={viewMode === 'faculty' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('faculty')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                  >
                    Faculty-Centric View
                  </Button>
                </Box>

                {/* Semester View */}
                {viewMode === 'semester' && (
                  <>
                    <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 3 }}>
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
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '&:hover fieldset': {
                                  borderColor: '#003D7A',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#003D7A',
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Course</InputLabel>
                            <Select
                              value={facultyCourse}
                              label="Course"
                              onChange={(e) => setFacultyCourse(e.target.value)}
                              sx={{
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                },
                              }}
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
                              sx={{
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                },
                              }}
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
                              sx={{
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                },
                              }}
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
                            sx={{ 
                              height: '56px',
                              background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                              textTransform: 'none',
                              fontSize: '16px',
                              fontWeight: 600,
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
                              }
                            }}
                          >
                            {loadingFacultyReport ? 'Loading...' : 'Generate Report'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {facultyReport && (
                      <Paper elevation={0} sx={{ p: 3, backgroundColor: '#FFFFFF', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#003D7A' }}>Faculty Report Results</Typography>
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
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                            }}
                          >
                            Download PDF
                          </Button>
                        </Box>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '12px', textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                                Total Students
                              </Typography>
                              <Typography variant="h4" sx={{ color: '#003D7A', fontWeight: 700 }}>
                                {facultyReport.totalStudents}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '12px', textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                                Students Filled Form
                              </Typography>
                              <Typography variant="h4" sx={{ color: '#003D7A', fontWeight: 700 }}>
                                {facultyReport.studentsFilledCount}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2.5, bgcolor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '12px', textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                                Average Score
                              </Typography>
                              <Typography variant="h4" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                                {facultyReport.averagePercentage}%
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {facultyReport.averageRating}/4
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '12px', textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                                Total Ratings
                              </Typography>
                              <Typography variant="h4" sx={{ color: '#003D7A', fontWeight: 700 }}>
                                {facultyReport.totalRatings}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        <TableContainer sx={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Rating</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Count</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Percentage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {[1, 2, 3, 4].map((rating) => (
                                <TableRow key={rating} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                                  <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>
                                    {rating} - {rating === 1 ? 'Disagree' : rating === 2 ? 'Partially Agree' : rating === 3 ? 'Agree' : 'Strongly Agree'}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>
                                    {facultyReport.ratingCounts[rating.toString()]}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>
                                    {facultyReport.ratingPercentages[rating.toString()]}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    )}
                  </>
                )}

                {/* Faculty-Centric View */}
                {viewMode === 'faculty' && (
                  <>
                    <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 3 }}>
                        Faculty-Centric Report Filters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Course</InputLabel>
                            <Select
                              value={facultyCentricCourse}
                              label="Course"
                              onChange={(e) => setFacultyCentricCourse(e.target.value)}
                              sx={{
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                },
                              }}
                            >
                              <MenuItem value="CSE">CSE</MenuItem>
                              <MenuItem value="ECE">ECE</MenuItem>
                              <MenuItem value="AIML">AIML</MenuItem>
                              <MenuItem value="M.TECH (CSE)">M.TECH (CSE)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Semester (Optional)</InputLabel>
                            <Select
                              value={facultyCentricSemester}
                              label="Semester (Optional)"
                              onChange={(e) => setFacultyCentricSemester(e.target.value)}
                              sx={{
                                borderRadius: '8px',
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#003D7A',
                                  },
                                },
                              }}
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
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={loadFacultyBatchReport}
                            disabled={loadingFacultyBatchReport}
                            sx={{ 
                              height: '56px',
                              background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                              textTransform: 'none',
                              fontSize: '16px',
                              fontWeight: 600,
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
                              }
                            }}
                          >
                            {loadingFacultyBatchReport ? 'Loading...' : 'Generate Faculty-Centric Report'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {facultyBatchReports.length > 0 && (
                      <Paper elevation={0} sx={{ p: 3, backgroundColor: '#FFFFFF', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 1 }}>
                          Faculty Reports ({facultyBatchReports.length} Faculties)
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Click on each faculty to see batch-wise breakdown
                        </Typography>
                        
                        {facultyBatchReports.map((facultyReport) => (
                          <Accordion 
                            key={facultyReport.facultyId}
                            expanded={expandedFaculty === facultyReport.facultyId}
                            onChange={() => setExpandedFaculty(
                              expandedFaculty === facultyReport.facultyId ? false : facultyReport.facultyId
                            )}
                            sx={{ 
                              mb: 2,
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E8EEF5',
                              borderRadius: '8px',
                              '&.Mui-expanded': {
                                backgroundColor: '#FFFFFF',
                              },
                              boxShadow: 'none',
                            }}
                          >
                            <AccordionSummary 
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                '& .MuiAccordionSummary-content': {
                                  margin: '16px 0',
                                }
                              }}
                            >
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#003D7A' }}>{facultyReport.facultyName}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {facultyReport.email} | {facultyReport.batches.length} Batch(es)
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {facultyReport.batches.map((batchData) => (
                                <Paper key={batchData.batch} sx={{ p: 2.5, mb: 2, bgcolor: '#FFFFFF', border: '1px solid #E8EEF5', borderRadius: '8px' }}>
                                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A' }}>
                                    Batch {batchData.batch}
                                  </Typography>
                                  
                                  <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6} md={3}>
                                      <Paper sx={{ p: 1.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '8px', textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                          Total Students
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: '#003D7A', fontWeight: 700 }}>{batchData.totalStudents}</Typography>
                                      </Paper>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <Paper sx={{ p: 1.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '8px', textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                          Students Filled
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: '#003D7A', fontWeight: 700 }}>{batchData.studentsFilledCount}</Typography>
                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                          ({batchData.studentsFilledPercentage}%)
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <Paper sx={{ p: 1.5, bgcolor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '8px', textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                          Average Score
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: '#2E7D32', fontWeight: 700 }}>{batchData.averagePercentage}%</Typography>
                                        <Typography variant="caption" sx={{ color: '#2E7D32' }}>
                                          {batchData.averageRating}/4
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <Paper sx={{ p: 1.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '8px', textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                          Total Ratings
                                        </Typography>
                                        <Typography variant="h5" sx={{ color: '#003D7A', fontWeight: 700 }}>{batchData.totalRatings}</Typography>
                                      </Paper>
                                    </Grid>
                                  </Grid>

                                  <TableContainer sx={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                                          <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Rating</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Count</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Percentage</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {[1, 2, 3, 4].map((rating) => (
                                          <TableRow key={rating} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                                            <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>
                                              {rating} - {rating === 1 ? 'Disagree' : rating === 2 ? 'Partially Agree' : rating === 3 ? 'Agree' : 'Strongly Agree'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>
                                              {batchData.ratingCounts[rating.toString()]}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>
                                              {batchData.ratingPercentages[rating.toString()]}%
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Paper>
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Student Report Panel */}
            {reportTab === 1 && (
              <Box>
                <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 3 }}>
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&:hover fieldset': {
                              borderColor: '#003D7A',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#003D7A',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                          value={studentCourse}
                          label="Course"
                          onChange={(e) => setStudentCourse(e.target.value)}
                          sx={{
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#003D7A',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#003D7A',
                              },
                            },
                          }}
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
                        sx={{ 
                          height: '56px',
                          background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                          textTransform: 'none',
                          fontSize: '16px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
                          }
                        }}
                      >
                        {loadingStudentReport ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {studentReport.length > 0 && (
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#FFFFFF', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 2 }}>
                      Students Who Filled Feedback ({studentReport.length})
                    </Typography>
                    <TableContainer sx={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Enrollment No</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {studentReport.map((student) => (
                            <TableRow key={student.studentId} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{student.name}</TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{student.enrollmentNo}</TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setStudentDialogOpen(true);
                                  }}
                                  sx={{ 
                                    mr: 1,
                                    textTransform: 'none',
                                    borderColor: '#003D7A',
                                    color: '#003D7A',
                                    borderRadius: '6px',
                                    '&:hover': {
                                      borderColor: '#0055B3',
                                      backgroundColor: 'rgba(0, 61, 122, 0.04)',
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => downloadStudentReportPDF(student)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                                  }}
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
                <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 3 }}>
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&:hover fieldset': {
                              borderColor: '#003D7A',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#003D7A',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                          value={generalCourse}
                          label="Course"
                          onChange={(e) => setGeneralCourse(e.target.value)}
                          sx={{
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#003D7A',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#003D7A',
                              },
                            },
                          }}
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
                        sx={{ 
                          height: '56px',
                          background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                          textTransform: 'none',
                          fontSize: '16px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
                          }
                        }}
                      >
                        {loadingGeneralReport ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {generalReport && (
                  <Paper elevation={0} sx={{ p: 3, backgroundColor: '#FFFFFF', border: '1px solid #E8EEF5', borderRadius: '12px' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A', mb: 3 }}>
                      General Feedback Report Results
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '12px', textAlign: 'center' }}>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Total Students in Batch
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#003D7A', fontWeight: 700 }}>
                            {generalReport.totalStudents}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#F0F4FF', border: '1px solid #E0E8F5', borderRadius: '12px', textAlign: 'center' }}>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Students Filled Form
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#003D7A', fontWeight: 700 }}>
                            {generalReport.studentsFilledCount}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '12px', textAlign: 'center' }}>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Completion Rate
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#2E7D32', fontWeight: 700 }}>
                            {generalReport.studentsFilledPercentage}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <TableContainer sx={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Student Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Enrollment No</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {generalReport.feedbackDetails.map((feedback, index) => (
                            <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{feedback.studentName}</TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{feedback.enrollmentNo}</TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedGeneralFeedback(feedback);
                                    setGeneralDialogOpen(true);
                                  }}
                                  sx={{ 
                                    mr: 1,
                                    textTransform: 'none',
                                    borderColor: '#003D7A',
                                    color: '#003D7A',
                                    borderRadius: '6px',
                                    '&:hover': {
                                      borderColor: '#0055B3',
                                      backgroundColor: 'rgba(0, 61, 122, 0.04)',
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => downloadGeneralFeedbackPDF(feedback)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
                                  }}
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
      </Container>

      {/* Student Details Dialog */}
      <Dialog
        open={studentDialogOpen}
        onClose={() => setStudentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#003D7A' }}>
          Feedback Details - {selectedStudent?.name} ({selectedStudent?.enrollmentNo})
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              {selectedStudent.facultyFeedback.map((faculty, index) => (
                <Accordion key={index} defaultExpanded={index === 0} sx={{ boxShadow: 'none', border: '1px solid #E8EEF5', mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#F8FAFC' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#003D7A' }}>{faculty.facultyName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#666', fontWeight: 500 }}>
                      Subjects: {faculty.subjects.map(s => s.subjectName).join(', ')}
                    </Typography>
                    <TableContainer sx={{ mt: 2, borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Question</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Rating</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {faculty.ratings.map((rating, idx) => (
                            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                              <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{rating.question}</TableCell>
                              <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>{rating.rating}</TableCell>
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStudentDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
          {selectedStudent && (
            <Button
              variant="contained"
              onClick={() => {
                downloadStudentReportPDF(selectedStudent);
                setStudentDialogOpen(false);
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
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
        <DialogTitle sx={{ fontWeight: 600, color: '#003D7A' }}>
          General Feedback Details - {selectedGeneralFeedback?.studentName} ({selectedGeneralFeedback?.enrollmentNo})
        </DialogTitle>
        <DialogContent>
          {selectedGeneralFeedback && (
            <Box>
              {/* Ratings Section */}
              {selectedGeneralFeedback.answers && selectedGeneralFeedback.answers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A' }}>
                    Ratings
                  </Typography>
                  <TableContainer sx={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#003D7A' }}>Question</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#003D7A' }}>Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedGeneralFeedback.answers.map((answer, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                            <TableCell sx={{ borderBottom: '1px solid #E8EEF5' }}>{answer.question}</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #E8EEF5', fontWeight: 500 }}>{answer.rating}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Open-Ended Responses Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A' }}>
                  What did you like most about ____ course?
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '8px' }}>
                  <Typography variant="body1" sx={{ color: '#333' }}>
                    {selectedGeneralFeedback.likedMost}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003D7A' }}>
                  What improvements would you suggest?
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E8EEF5', borderRadius: '8px' }}>
                  <Typography variant="body1" sx={{ color: '#333' }}>
                    {selectedGeneralFeedback.improvements}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGeneralDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
          {selectedGeneralFeedback && (
            <Button
              variant="contained"
              onClick={() => {
                downloadGeneralFeedbackPDF(selectedGeneralFeedback);
                setGeneralDialogOpen(false);
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #003D7A 0%, #0055B3 100%)',
              }}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default AdminDashboard;


