import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003D7A', // Amity Blue
      light: '#0055B3',
      dark: '#002847',
    },
    secondary: {
      main: '#FF6B35', // Accent color
      light: '#FF8C61',
      dark: '#CC5529',
    },
    background: {
      default: 'linear-gradient(135deg, #0A3D7A 0%, #1A5BA8 50%, #2E70B8 100%)',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      color: '#003D7A',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 61, 122, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#003D7A',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#003D7A',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation3: {
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 61, 122, 0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
