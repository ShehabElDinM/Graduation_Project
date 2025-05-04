import React from 'react';
import { Typography } from '@mui/material';

const Reports = () => {
  return (
    <Typography 
      variant="h3" 
      sx={{
        color: '#4FD1C5',
        fontWeight: 600,
        fontSize: '2.5rem',
        mb: 4,
        textShadow: '0 0 20px rgba(79, 209, 197, 0.3)',
        '&::after': {
          content: '""',
          display: 'block',
          width: '80px',
          height: '4px',
          background: '#4FD1C5',
          borderRadius: '2px',
          marginTop: '12px',
        },
      }}
    >
      Reports
    </Typography>
  );
};

export default Reports; 