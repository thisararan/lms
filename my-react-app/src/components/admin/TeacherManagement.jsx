import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Pagination
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { triggerDashboardRefresh } from '../../services/dashboardService';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [assignCourseDialog, setAssignCourseDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    qualification: '',
    subject: ''
  });
  const [assignCourseData, setAssignCourseData] = useState({
    subject: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Helper to ensure array
  const ensureArray = (data, context = '') => {
    if (Array.isArray(data)) return data;
    console.warn(`⚠️ ${context} returned non-array:`, typeof data);
    if (!data) return [];
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.teachers && Array.isArray(data.teachers)) return data.teachers;
    if (typeof data === 'object') return [data];
    return [];
  };

  const fetchTeachers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      setError('');
      
      console.log('🔄 Loading teachers...');
      const response = await apiService.users.getTeachers();
      const teachersData = ensureArray(response.data, 'getTeachers');
      
      console.log(`✅ Loaded ${teachersData.length} teachers`);
      setTeachers(teachersData.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ));
      
      console.log('📚 Loading courses...');
      const coursesResponse = await apiService.courses.getAllCourses();
      const coursesData = ensureArray(coursesResponse.data, 'getAllCourses');
      
      console.log(`✅ Loaded ${coursesData.length} courses`);
      setCourses(coursesData);
      
      setLastUpdate(Date.now());
      setAutoRefreshCount(prev => prev + 1);
      
      if (!silent) {
        setSuccess('Teachers loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error fetching teachers:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const extractErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data) {
      if (typeof error.response.data === 'string') return error.response.data;
      if (error.response.data.error) return error.response.data.error;
      return JSON.stringify(error.response.data);
    }
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  };

  useEffect(() => {
    fetchTeachers();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTeachers(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenAssignCourse = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignCourseData({
      subject: teacher.subject || ''
    });
    setAssignCourseDialog(true);
  };

  const handleCloseAssignCourse = () => {
    setAssignCourseDialog(false);
    setSelectedTeacher(null);
    setAssignCourseData({ subject: '' });
  };

  const handleAssignCourseChange = (e) => {
    const { name, value } = e.target;
    setAssignCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    
    if (!assignCourseData.subject) {
      setError('Please select a course to assign');
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        subject: assignCourseData.subject
      };

      await apiService.users.updateUser(selectedTeacher.id, updateData);
      
      setSuccess(`Course "${assignCourseData.subject}" assigned to ${selectedTeacher.name} successfully!`);
      handleCloseAssignCourse();
      fetchTeachers(true);
      triggerDashboardRefresh();
    } catch (err) {
      console.error('❌ Error assigning course:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to assign course: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignCourse = async (teacher) => {
    const currentCourse = getTeacherCourse(teacher);
    if (currentCourse === 'Not Assigned') {
      setError('This teacher has no course assigned');
      return;
    }

    if (window.confirm(`Are you sure you want to unassign "${currentCourse}" from ${teacher.name}?`)) {
      try {
        await apiService.users.updateUser(teacher.id, { subject: null });
        setSuccess(`Course unassigned from ${teacher.name} successfully!`);
        fetchTeachers(true);
        triggerDashboardRefresh();
      } catch (err) {
        console.error('❌ Error unassigning course:', err);
        setError(`Failed to unassign course: ${extractErrorMessage(err)}`);
      }
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      qualification: '',
      subject: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const teacherData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone || '',
        qualification: formData.qualification.trim(),
        subject: formData.subject || '',
        role: 'TEACHER'
      };

      await apiService.users.createTeacher(teacherData);
      
      const successMessage = formData.subject 
        ? `Teacher added successfully! Course "${formData.subject}" assigned.`
        : 'Teacher added successfully!';
      
      setSuccess(successMessage);
      handleCloseDialog();
      fetchTeachers(true);
      triggerDashboardRefresh();
    } catch (err) {
      console.error('❌ Error adding teacher:', err);
      setError(`Failed to add teacher: ${extractErrorMessage(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setSelectedTeacher(null);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      subject: teacher.subject || ''
    });
    setEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedTeacher(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      qualification: '',
      subject: ''
    });
    setFormErrors({});
  };

  const validateEditForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) return;

    setSubmitting(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone || '',
        qualification: formData.qualification.trim(),
        subject: formData.subject || ''
      };

      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      await apiService.users.updateUser(selectedTeacher.id, updateData);
      
      setSuccess('Teacher updated successfully!');
      handleCloseEditDialog();
      fetchTeachers(true);
      triggerDashboardRefresh();
    } catch (err) {
      console.error('❌ Error updating teacher:', err);
      setError(`Failed to update teacher: ${extractErrorMessage(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to delete teacher "${teacherName}"? This action cannot be undone.`)) {
      try {
        await apiService.users.deleteUser(teacherId);
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
        setSuccess('Teacher deleted successfully');
        triggerDashboardRefresh();
      } catch (err) {
        console.error('❌ Error deleting teacher:', err);
        setError(extractErrorMessage(err));
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    const names = name.split(' ');
    const first = names[0] ? names[0].charAt(0) : 'U';
    const last = names[1] ? names[1].charAt(0) : names[0] ? names[0].charAt(1) : 'S';
    return `${first}${last}`.toUpperCase();
  };

  const getTeacherCourse = (teacher) => {
    return teacher.subject || 'Not Assigned';
  };

  const getUniqueCourseTitles = () => {
    const courseTitles = courses.map(course => course.title).filter(Boolean);
    return [...new Set(courseTitles)];
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = teachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(teachers.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading teachers...</Typography>
      </Box>
    );
  }

  const stats = {
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter(t => t.status === 'ACTIVE').length,
    teachersWithCourses: teachers.filter(teacher => getTeacherCourse(teacher) !== 'Not Assigned').length
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Teacher Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all teachers and their assigned courses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()} • Auto-refresh: {autoRefreshCount} times
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={() => fetchTeachers()}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.totalTeachers}
              </Typography>
              <Typography variant="body1">Total Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.activeTeachers}
              </Typography>
              <Typography variant="body1">Active Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {stats.teachersWithCourses}
              </Typography>
              <Typography variant="body1">Teachers with Courses</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleOpenDialog}
        >
          Add New Teacher
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Teachers Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Teacher</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned Course</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Join Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No teachers found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentTeachers.map((teacher) => (
                <TableRow key={teacher.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(teacher.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {teacher.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {teacher.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{teacher.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={getTeacherCourse(teacher)} 
                        color={getTeacherCourse(teacher) !== 'Not Assigned' ? "secondary" : "default"} 
                        size="small" 
                        onClick={() => handleOpenAssignCourse(teacher)}
                        clickable
                      />
                      {getTeacherCourse(teacher) !== 'Not Assigned' && (
                        <Tooltip title="Unassign Course">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleUnassignCourse(teacher)}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={teacher.status || 'ACTIVE'}
                      color={teacher.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(teacher.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(teacher)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Teacher">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign Course">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenAssignCourse(teacher)}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Teacher">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Add Teacher Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Add New Teacher
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the details to add a new teacher to the system
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleAddTeacher}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                  placeholder="Enter full name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  required
                  placeholder="At least 6 characters"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., M.Sc. in Computer Science"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Assign Course"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  helperText="Select a course to assign to this teacher"
                >
                  <MenuItem value="">No course assigned</MenuItem>
                  {getUniqueCourseTitles().map((courseTitle) => (
                    <MenuItem key={courseTitle} value={courseTitle}>
                      {courseTitle}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Add Teacher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Edit Teacher
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update teacher information for {selectedTeacher?.name}
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleUpdateTeacher}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password || 'Leave blank to keep current password'}
                  placeholder="Leave blank to keep current"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Assign Course"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  helperText="Change the assigned course for this teacher"
                >
                  <MenuItem value="">No course assigned</MenuItem>
                  {getUniqueCourseTitles().map((courseTitle) => (
                    <MenuItem key={courseTitle} value={courseTitle}>
                      {courseTitle}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseEditDialog} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Update Teacher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Course Dialog */}
      <Dialog open={assignCourseDialog} onClose={handleCloseAssignCourse} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Assign Course to Teacher
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign a course to {selectedTeacher?.name}
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleAssignCourse}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Course"
                  name="subject"
                  value={assignCourseData.subject}
                  onChange={handleAssignCourseChange}
                  required
                >
                  <MenuItem value="">Select a course</MenuItem>
                  {getUniqueCourseTitles().map((courseTitle) => (
                    <MenuItem key={courseTitle} value={courseTitle}>
                      {courseTitle}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {selectedTeacher && getTeacherCourse(selectedTeacher) !== 'Not Assigned' && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Currently assigned: <strong>{getTeacherCourse(selectedTeacher)}</strong>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseAssignCourse} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Assign Course'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Teacher Details
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {selectedTeacher && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center', flexDirection: 'column' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', mb: 2 }}>
                  {getInitials(selectedTeacher.name)}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {selectedTeacher.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teacher ID: {selectedTeacher.id}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon color="action" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedTeacher.email}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon color="action" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Assigned Course</Typography>
                      <Chip 
                        label={getTeacherCourse(selectedTeacher)} 
                        color={getTeacherCourse(selectedTeacher) !== 'Not Assigned' ? "secondary" : "default"} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon color="action" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{selectedTeacher.phone || 'Not provided'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon color="action" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Qualification</Typography>
                      <Typography variant="body1">{selectedTeacher.qualification || 'Not provided'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon color="action" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Join Date</Typography>
                      <Typography variant="body1">{formatDate(selectedTeacher.createdAt)}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ width: 24, height: 24, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: selectedTeacher.status === 'ACTIVE' ? 'success.main' : 'grey.500' 
                        }} 
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip
                        label={selectedTeacher.status || 'ACTIVE'}
                        color={selectedTeacher.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseViewDialog} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherManagement;