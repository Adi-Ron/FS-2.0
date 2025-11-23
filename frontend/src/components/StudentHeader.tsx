import React from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  availableViews?: string[];
  selectedView?: string;
  onChangeView?: (view: string) => void;
}

const StudentHeader: React.FC<Props> = ({ availableViews, selectedView, onChangeView }) => {
  const { studentData, logout } = useAuth();
  const navigate = useNavigate();

  if (!studentData) return null;

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: '#003D7A',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 61, 122, 0.2)',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 500 }}>
            Enrollment No
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {studentData.enrollmentNo}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 500 }}>
            Name
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {studentData.name}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          {availableViews && selectedView !== undefined && onChangeView ? (
            <FormControl fullWidth>
              <InputLabel id="view-select-label" sx={{ color: 'white' }}>
                Select View
              </InputLabel>
              <Select
                labelId="view-select-label"
                value={selectedView}
                label="Select View"
                onChange={(e) => onChangeView(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {availableViews.map(v => (
                  <MenuItem key={v} value={v}>
                    {v === 'general' ? 'General' : `${v} Semester`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                Current Semester
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {studentData.currentSemester ? `${studentData.currentSemester}th Semester` : 'N/A'}
              </Typography>
            </>
          )}
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
      </Box>
    </Paper>
  );
};

export default StudentHeader;