import React from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  availableViews?: string[];
  selectedView?: string;
  onChangeView?: (view: string) => void;
}

const StudentHeader: React.FC<Props> = ({ availableViews, selectedView, onChangeView }) => {
  const { studentData } = useAuth();

  if (!studentData) return null;

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">Enrollment No</Typography>
          <Typography variant="body1">{studentData.enrollmentNo}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">Name</Typography>
          <Typography variant="body1">{studentData.name}</Typography>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          {availableViews && selectedView !== undefined && onChangeView ? (
            <FormControl fullWidth>
              <InputLabel id="view-select-label">Select View</InputLabel>
              <Select
                labelId="view-select-label"
                value={selectedView}
                label="Select View"
                onChange={(e) => onChangeView(e.target.value)}
              >
                {availableViews.map(v => (
                  <MenuItem key={v} value={v}>{v === 'general' ? 'General' : `${v} Semester`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <>
              <Typography variant="subtitle2" color="textSecondary">Current Semester</Typography>
              <Typography variant="body1">{studentData.currentSemester ? `${studentData.currentSemester}th Semester` : 'N/A'}</Typography>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default StudentHeader;