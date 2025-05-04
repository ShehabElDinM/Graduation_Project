import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Grid, Button } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import XLSX from 'xlsx-js-style';
import { styled } from '@mui/material/styles';

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `2px solid ${theme.palette.divider}`,
    },
    '& .MuiDataGrid-row': {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
        '&:hover': {
            backgroundColor: theme.palette.action.selected,
        },
    },
}));

function EmailTable() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emails');
      setEmails(response.data.emails);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setLoading(false);
    }
  };

  const columns = [
    { field: 'email_id', headerName: 'ID', width: 70 },
    { field: 'sender', headerName: 'Sender', width: 200 },
    { field: 'recipient', headerName: 'Recipient', width: 200 },
    { field: 'subject', headerName: 'Subject', width: 300 },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      renderCell: (params) => (
        <Typography
          sx={{
            color: params.value === 'Safe' ? 'success.main' : 'error.main',
            bgcolor: params.value === 'Safe' ? 'rgba(84, 214, 44, 0.16)' : 'rgba(255, 72, 66, 0.16)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    { field: 'apt_groups', headerName: 'APT Groups', width: 150 },
    { field: 'technique', headerName: 'Technique', width: 150 },
    { field: 'tactic', headerName: 'Tactic', width: 150 },
    { field: 'timestamp', headerName: 'Time', width: 180 },
  ];

  const filteredEmails = emails.filter((email) => {
    const matchesFilter = filter === 'all' || email.label === filter;
    const matchesSearch = Object.values(email).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesFilter && matchesSearch;
  });

  const exportToExcel = () => {
    const exportData = filteredEmails.map(({
      email_id,
      sender,
      recipient,
      subject,
      label,
      apt_groups,
      technique,
      tactic,
      timestamp
    }) => ({
      'Email ID': email_id,
      Sender: sender,
      Recipient: recipient,
      Subject: subject,
      Label: label,
      'APT Groups': apt_groups,
      Technique: technique,
      Tactic: tactic,
      Timestamp: new Date(timestamp).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add styles to the worksheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4FD1C5" } },
        alignment: { horizontal: "center" }
      };
    }

    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Email ID
      { wch: 30 }, // Sender
      { wch: 30 }, // Recipient
      { wch: 40 }, // Subject
      { wch: 15 }, // Label
      { wch: 25 }, // APT Groups
      { wch: 25 }, // Technique
      { wch: 20 }, // Tactic
      { wch: 20 }, // Timestamp
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emails');
    XLSX.writeFile(wb, 'phishglare_emails.xlsx');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#4FD1C5',
            fontWeight: 600,
            textShadow: '0 0 20px rgba(79, 209, 197, 0.3)',
            '&::after': {
              content: '""',
              display: 'block',
              width: '60px',
              height: '4px',
              background: '#4FD1C5',
              borderRadius: '2px',
              marginTop: '8px',
            },
          }}
        >
          Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Export to Excel
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  '& fieldset': {
                    borderWidth: '2px',
                    boxShadow: '0 0 8px rgba(79, 209, 197, 0.2)',
                  },
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Filter by Status"
            variant="outlined"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  '& fieldset': {
                    borderWidth: '2px',
                    boxShadow: '0 0 8px rgba(79, 209, 197, 0.2)',
                  },
                },
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Safe">Safe</MenuItem>
            <MenuItem value="Phishing">Phishing</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Paper
        sx={{
          height: 'calc(100vh - 250px)',
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          },
        }}
      >
        <StyledDataGrid
          rows={filteredEmails}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.email_id}
          components={{
            Toolbar: GridToolbar,
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              transition: 'background-color 0.2s ease-in-out',
            },
            '& .MuiDataGrid-row': {
              transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                transform: 'translateX(4px)',
              },
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'background.paper',
              borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
            },
            '& .MuiButton-root': {
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            },
            '& .MuiDataGrid-menuIcon': {
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
}

export default EmailTable; 