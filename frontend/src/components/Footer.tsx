import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
          backgroundColor: '#FDB913',
          color: '#003D7A',
          py: 1,
        mt: 'auto',
        position: 'relative',
        
      }}
    >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
              px: 4,
            gap: 2,
          }}
        >
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '16px' }}>
            Designed By:
          </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '16px' }}>
            Aditya Banerjee | Sharon Melhi
          </Typography>
        </Box>
    </Box>
  );
};

export default Footer;

