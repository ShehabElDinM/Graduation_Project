import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const COLORS = ['#4FD1C5', '#F56565'];

function StatCard({ title, value, color, delay, icon: Icon }) {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        animation: `${fadeIn} 0.6s ease-out ${delay}s both`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
          '& .icon': {
            transform: 'scale(1.2) rotate(10deg)',
            color: color,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: color,
          borderRadius: '4px 4px 0 0',
        },
      }}
    >
      {Icon && (
        <Icon
          className="icon"
          sx={{
            fontSize: 40,
            mb: 1,
            color: 'text.secondary',
            transition: 'all 0.3s ease-in-out',
          }}
        />
      )}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          color: color,
          fontWeight: 600,
          textShadow: `0 0 20px ${color}40`,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    phishing_count: 0,
    safe_count: 0,
    recent: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const phishingPercentage = stats.total ? ((stats.phishing_count / stats.total) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Safe', value: stats.safe_count },
    { name: 'Phishing', value: stats.phishing_count },
  ];

  const recentEmails = stats.recent.slice(0, 3);

  return (
    <Box sx={{ animation: `${fadeIn} 0.4s ease-out`, p: 3 }}>
      <Typography 
        variant="h4" 
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          mb: 4,
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
        Quick Statistics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Emails"
            value={stats.total}
            color="#4FD1C5"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Safe Emails"
            value={stats.safe_count}
            color="#48BB78"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Phishing Emails"
            value={stats.phishing_count}
            color="#F56565"
            delay={0.3}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Phishing Rate"
            value={`${phishingPercentage}%`}
            color="#ED8936"
            delay={0.4}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              animation: `${fadeIn} 0.6s ease-out 0.5s both`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              },
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
              Email Distribution
            </Typography>
            <Box sx={{ height: 250, width: '100%' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.2))',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(45, 55, 72, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      padding: '8px 12px',
                    }}
                    itemStyle={{
                      color: '#E2E8F0',
                      fontSize: '14px',
                      padding: '4px 0',
                    }}
                    labelStyle={{
                      color: '#90CDF4',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              animation: `${fadeIn} 0.6s ease-out 0.6s both`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              },
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
              Recent Emails
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Sender</th>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Label</th>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>APT Groups</th>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmails.map((email, index) => (
                    <tr
                      key={index}
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(8px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{email.sender}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{email.subject}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography
                          sx={{
                            color: email.label === 'Safe' ? '#48BB78' : '#F56565',
                            bgcolor: email.label === 'Safe' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            fontWeight: 500,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            },
                          }}
                        >
                          {email.label}
                        </Typography>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{email.apt_groups}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{new Date(email.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 