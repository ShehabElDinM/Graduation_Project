import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import UpdateIcon from '@mui/icons-material/Update';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';

function Administrative() {
  const [phishingEmails, setPhishingEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [training, setTraining] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  const fetchPhishingEmails = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emails');
      const phishingOnly = response.data.emails.filter(email => email.label === 'Phishing');
      setPhishingEmails(phishingOnly);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setLoading(false);
      showNotification('Error fetching emails', 'error');
    }
  }, [showNotification]);

  const handleReleaseClick = useCallback((emailId) => {
    setSelectedEmailId(emailId);
    setOpenDialog(true);
  }, []);

  const handleConfirmRelease = useCallback(async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/release/${selectedEmailId}`);
      if (response.status === 200) {
        await fetchPhishingEmails();
        showNotification('Email released successfully');
      }
    } catch (error) {
      console.error('Error releasing email:', error);
      showNotification('Error releasing email', 'error');
    } finally {
      setOpenDialog(false);
      setSelectedEmailId(null);
    }
  }, [selectedEmailId, showNotification, fetchPhishingEmails]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedEmailId(null);
  }, []);

  const handleUpdate = useCallback(async () => {
    try {
      setUpdating(true);
      await axios.post('http://localhost:5000/api/update-dataset');
      await fetchPhishingEmails();
      showNotification('Dataset updated successfully');
    } catch (error) {
      console.error('Error updating dataset:', error);
      showNotification('Error updating dataset', 'error');
    } finally {
      setUpdating(false);
    }
  }, [showNotification, fetchPhishingEmails]);

  const handleTrain = useCallback(async () => {
    try {
      setTraining(true);
      await axios.post('http://localhost:5000/api/train-model');
      showNotification('Model trained successfully');
    } catch (error) {
      console.error('Error training model:', error);
      showNotification('Error training model', 'error');
    } finally {
      setTraining(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPhishingEmails();
    const interval = setInterval(fetchPhishingEmails, 30000);
    return () => clearInterval(interval);
  }, [fetchPhishingEmails]);

  const columns = [
    { 
      field: 'email_id', 
      headerName: 'Email ID', 
      width: 120,
      flex: 1
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleReleaseClick(params.row.email_id)}
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
          Release
        </Button>
      ),
    }
  ];

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            textShadow: '0 0 20px rgba(79, 209, 197, 0.3)',
            '&::after': {
              content: '""',
              display: 'block',
              width: '60px',
              height: '4px',
              background: 'primary.main',
              borderRadius: '2px',
              marginTop: '8px',
            },
          }}
        >
          Administrative
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<UpdateIcon />}
            onClick={handleUpdate}
            disabled={updating}
            sx={{
              height: '40px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: '#4FD1C5',
              '&:hover': {
                backgroundColor: '#38B2AC',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(79, 209, 197, 0.4)',
              },
            }}
          >
            {updating ? 'Updating...' : 'Update Dataset'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ModelTrainingIcon />}
            onClick={handleTrain}
            disabled={training}
            sx={{
              height: '40px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: '#805AD5',
              '&:hover': {
                backgroundColor: '#6B46C1',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(128, 90, 213, 0.4)',
              },
            }}
          >
            {training ? 'Training...' : 'Train Model'}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        <Box sx={{ width: '50%' }}>
          <Paper
            sx={{
              height: 500,
              width: '100%',
              bgcolor: 'background.paper',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#4FD1C5',
                  fontWeight: 600,
                }}
              >
                Phishing Emails
              </Typography>
            </Box>
            <DataGrid
              rows={phishingEmails}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              getRowId={(row) => row.email_id}
              loading={loading}
              disableSelectionOnClick
              sx={{
                border: 'none',
                flex: 1,
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
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid rgba(255, 255, 255, 0.12)',
                  bgcolor: 'background.paper',
                },
                '& .MuiTablePagination-root': {
                  color: 'text.primary',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: 'text.secondary',
                },
                '& .MuiTablePagination-select': {
                  color: 'text.primary',
                },
              }}
            />
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          Warning: Release Phishing Email
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            You are about to release a phishing email. This action will send the original email to its intended recipient. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRelease}
            variant="contained"
            sx={{
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Release Email
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Administrative; 