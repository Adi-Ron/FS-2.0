import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { admin } from '../api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DataImport: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [batch, setBatch] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage(null);
    setImportResult(null);
    setFile(null);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setMessage(null);
      setSheetNames([]);
      setSelectedSheet('');
      
      // Load sheet names from the file (for both students and faculties-subjects)
      setLoadingSheets(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await admin.getSheetNames(formData);
        const sheets = response.data.sheetNames || [];
        setSheetNames(sheets);
        
        // Auto-select first sheet
        if (sheets.length > 0) {
          setSelectedSheet(sheets[0]);
          // Try to auto-detect batch and course from sheet name
          if (autoDetect) {
            autoDetectBatchAndCourse(sheets[0]);
          }
        }
      } catch (error) {
        console.error('Error loading sheets:', error);
      } finally {
        setLoadingSheets(false);
      }
    }
  };

  const autoDetectBatchAndCourse = (sheetName: string) => {
    // Pattern: "2023-CSE", "2023-AIML", "ASET_2024 batch", "M.tech 2024 batch"
    const yearMatch = sheetName.match(/(\d{4})/);
    if (yearMatch) {
      setBatch(yearMatch[1]);
    }
    
    if (sheetName.toLowerCase().includes('cse')) {
      setCourse('CSE');
    } else if (sheetName.toLowerCase().includes('aiml')) {
      setCourse('AIML');
    } else if (sheetName.toLowerCase().includes('ece')) {
      setCourse('ECE');
    } else if (sheetName.toLowerCase().includes('m.tech') || sheetName.toLowerCase().includes('mtech')) {
      setCourse('M.TECH (CSE)');
    }
  };

  const handleImport = async (type: 'students' | 'faculties-subjects') => {
    if (!batch || !course || !file) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a file' });
      return;
    }

    if (sheetNames.length > 0 && !selectedSheet) {
      setMessage({ type: 'error', text: 'Please select a sheet to import' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batch', batch);
      formData.append('course', course);
      if (selectedSheet) {
        formData.append('sheetName', selectedSheet);
      }

      const response = await admin.importData(type, formData);
      
      setMessage({ type: 'success', text: response.data.message || 'Import successful!' });
      setImportResult(response.data);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Import failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Import Data
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Import students, faculties, and subjects from Excel files. Each import requires a batch year (e.g., 2023, 2024) and course name (e.g., CSE, ECE).
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Import Students" />
            <Tab label="Import Faculties & Subjects" />
          </Tabs>
        </Box>

        {/* Common Fields */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Batch Year"
              type="number"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g., 2023, 2024"
              helperText="Enter the batch year (e.g., 2023, 2024)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value.toUpperCase())}
              placeholder="e.g., CSE, ECE"
              helperText="Enter the course name (e.g., CSE, ECE)"
            />
          </Grid>
        </Grid>

        {/* Students Import Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Students
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Upload an Excel file with student details. Required columns: ENROLLMENT NO, STUDENT NAME, and optionally NOT (course name).
            </Typography>

            <Box sx={{ mb: 3 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="students-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="students-file-upload">
                <Button variant="outlined" component="span" fullWidth>
                  {file ? file.name : 'Choose Excel File'}
                </Button>
              </label>
            </Box>

            {/* Sheet Selection */}
            {sheetNames.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Sheet</InputLabel>
                  <Select
                    value={selectedSheet}
                    label="Select Sheet"
                    onChange={(e) => {
                      const sheet = e.target.value;
                      setSelectedSheet(sheet);
                      if (autoDetect) {
                        autoDetectBatchAndCourse(sheet);
                      }
                    }}
                  >
                    {sheetNames.map((sheet) => (
                      <MenuItem key={sheet} value={sheet}>
                        {sheet}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoDetect}
                      onChange={(e) => setAutoDetect(e.target.checked)}
                    />
                  }
                  label="Auto-detect batch and course from sheet name"
                  sx={{ mt: 1 }}
                />
                {loadingSheets && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading sheets...</Typography>
                  </Box>
                )}
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleImport('students')}
              disabled={loading || !file || !batch || !course}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Import Students'}
            </Button>
          </Box>
        </TabPanel>

        {/* Faculties & Subjects Import Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Faculties & Subjects
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Upload an Excel file with faculty and subject details. Required columns: COURSE CODE, COURSE TITLE (or SUBJECT NAME), FACULTY NAME (or FACULTY), and optionally SEMESTER, EMAIL, DEPARTMENT.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="faculties-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="faculties-file-upload">
                <Button variant="outlined" component="span" fullWidth>
                  {file ? file.name : 'Choose Excel File'}
                </Button>
              </label>
            </Box>

            {/* Sheet Selection */}
            {sheetNames.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Sheet</InputLabel>
                  <Select
                    value={selectedSheet}
                    label="Select Sheet"
                    onChange={(e) => {
                      const sheet = e.target.value;
                      setSelectedSheet(sheet);
                      if (autoDetect) {
                        autoDetectBatchAndCourse(sheet);
                      }
                    }}
                  >
                    {sheetNames.map((sheet) => (
                      <MenuItem key={sheet} value={sheet}>
                        {sheet}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoDetect}
                      onChange={(e) => setAutoDetect(e.target.checked)}
                    />
                  }
                  label="Auto-detect batch and course from sheet name"
                  sx={{ mt: 1 }}
                />
                {loadingSheets && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading sheets...</Typography>
                  </Box>
                )}
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleImport('faculties-subjects')}
              disabled={loading || !file || !batch || !course}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Import Faculties & Subjects'}
            </Button>
          </Box>
        </TabPanel>

        {/* Messages */}
        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}

        {/* Import Results */}
        {importResult && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Import Results
            </Typography>
            {importResult.imported !== undefined && (
              <Typography>Imported: {importResult.imported}</Typography>
            )}
            {importResult.updated !== undefined && (
              <Typography>Updated: {importResult.updated}</Typography>
            )}
            {importResult.facultiesCreated !== undefined && (
              <Typography>Faculties Created: {importResult.facultiesCreated}</Typography>
            )}
            {importResult.subjectsCreated !== undefined && (
              <Typography>Subjects Created: {importResult.subjectsCreated}</Typography>
            )}
            {importResult.errors !== undefined && (
              <Typography color="error">Errors: {importResult.errors}</Typography>
            )}
            {importResult.total !== undefined && (
              <Typography>Total Rows: {importResult.total}</Typography>
            )}
            {importResult.debugInfo && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Debug Information (All rows failed):
                </Typography>
                <Typography variant="body2">
                  <strong>Column names found in Excel:</strong> {importResult.debugInfo.sampleRowKeys?.join(', ') || 'None'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Expected columns:</strong> COURSE CODE, COURSE TITLE, FACULTY (or FACULTY NAME)
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  <strong>Sample row:</strong> {JSON.stringify(importResult.debugInfo.sampleRow, null, 2)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DataImport;

