import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { student } from '../api';

const SemesterSelection: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [semester, setSemester] = useState<string>('');
  const { updateStudentData } = useAuth();

  const handleSubmit = async () => {
    try {
      await student.updateSemester(Number(semester));
      const details = await student.getDetails();
      updateStudentData(details.data);
      onComplete();
    } catch (error) {
      console.error('Error updating semester:', error);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Select Your Semester
        </Typography>
        <FormControl component="fieldset" fullWidth sx={{ my: 2 }}>
          <FormLabel component="legend">Current Semester</FormLabel>
          <RadioGroup
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <FormControlLabel value="3" control={<Radio />} label="3rd Semester" />
            <FormControlLabel value="5" control={<Radio />} label="5th Semester" />
          </RadioGroup>
        </FormControl>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!semester}
          sx={{ mt: 2 }}
        >
          Continue
        </Button>
      </Paper>
    </Box>
  );
};

export default SemesterSelection;