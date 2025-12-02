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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { triggerDashboardRefresh } from '../../services/dashboardService';

const CourseManagement = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [assignTeacherDialog, setAssignTeacherDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'BEGINNER',
    duration: '',
    price: 0,
    instructorId: ''
  });
  const [assignTeacherData, setAssignTeacherData] = useState({
    teacherId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const categories = [
    'Programming',
    'Mathematics',
    'Science',
    'Business',
    'Arts',
    'Languages',
    'Technology',
    'Health',
    'Social Sciences',
    'Engineering'
  ];

  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  // Helper to ensure array
  const ensureArray = (data, context = '') => {
    if (Array.isArray(data)) return data;
    console.warn(`⚠️ ${context} returned non-array:`, typeof data);
    if (!data) return [];
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.courses && Array.isArray(data.courses)) return data.courses;
    if (typeof data === 'object') return [data];
    return [];
  };

  const loadCourses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      setError('');
      
      console.log('📚 Loading courses...');
      const response = await apiService.courses.getAllCourses();
      const coursesData = ensureArray(response.data, 'getAllCourses');
      
      console.log(`✅ Loaded ${coursesData.length} courses`);
      setCourses(coursesData.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ));
      
      console.log('👨‍🏫 Loading teachers...');
      const teachersResponse = await apiService.users.getTeachers();
      const teachersData = ensureArray(teachersResponse.data, 'getTeachers');
      
      console.log(`✅ Loaded ${teachersData.length} teachers`);
      setTeachers(teachersData);
      
      setLastUpdate(Date.now());
      setAutoRefreshCount(prev => prev + 1);
      
      if (!silent) {
        setSuccess('Courses loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error loading courses:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const extractErrorMessage = (error) => {
    console.log('Full error object:', error);
    
    if (typeof error === 'string') return error;
    
    if (error.response) {
      console.log('Error response data:', error.response.data);
      
      if (error.response.data) {
        if (error.response.data.message) {
          return error.response.data.message;
        }
        if (error.response.data.error) {
          return error.response.data.error;
        }
        if (typeof error.response.data === 'string') {
          return error.response.data;
        }
        if (typeof error.response.data === 'object') {
          const errorMessages = Object.values(error.response.data).flat();
          return errorMessages.join(', ') || 'Validation error occurred';
        }
      }
      
      return `Server error: ${error.response.status}`;
    }
    
    if (error.request) {
      return 'Network error: Could not connect to server';
    }
    
    if (error.message) return error.message;
    
    return 'An unexpected error occurred';
  };

  useEffect(() => {
    loadCourses();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadCourses(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenDialog = () => {
    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      setError('Only administrators can create courses. Please contact your admin.');
      return;
    }
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      level: 'BEGINNER',
      duration: '',
      price: 0,
      instructorId: ''
    });
    setFormErrors({});
  };

  const handleOpenEditDialog = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      level: course.level || 'BEGINNER',
      duration: course.duration || '',
      price: course.price || 0,
      instructorId: course.instructorId || ''
    });
    setEditDialog(true);
    setFormErrors({});
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      level: 'BEGINNER',
      duration: '',
      price: 0,
      instructorId: ''
    });
    setFormErrors({});
  };

  const handleOpenAssignTeacher = (course) => {
    setSelectedCourse(course);
    setAssignTeacherDialog(true);
    setAssignTeacherData({
      teacherId: course.instructorId || ''
    });
  };

  const handleCloseAssignTeacher = () => {
    setAssignTeacherDialog(false);
    setSelectedCourse(null);
    setAssignTeacherData({
      teacherId: ''
    });
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setSelectedCourse(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAssignTeacherChange = (e) => {
    const { name, value } = e.target;
    setAssignTeacherData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Course title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Course title must be at least 3 characters long';
    }

    if (!formData.description.trim()) {
      errors.description = 'Course description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Course description must be at least 10 characters long';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.duration.trim()) {
      errors.duration = 'Duration is required';
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }

    if (formData.price > 10000) {
      errors.price = 'Price seems too high. Please verify the amount.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        duration: formData.duration.trim(),
        price: parseFloat(formData.price) || 0,
        instructorId: formData.instructorId || null
      };

      console.log('📤 Sending course data as ADMIN:', courseData);
      console.log('👤 Current user role:', user?.role);

      let response;

      // Try admin-specific method first
      if (user?.role === 'ADMIN') {
        try {
          console.log('🔄 Using admin course creation method...');
          response = await apiService.courses.adminCreateCourse(courseData);
        } catch (adminError) {
          console.log('🔄 Admin method failed, trying regular method with admin headers...');
          response = await apiService.courses.createCourse(courseData);
        }
      } else {
        // Regular teacher method
        response = await apiService.courses.createCourse(courseData);
      }
      
      console.log('✅ Course creation response:', response);
      
      if (response.data) {
        setSuccess('Course created successfully!');
        handleCloseDialog();
        loadCourses(true);
        triggerDashboardRefresh();
      }
    } catch (err) {
      console.error('❌ Error creating course:', err);
      const errorMessage = extractErrorMessage(err);
      
      // Provide more specific error message for admin
      if (user?.role === 'ADMIN' && errorMessage.includes('Only teachers can create courses')) {
        setError('Admin course creation not properly configured. Please contact development team.');
      } else {
        setError(`Failed to create course: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        duration: formData.duration.trim(),
        price: parseFloat(formData.price) || 0,
        instructorId: formData.instructorId || null
      };

      console.log('📤 Sending update data:', courseData);

      const response = await apiService.courses.updateCourse(selectedCourse.id, courseData);
      
      console.log('✅ Course update response:', response);
      
      if (response.data) {
        setSuccess('Course updated successfully!');
        handleCloseEditDialog();
        loadCourses(true);
        triggerDashboardRefresh();
      }
    } catch (err) {
      console.error('❌ Error updating course:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to update course: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    
    if (!assignTeacherData.teacherId) {
      setError('Please select a teacher');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const updateData = {
        instructorId: assignTeacherData.teacherId
      };

      console.log('📤 Assigning teacher data:', updateData);

      const response = await apiService.courses.updateCourse(selectedCourse.id, updateData);
      
      console.log('✅ Teacher assignment response:', response);
      
      if (response.data) {
        setSuccess('Teacher assigned to course successfully!');
        handleCloseAssignTeacher();
        loadCourses(true);
        triggerDashboardRefresh();
      }
    } catch (err) {
      console.error('❌ Error assigning teacher:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to assign teacher: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await apiService.courses.deleteCourse(courseId);
        setCourses(prev => prev.filter(course => course.id !== courseId));
        setSuccess('Course deleted successfully');
        triggerDashboardRefresh();
      } catch (err) {
        console.error('Error deleting course:', err);
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
      }
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || price === '0') return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'BEGINNER': return 'success';
      case 'INTERMEDIATE': return 'warning';
      case 'ADVANCED': return 'error';
      default: return 'default';
    }
  };

  const getAssignedTeacherName = (course) => {
    if (!course.instructorId) return 'Not Assigned';
    const teacher = teachers.find(t => t.id === course.instructorId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = courses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading courses...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Course Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.role === 'ADMIN' 
                ? 'Admin: Manage all courses and assign teachers' 
                : 'View courses and manage assignments'
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()} • Auto-refresh: {autoRefreshCount} times
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={() => loadCourses()}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </Box>
        
        {user?.role === 'ADMIN' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Admin Mode:</strong> You have full permissions to create, edit, and delete courses.
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {courses.length}
              </Typography>
              <Typography variant="body1">Total Courses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {courses.filter(course => course.instructorId).length}
              </Typography>
              <Typography variant="body1">Courses with Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {courses.filter(course => course.price === 0 || course.price === '0').length}
              </Typography>
              <Typography variant="body1">Free Courses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {courses.filter(course => course.level === 'ADVANCED').length}
              </Typography>
              <Typography variant="body1">Advanced Courses</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {user?.role === 'ADMIN' && (
          <Button 
            variant="contained" 
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add New Course
          </Button>
        )}
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          <Typography variant="subtitle2" gutterBottom>
            Error Details:
          </Typography>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Courses Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Course Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Level</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Duration</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Instructor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No courses found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentCourses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {course.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={course.category || 'Uncategorized'} 
                      color="secondary" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.level}
                      color={getLevelColor(course.level)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{course.duration}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={course.price === 0 || course.price === '0' ? 'success.main' : 'primary.main'}
                    >
                      {formatPrice(course.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getAssignedTeacherName(course)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewDetails(course)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Only admins can assign teachers and edit/delete courses */}
                      {user?.role === 'ADMIN' && (
                        <>
                          <Tooltip title="Assign Teacher">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenAssignTeacher(course)}
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Course">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenEditDialog(course)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Course">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
          <Typography variant="caption">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, courses.length)} of {courses.length}
          </Typography>
        </Box>
      )}

      {/* Add Course Dialog - Only for Admins */}
      {user?.role === 'ADMIN' && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Add New Course (Admin)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new course as administrator
            </Typography>
          </DialogTitle>
          
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    error={!!formErrors.title}
                    helperText={formErrors.title || "Enter a descriptive course title"}
                    required
                    placeholder="e.g., Introduction to JavaScript"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Description *"
                    name="description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description || "Describe what students will learn"}
                    required
                    placeholder="Provide a detailed description of the course content and learning objectives..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category *"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    error={!!formErrors.category}
                    helperText={formErrors.category || "Select a category for the course"}
                    required
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    helperText="Select the difficulty level"
                  >
                    {levels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration *"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    error={!!formErrors.duration}
                    helperText={formErrors.duration || "e.g., '8 weeks', '30 hours', 'Self-paced'"}
                    required
                    placeholder="e.g., 8 weeks, 30 hours"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price ($)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price || "Enter 0 for free course"}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    placeholder="0 for free course"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Instructor (Optional)"
                    name="instructorId"
                    value={formData.instructorId}
                    onChange={handleInputChange}
                    helperText="Assign a teacher to this course (optional)"
                  >
                    <MenuItem value="">No instructor assigned</MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
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
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Creating...' : 'Create Course'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Edit Course Dialog - Only for Admins */}
      {user?.role === 'ADMIN' && (
        <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Edit Course (Admin)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update course details for: {selectedCourse?.title}
            </Typography>
          </DialogTitle>
          
          <form onSubmit={handleUpdateCourse}>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Description *"
                    name="description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category *"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    error={!!formErrors.category}
                    helperText={formErrors.category}
                    required
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    {levels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration *"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    error={!!formErrors.duration}
                    helperText={formErrors.duration}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price ($)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Instructor"
                    name="instructorId"
                    value={formData.instructorId}
                    onChange={handleInputChange}
                    helperText="Assign a teacher to this course (optional)"
                  >
                    <MenuItem value="">No instructor assigned</MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
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
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Updating...' : 'Update Course'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Assign Teacher Dialog - Only for Admins */}
      {user?.role === 'ADMIN' && (
        <Dialog open={assignTeacherDialog} onClose={handleCloseAssignTeacher} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Assign Teacher to Course (Admin)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign a teacher to: {selectedCourse?.title}
            </Typography>
          </DialogTitle>
          
          <form onSubmit={handleAssignTeacher}>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Select Teacher *"
                    name="teacherId"
                    value={assignTeacherData.teacherId}
                    onChange={handleAssignTeacherChange}
                    required
                    helperText="Choose a teacher to assign to this course"
                  >
                    <MenuItem value="">Select a teacher</MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseAssignTeacher} color="inherit" disabled={submitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Assigning...' : 'Assign Teacher'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* View Course Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Course Details
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {selectedCourse.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedCourse.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Chip label={selectedCourse.category} color="secondary" sx={{ mt: 1 }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Level</Typography>
                  <Chip 
                    label={selectedCourse.level} 
                    color={getLevelColor(selectedCourse.level)} 
                    sx={{ mt: 1 }} 
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{selectedCourse.duration}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    {formatPrice(selectedCourse.price)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Instructor</Typography>
                  <Typography variant="body1">{getAssignedTeacherName(selectedCourse)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Course ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedCourse.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedCourse.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseViewDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;