// src/components/student/MySubmissions.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Alert, LinearProgress
} from '@mui/material';
import { Download, Grade as GradeIcon } from '@mui/icons-material';
import { apiService } from '../../services/api';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiService.submissions.getMySubmissions();
      setSubmissions(res.data?.data || []);
    } catch (err) {
      setError('Failed to load submissions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'default';
    const pct = grade;
    if (pct >= 90) return 'success';
    if (pct >= 75) return 'info';
    if (pct >= 60) return 'warning';
    return 'error';
  };

  if (loading) return (
    <Box textAlign="center" my={10}>
      <CircularProgress size={60} />
      <Typography variant="h6" mt={2}>Loading your submissions...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 4, maxWidth: '1400px', mx: 'auto' }}>
      <Typography variant="h3" gutterBottom color="primary" fontWeight="bold">
        My Assignment Submissions & Grades
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        View all your submitted assignments, grades, and teacher feedback
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {submissions.length === 0 ? (
        <Alert severity="info" sx={{ fontSize: '1.1rem' }}>
          No submissions yet. Start submitting your assignments!
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={6}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Assignment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Course</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Submitted</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Feedback</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell>
                    <Typography fontWeight="bold">{sub.assignmentTitle || 'Unknown Assignment'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={sub.courseTitle || 'Unknown Course'} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.graded ? "Graded" : "Pending"}
                      color={sub.graded ? "success" : "warning"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {sub.graded ? (
                      <Box>
                        <Chip
                          icon={<GradeIcon />}
                          label={`${sub.grade || 0}/100`}
                          color={getGradeColor(sub.grade || 0)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={sub.grade || 0}
                          sx={{ mt: 1, height: 10, borderRadius: 5 }}
                          color={getGradeColor(sub.grade || 0)}
                        />
                      </Box>
                    ) : (
                      <Chip label="Not graded yet" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.feedback ? (
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {sub.feedback}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary">
                        <em>No feedback yet</em>
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.attachmentUrl ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Download />}
                        href={`http://localhost:8080${sub.attachmentUrl}`}
                        target="_blank"
                        color="secondary"
                      >
                        Download
                      </Button>
                    ) : (
                      <Typography color="text.secondary">No file</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MySubmissions;