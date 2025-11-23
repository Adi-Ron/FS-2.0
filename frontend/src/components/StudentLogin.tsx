import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';

const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    enrollmentNo: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await auth.studentLogin({
        enrollmentNo: formData.enrollmentNo,
        password: formData.password
      });
      login(response.data.token, response.data.student);
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#003D7A',
      }}
    >
      <Box sx={{ position: 'absolute', top: 30, left: 30, zIndex: 10 }}>
          <img
            src="/amity-removebg-preview(1).png"
            alt="Amity Logo"
            style={{ height: '100px', objectFit: 'contain' }}
          />
        </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', py: 4, pb: 12 }}>

        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: '12px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 61, 122, 0.1)',
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                mb: 1,
                color: '#003D7A',
                fontWeight: 600,
                fontSize: '28px',
              }}
            >
              Student Login
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: '#666',
                fontSize: '14px',
              }}
            >
              Enter your credentials to continue
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                name="enrollmentNo"
                label="Enrollment Number"
                required
                value={formData.enrollmentNo}
                onChange={handleChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
              />
              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                >
                  Login
                </Button>
              </Box>
            </form>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default StudentLogin;
