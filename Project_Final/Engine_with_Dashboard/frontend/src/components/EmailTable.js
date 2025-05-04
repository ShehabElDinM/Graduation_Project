import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import axios from 'axios';

const EmailTable = ({ emails }) => {
  const handleRelease = async (emailId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/release/${emailId}`);
      if (response.status === 200) {
        // You can add a success notification here if you want
        console.log('Email released successfully');
      }
    } catch (error) {
      console.error('Error releasing email:', error);
    }
  };

  const columns = [
    { field: 'email_id', headerName: 'ID', width: 70 },
    { field: 'sender', headerName: 'Sender', width: 200, flex: 1 },
    { field: 'recipient', headerName: 'Recipient', width: 200, flex: 1 },
    { field: 'subject', headerName: 'Subject', width: 300, flex: 1 },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      renderCell: (params) => (
        <div
          style={{
            backgroundColor: params.value === 'Safe' ? '#48BB78' : '#F56565',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            width: '80px',
            textAlign: 'center'
          }}
        >
          {params.value}
        </div>
      ),
    },
    { field: 'apt_groups', headerName: 'APT Groups', width: 150, flex: 1 },
    { field: 'technique', headerName: 'Technique', width: 200, flex: 1 },
    { field: 'tactic', headerName: 'Tactic', width: 150, flex: 1 },
    { field: 'timestamp', headerName: 'Time', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.row.label === 'Phishing') {
          return (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row selection
                handleRelease(params.row.email_id);
              }}
              sx={{
                backgroundColor: '#4FD1C5',
                '&:hover': {
                  backgroundColor: '#38B2AC',
                },
              }}
            >
              Release
            </Button>
          );
        }
        return null;
      },
    }
  ];

  return (
    <div style={{ height: 650, width: '100%' }}>
      <DataGrid
        rows={emails}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        getRowId={(row) => row.email_id}
        disableSelectionOnClick
      />
    </div>
  );
};

export default EmailTable; 