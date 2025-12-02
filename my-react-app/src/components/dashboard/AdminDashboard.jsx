import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalEnrollments: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    gradedSubmissions: 0,
    averageEnrollmentsPerCourse: 0,
    submissionRate: 0,
    gradingCompletionRate: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState({
    stats: false,
    students: false,
    teachers: false,
    courses: false
  });
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [dataSource, setDataSource] = useState('API');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('students');

  // Safe array conversion helper
  const ensureArray = (data, context = '') => {
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn(`⚠️ ${context} returned non-array:`, typeof data);
    
    if (!data) return [];
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.students && Array.isArray(data.students)) return data.students;
    if (data.teachers && Array.isArray(data.teachers)) return data.teachers;
    if (data.courses && Array.isArray(data.courses)) return data.courses;
    if (typeof data === 'object') return [data];
    
    return [];
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    
    try {
      console.log('🔄 Loading dashboard data from API...');
      setError('');

      // Load all data in parallel FIRST
      const [studentsData, teachersData, coursesData] = await Promise.all([
        loadAllStudents(),
        loadAllTeachers(),
        loadAllCourses()
      ]);

      // Now load stats from API
      setDataLoading(prev => ({ ...prev, stats: true }));
      try {
        const statsResponse = await apiService.users.getAdminDashboardStats();
        const dashboardData = statsResponse.data;

        console.log('📊 Dashboard Stats from API:', dashboardData);

        // Calculate total users from actual loaded data
        const actualTotalUsers = allStudents.length + allTeachers.length + 1; // +1 for current admin

        setStats({
          totalUsers: actualTotalUsers, // Use calculated value
          totalCourses: allCourses.length, // Use actual loaded courses
          totalTeachers: allTeachers.length, // Use actual loaded teachers
          totalStudents: allStudents.length, // Use actual loaded students
          totalAdmins: dashboardData.totalAdmins || 1,
          totalEnrollments: dashboardData.totalEnrollments || 0,
          totalAssignments: dashboardData.totalAssignments || 0,
          totalSubmissions: dashboardData.totalSubmissions || 0,
          gradedSubmissions: dashboardData.gradedSubmissions || 0,
          averageEnrollmentsPerCourse: dashboardData.averageEnrollmentsPerCourse || 0,
          submissionRate: dashboardData.submissionRate || 0,
          gradingCompletionRate: dashboardData.gradingCompletionRate || 0
        });

        console.log('✅ Stats updated:', {
          totalUsers: actualTotalUsers,
          students: allStudents.length,
          teachers: allTeachers.length,
          courses: allCourses.length
        });

      } catch (statsError) {
        console.warn('⚠️ Stats API failed, using calculated values...', statsError);
        
        // Fallback: calculate everything manually
        const actualTotalUsers = allStudents.length + allTeachers.length + 1;
        
        setStats({
          totalUsers: actualTotalUsers,
          totalCourses: allCourses.length,
          totalTeachers: allTeachers.length,
          totalStudents: allStudents.length,
          totalAdmins: 1,
          totalEnrollments: 0,
          totalAssignments: 0,
          totalSubmissions: 0,
          gradedSubmissions: 0,
          averageEnrollmentsPerCourse: 0,
          submissionRate: 0,
          gradingCompletionRate: 0
        });
      }
      setDataLoading(prev => ({ ...prev, stats: false }));

      setLastUpdate(Date.now());
      setRefreshCount(prev => prev + 1);
      setDataSource('API');

      console.log('✅ All dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      handleLoadError(error);
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudents = async () => {
    try {
      setDataLoading(prev => ({ ...prev, students: true }));
      console.log('📚 Loading all students...');
      
      const response = await apiService.users.getAllStudents();
      let students = ensureArray(response.data, 'getAllStudents');

      console.log(`✅ Loaded ${students.length} students`);
      
      const sortedStudents = students.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      setAllStudents(sortedStudents);
      setRecentUsers(sortedStudents.slice(0, 5));
      
      return sortedStudents; // RETURN the data
      
    } catch (error) {
      console.error('❌ Error loading students:', error);
      setAllStudents([]);
      setRecentUsers([]);
      return []; // Return empty array on error
    } finally {
      setDataLoading(prev => ({ ...prev, students: false }));
    }
  };

  const loadAllTeachers = async () => {
    try {
      setDataLoading(prev => ({ ...prev, teachers: true }));
      console.log('👨‍🏫 Loading all teachers...');
      
      const response = await apiService.users.getTeachers();
      let teachers = ensureArray(response.data, 'getTeachers');

      console.log(`✅ Loaded ${teachers.length} teachers`);
      
      const sortedTeachers = teachers.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      setAllTeachers(sortedTeachers);
      
      return sortedTeachers; // RETURN the data
      
    } catch (error) {
      console.error('❌ Error loading teachers:', error);
      setAllTeachers([]);
      return []; // Return empty array on error
    } finally {
      setDataLoading(prev => ({ ...prev, teachers: false }));
    }
  };

  const loadAllCourses = async () => {
    try {
      setDataLoading(prev => ({ ...prev, courses: true }));
      console.log('📖 Loading all courses...');
      
      const response = await apiService.courses.getAllCourses();
      let courses = ensureArray(response.data, 'getAllCourses');

      console.log(`✅ Loaded ${courses.length} courses`);
      
      const sortedCourses = courses.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      setAllCourses(sortedCourses);
      
      return sortedCourses; // RETURN the data
      
    } catch (error) {
      console.error('❌ Error loading courses:', error);
      setAllCourses([]);
      return []; // Return empty array on error
    } finally {
      setDataLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const handleLoadError = (error) => {
    if (error.response?.status === 404) {
      setError('Admin dashboard endpoint not found. Please check if the backend is properly configured.');
    } else if (error.response?.status === 403) {
      setError('Access denied. You need admin privileges to view this dashboard.');
    } else if (error.response?.status === 401) {
      setError('Authentication required. Please log in again.');
    } else {
      setError('Failed to load dashboard data: ' + (error.message || 'Unknown error'));
    }
    setDataSource('Fallback');
  };

  const loadFallbackData = async () => {
    try {
      console.log('🔄 Loading fallback data...');

      const [teachersResponse, studentsResponse, coursesResponse] = await Promise.all([
        apiService.users.getTeachers().catch(() => ({ data: [] })),
        apiService.users.getAllStudents().catch(() => ({ data: [] })),
        apiService.courses.getAllCourses().catch(() => ({ data: [] }))
      ]);

      const teachers = ensureArray(teachersResponse.data, 'Fallback teachers');
      const students = ensureArray(studentsResponse.data, 'Fallback students');
      const courses = ensureArray(coursesResponse.data, 'Fallback courses');

      setAllTeachers(teachers);
      setAllStudents(students);
      setAllCourses(courses);

      const totalUsers = teachers.length + students.length + 1;
      
      setStats(prev => ({
        ...prev,
        totalUsers,
        totalCourses: courses.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalAdmins: 1
      }));

      setRecentUsers(students.slice(0, 5));
      
      console.log('✅ Fallback data loaded');
    } catch (fallbackError) {
      console.error('❌ Fallback data also failed:', fallbackError);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    loadDashboardData();
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
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

  const getStatusBadge = (status) => {
    const statusLower = (status || 'active').toLowerCase();
    switch (statusLower) {
      case 'active':
      case 'enrolled':
        return 'success';
      case 'inactive':
      case 'pending':
        return 'warning';
      case 'suspended':
      case 'expelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'students':
        return allStudents.slice(indexOfFirstItem, indexOfLastItem);
      case 'teachers':
        return allTeachers.slice(indexOfFirstItem, indexOfLastItem);
      case 'courses':
        return allCourses.slice(indexOfFirstItem, indexOfLastItem);
      default:
        return [];
    }
  };

  const getTotalPages = () => {
    const total = activeTab === 'students' ? allStudents.length :
                  activeTab === 'teachers' ? allTeachers.length :
                  allCourses.length;
    return Math.ceil(total / itemsPerPage);
  };

  const currentItems = getCurrentItems();
  const totalPages = getTotalPages();

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container className="my-5 pt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary">Admin Dashboard</h2>
              <p className="text-muted mb-0">Welcome to the Learning Management System</p>
              <small className="text-muted">
                Real-time monitoring • Data source: <Badge bg="info">{dataSource}</Badge>
              </small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <small className="text-muted d-block">Auto-refresh: 30s</small>
                <small className="text-muted d-block">
                  Updates: <Badge bg="info">{refreshCount}</Badge>
                </small>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={triggerRefresh}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt me-1"></i>
                    Refresh Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="warning" className="mb-4" dismissible onClose={() => setError('')}>
          <Alert.Heading>Data Load Warning</Alert.Heading>
          {error}
          <div className="mt-2">
            <Button variant="outline-warning" size="sm" onClick={triggerRefresh}>
              Try Again
            </Button>
          </div>
        </Alert>
      )}

      {/* Main Stats Cards - Top Row */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <i className="fas fa-users fa-2x text-primary"></i>
                <Badge bg="primary" className="fs-6">Total</Badge>
              </div>
              {(dataLoading.stats || dataLoading.students || dataLoading.teachers) && loading ? (
                <Spinner animation="border" size="sm" variant="primary" />
              ) : (
                <>
                  <h2 className="text-primary mb-1 fw-bold">
                    {stats.totalUsers}
                  </h2>
                  <p className="text-muted mb-0">Total Users</p>
                  <small className="text-success">
                    <i className="fas fa-sync-alt me-1"></i>
                    Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <i className="fas fa-user-graduate fa-2x text-success"></i>
                <Badge bg="success" className="fs-6">Students</Badge>
              </div>
              {dataLoading.students ? (
                <Spinner animation="border" size="sm" variant="success" />
              ) : (
                <>
                  <h2 className="text-success mb-1 fw-bold">
                    {stats.totalStudents}
                  </h2>
                  <p className="text-muted mb-0">Students</p>
                  <small className="text-success">
                    <i className="fas fa-sync-alt me-1"></i>
                    Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <i className="fas fa-chalkboard-teacher fa-2x text-warning"></i>
                <Badge bg="warning" className="fs-6">Teachers</Badge>
              </div>
              {dataLoading.teachers ? (
                <Spinner animation="border" size="sm" variant="warning" />
              ) : (
                <>
                  <h2 className="text-warning mb-1 fw-bold">
                    {stats.totalTeachers}
                  </h2>
                  <p className="text-muted mb-0">Teachers</p>
                  <small className="text-success">
                    <i className="fas fa-sync-alt me-1"></i>
                    Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <i className="fas fa-book fa-2x text-info"></i>
                <Badge bg="info" className="fs-6">Courses</Badge>
              </div>
              {dataLoading.courses ? (
                <Spinner animation="border" size="sm" variant="info" />
              ) : (
                <>
                  <h2 className="text-info mb-1 fw-bold">
                    {stats.totalCourses}
                  </h2>
                  <p className="text-muted mb-0">Courses</p>
                  <small className="text-success">
                    <i className="fas fa-sync-alt me-1"></i>
                    Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Stats Row - Bottom Cards */}
      <Row className="mb-4">
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-user-shield fa-2x text-secondary mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="secondary" />
              ) : (
                <>
                  <h4 className="text-secondary mb-1 fw-bold">{stats.totalAdmins || 1}</h4>
                  <small className="text-muted d-block">Admins</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Active
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-clipboard-check fa-2x text-success mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="success" />
              ) : (
                <>
                  <h4 className="text-success mb-1 fw-bold">{stats.totalEnrollments || 0}</h4>
                  <small className="text-muted d-block">Enrollments</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Active
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-tasks fa-2x text-warning mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="warning" />
              ) : (
                <>
                  <h4 className="text-warning mb-1 fw-bold">{stats.totalAssignments || 0}</h4>
                  <small className="text-muted d-block">Assignments</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Active
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-file-upload fa-2x text-info mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="info" />
              ) : (
                <>
                  <h4 className="text-info mb-1 fw-bold">{stats.totalSubmissions || 0}</h4>
                  <small className="text-muted d-block">Submissions</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Active
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="success" />
              ) : (
                <>
                  <h4 className="text-success mb-1 fw-bold">
                    {stats.gradingCompletionRate || 0}%
                  </h4>
                  <small className="text-muted d-block">Graded</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={2} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm hover-shadow">
            <Card.Body className="p-3">
              <i className="fas fa-chart-line fa-2x text-primary mb-2"></i>
              {dataLoading.stats && loading ? (
                <Spinner animation="border" size="sm" variant="primary" />
              ) : (
                <>
                  <h4 className="text-primary mb-1 fw-bold">
                    {stats.averageEnrollmentsPerCourse || 0}
                  </h4>
                  <small className="text-muted d-block">Avg/Course</small>
                  <small className="text-success">
                    <i className="fas fa-circle" style={{fontSize: '6px'}}></i> Live
                  </small>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title mb-1">Quick Actions</h5>
                  <p className="text-muted mb-0">Manage your LMS efficiently</p>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Last updated:</small>
                  <small className="text-muted">{formatDate(lastUpdate)}</small>
                </div>
              </div>
              <div className="d-flex gap-3 flex-wrap mt-3">
                <Button as={Link} to="/admin/teachers" variant="primary" size="lg" className="px-4">
                  <i className="fas fa-chalkboard-teacher me-2"></i>
                  Manage Teachers ({allTeachers.length})
                </Button>
                <Button as={Link} to="/admin/courses" variant="success" size="lg" className="px-4">
                  <i className="fas fa-book me-2"></i>
                  Manage Courses ({allCourses.length})
                </Button>
                <Button as={Link} to="/admin/students" variant="warning" size="lg" className="px-4">
                  <i className="fas fa-user-graduate me-2"></i>
                  Manage Students ({allStudents.length})
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Students Preview */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="card-title mb-1">Recent Students</h5>
                  <p className="text-muted mb-0">Latest 5 registered students</p>
                </div>
                <Badge bg="light" text="dark" className="fs-6">
                  {recentUsers.length} of {allStudents.length}
                </Badge>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Student ID</th>
                      <th>Status</th>
                      <th>Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading.students ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="text-muted mt-2">Loading students...</p>
                        </td>
                      </tr>
                    ) : recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          <i className="fas fa-users fa-3x mb-3 opacity-25"></i>
                          <h6>No students registered yet</h6>
                        </td>
                      </tr>
                    ) : (
                      recentUsers.map((user, index) => (
                        <tr key={user.id || user.email || index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                   style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                                {getInitials(user.name)}
                              </div>
                              <div>
                                <div className="fw-medium">{user.name || 'Unknown'}</div>
                                {user.phone && <small className="text-muted">{user.phone}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={user.email}>
                              {user.email}
                            </div>
                          </td>
                          <td><code className="text-primary">{user.studentId || user.id || 'N/A'}</code></td>
                          <td><Badge bg={getStatusBadge(user.status)}>{user.status || 'Active'}</Badge></td>
                          <td><small className="text-muted">{formatDate(user.createdAt)}</small></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Full Data Lists with Tabs */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">Complete Database View</h5>
                  <Badge bg="secondary">
                    {activeTab === 'students' && `${allStudents.length} Students`}
                    {activeTab === 'teachers' && `${allTeachers.length} Teachers`}
                    {activeTab === 'courses' && `${allCourses.length} Courses`}
                  </Badge>
                </div>
                
                {/* Tab Navigation */}
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => { setActiveTab('students'); setCurrentPage(1); }}
                  >
                    <i className="fas fa-user-graduate me-2"></i>
                    Students ({allStudents.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => { setActiveTab('teachers'); setCurrentPage(1); }}
                  >
                    <i className="fas fa-chalkboard-teacher me-2"></i>
                    Teachers ({allTeachers.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => { setActiveTab('courses'); setCurrentPage(1); }}
                  >
                    <i className="fas fa-book me-2"></i>
                    Courses ({allCourses.length})
                  </button>
                </div>
              </div>

              {/* Students Table */}
              {activeTab === 'students' && (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Student ID</th>
                        <th>Status</th>
                        <th>Join Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataLoading.students ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-2">Loading all students...</p>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-5">
                            <i className="fas fa-users fa-3x mb-3 opacity-25"></i>
                            <h6>No students found</h6>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((user, index) => (
                          <tr key={user.id || user.email || index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                     style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <div className="fw-medium">{user.name || 'Unknown'}</div>
                                  {user.phone && <small className="text-muted">{user.phone}</small>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '200px' }} title={user.email}>
                                {user.email}
                              </div>
                            </td>
                            <td><code className="text-primary">{user.studentId || user.id || 'N/A'}</code></td>
                            <td><Badge bg={getStatusBadge(user.status)}>{user.status || 'Active'}</Badge></td>
                            <td><small className="text-muted">{formatDate(user.createdAt)}</small></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Teachers Table */}
              {activeTab === 'teachers' && (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Teacher</th>
                        <th>Email</th>
                        <th>Teacher ID</th>
                        <th>Department</th>
                        <th>Join Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataLoading.teachers ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <Spinner animation="border" variant="warning" />
                            <p className="text-muted mt-2">Loading all teachers...</p>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-5">
                            <i className="fas fa-chalkboard-teacher fa-3x mb-3 opacity-25"></i>
                            <h6>No teachers found</h6>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((teacher, index) => (
                          <tr key={teacher.id || teacher.email || index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3"
                                     style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                                  {getInitials(teacher.name)}
                                </div>
                                <div>
                                  <div className="fw-medium">{teacher.name || 'Unknown'}</div>
                                  {teacher.phone && <small className="text-muted">{teacher.phone}</small>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '200px' }} title={teacher.email}>
                                {teacher.email}
                              </div>
                            </td>
                            <td><code className="text-warning">{teacher.teacherId || teacher.id || 'N/A'}</code></td>
                            <td>
                              <Badge bg="light" text="dark">
                                {teacher.department || teacher.specialization || 'General'}
                              </Badge>
                            </td>
                            <td><small className="text-muted">{formatDate(teacher.createdAt)}</small></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Courses Table */}
              {activeTab === 'courses' && (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Course Name</th>
                        <th>Course Code</th>
                        <th>Teacher</th>
                        <th>Enrollments</th>
                        <th>Status</th>
                        <th>Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataLoading.courses ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <Spinner animation="border" variant="info" />
                            <p className="text-muted mt-2">Loading all courses...</p>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-5">
                            <i className="fas fa-book fa-3x mb-3 opacity-25"></i>
                            <h6>No courses found</h6>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((course, index) => (
                          <tr key={course.id || course.courseCode || index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                     style={{ width: '40px', height: '40px', fontSize: '12px', fontWeight: 'bold' }}>
                                  {course.courseCode ? course.courseCode.substring(0, 3).toUpperCase() : 'CRS'}
                                </div>
                                <div>
                                  <div className="fw-medium">{course.title || course.name || 'Untitled Course'}</div>
                                  {course.description && (
                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                                      {course.description}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td><code className="text-info">{course.courseCode || 'N/A'}</code></td>
                            <td>
                              <small className="text-muted">
                                {course.teacherName || course.teacher?.name || 'Not Assigned'}
                              </small>
                            </td>
                            <td>
                              <Badge bg="primary" pill>
                                {course.enrollmentCount || course.enrollments?.length || 0} students
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={course.isActive ? 'success' : 'secondary'}>
                                {course.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td><small className="text-muted">{formatDate(course.createdAt)}</small></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <small className="text-muted">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, 
                      activeTab === 'students' ? allStudents.length : 
                      activeTab === 'teachers' ? allTeachers.length : 
                      allCourses.length)} of {
                      activeTab === 'students' ? allStudents.length : 
                      activeTab === 'teachers' ? allTeachers.length : 
                      allCourses.length} entries
                  </small>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer Info */}
      <Row className="mt-4">
        <Col>
          <div className="text-center">
            <small className="text-muted">
              Dashboard auto-refreshes every 30 seconds • Last update: {formatDate(lastUpdate)}
            </small>
            <br />
            <small className="text-muted">
              Showing live data from database • Total Records: {allStudents.length + allTeachers.length + allCourses.length}
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;