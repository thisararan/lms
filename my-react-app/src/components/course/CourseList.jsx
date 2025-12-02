import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Alert, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CourseList = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    level: 'BEGINNER',
    duration: '',
    price: 0,
  });

  // Sample courses data
  const sampleCourses = [
    {
      id: 1,
      title: "Introduction to Programming",
      description: "Learn the fundamentals of programming with Python. Perfect for beginners.",
      instructor: "Dr. Sarah Johnson",
      category: "Programming",
      level: "BEGINNER",
      duration: "8 weeks",
      students: 150,
      rating: 4.5,
      price: 0,
      instructorId: 3,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    // ... (other sample courses remain the same, ensure status and createdAt are added)
  ];

  useEffect(() => {
    loadCourses();
    if (user?.role === 'STUDENT') {
      loadEnrolledCourses();
    }
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'courses') {
        console.log('CourseList: Detected storage change, reloading courses');
        loadCourses();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadCourses = () => {
    try {
      setLoading(true);
      const storedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      console.log('CourseList: Loaded courses from localStorage:', storedCourses.length);
      if (storedCourses.length > 0) {
        setCourses(storedCourses);
      } else {
        setCourses(sampleCourses);
        localStorage.setItem('courses', JSON.stringify(sampleCourses));
      }
    } catch (error) {
      console.error('CourseList: Error loading courses:', error);
      setCourses(sampleCourses);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = () => {
    try {
      const studentData = JSON.parse(localStorage.getItem(`student_${user.id}`) || '{}');
      setEnrolledCourses(studentData.enrolledCourses || []);
      console.log('CourseList: Loaded enrolled courses:', studentData.enrolledCourses?.length || 0);
    } catch (error) {
      console.error('CourseList: Error loading enrollments:', error);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((course) => course.category === selectedCategory);
    }
    setFilteredCourses(filtered);
  };

  const enrollInCourse = async (courseId) => {
    if (user?.role !== 'STUDENT') return;
    try {
      const studentData = JSON.parse(localStorage.getItem(`student_${user.id}`) || '{}');
      const courseToEnroll = courses.find((c) => c.id === courseId);
      if (courseToEnroll && !studentData.enrolledCourses?.some((c) => c.id === courseId)) {
        const enrolledCourses = studentData.enrolledCourses || [];
        enrolledCourses.push({
          ...courseToEnroll,
          enrolledAt: new Date().toISOString(),
          progress: 0,
        });
        studentData.enrolledCourses = enrolledCourses;
        localStorage.setItem(`student_${user.id}`, JSON.stringify(studentData));
        setEnrolledCourses(enrolledCourses);
        setSuccess(`Successfully enrolled in ${courseToEnroll.title}!`);
        setTimeout(() => setSuccess(''), 3000);
        console.log('CourseList: Enrolled in course:', courseToEnroll.title);
      }
    } catch (error) {
      console.error('CourseList: Error enrolling in course:', error);
      setError('Failed to enroll in course');
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some((course) => course.id === courseId);
  };

  const handleAddCourse = () => {
    try {
      const newCourseData = {
        ...newCourse,
        id: Date.now(),
        students: 0,
        rating: 0,
        instructorId: user?.id || 3,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const updatedCourses = [...courses, newCourseData];
      setCourses(updatedCourses);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      dispatchCourseUpdateEvent();
      setSuccess('Course added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      setNewCourse({
        title: '',
        description: '',
        instructor: '',
        category: '',
        level: 'BEGINNER',
        duration: '',
        price: 0,
      });
      console.log('CourseList: Added new course:', newCourseData.title);
    } catch (error) {
      console.error('CourseList: Error adding course:', error);
      setError('Failed to add course');
    }
  };

  const handleEditCourse = () => {
    try {
      const updatedCourses = courses.map((course) =>
        course.id === currentCourse.id ? { ...course, ...newCourse } : course
      );
      setCourses(updatedCourses);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      dispatchCourseUpdateEvent();
      setSuccess('Course updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      console.log('CourseList: Updated course:', newCourse.title);
    } catch (error) {
      console.error('CourseList: Error updating course:', error);
      setError('Failed to update course');
    }
  };

  const handleDeleteCourse = (courseId) => {
    try {
      const updatedCourses = courses.filter((course) => course.id !== courseId);
      setCourses(updatedCourses);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      dispatchCourseUpdateEvent();
      setSuccess('Course deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      console.log('CourseList: Deleted course ID:', courseId);
    } catch (error) {
      console.error('CourseList: Error deleting course:', error);
      setError('Failed to delete course');
    }
  };

  const dispatchCourseUpdateEvent = () => {
    console.log('CourseList: Dispatching coursesUpdated event');
    const event = new Event('coursesUpdated');
    window.dispatchEvent(event);
    // Force storage event by updating localStorage
    localStorage.setItem('courses', localStorage.getItem('courses'));
  };

  const openAddModal = () => {
    setCurrentCourse(null);
    setNewCourse({
      title: '',
      description: '',
      instructor: '',
      category: '',
      level: 'BEGINNER',
      duration: '',
      price: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setCurrentCourse(course);
    setNewCourse({ ...course });
    setShowModal(true);
  };

  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))];

  if (loading) {
    return (
      <Container className="my-5 pt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading courses...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 pt-4">
      <Row className="mb-4">
        <Col>
          <div className="text-center">
            <h2>Available Courses</h2>
            <p className="text-muted">Browse and enroll in courses to start learning</p>
            {user?.role === 'ADMIN' && (
              <Button variant="success" onClick={openAddModal}>
                Add New Course
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row className="mb-4 justify-content-center">
        <Col md={8} lg={6}>
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search courses by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="primary">
              <i className="bi bi-search"></i>
            </Button>
          </InputGroup>
        </Col>
        <Col md={4} lg={3}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row className="justify-content-center">
        {filteredCourses.map((course) => (
          <Col key={course.id} lg={4} md={6} className="mb-4">
            <Card className="course-card h-100">
              <Card.Header className="course-card-header text-center">
                <Badge
                  bg={
                    course.level === 'BEGINNER'
                      ? 'success'
                      : course.level === 'INTERMEDIATE'
                      ? 'warning'
                      : 'danger'
                  }
                  className="mb-2"
                >
                  {course.level}
                </Badge>
                <Card.Title className="h5 mb-0">{course.title}</Card.Title>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="mb-3">
                  <Card.Text className="text-muted small">
                    {course.description?.substring(0, 120)}...
                  </Card.Text>
                  <div className="course-meta">
                    <div className="d-flex justify-content-between text-sm text-muted mb-2">
                      <span>
                        <i className="bi bi-person me-1"></i>
                        {course.instructor || 'Instructor TBA'}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1"></i>
                        {course.duration || 'Self-paced'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-sm text-muted">
                      <span>
                        <i className="bi bi-people me-1"></i>
                        {course.students || 0} students
                      </span>
                      <span>
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        {course.rating || 'New'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="secondary" className="text-uppercase">
                      {course.category || 'General'}
                    </Badge>
                    {user?.role === 'STUDENT' ? (
                      isEnrolled(course.id) ? (
                        <div className="d-flex gap-2">
                          <Badge bg="success">Enrolled</Badge>
                          <Button
                            as={Link}
                            to={`/courses/${course.id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            Continue
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => enrollInCourse(course.id)}
                        >
                          Enroll Now
                        </Button>
                      )
                    ) : user?.role === 'ADMIN' ? (
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => openEditModal(course)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <Button
                        as={Link}
                        to={`/courses/${course.id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {filteredCourses.length === 0 && (
          <Col lg={8}>
            <Card className="text-center py-5">
              <Card.Body>
                <div className="text-muted mb-3">
                  <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="text-muted">No courses found</h5>
                <p className="text-muted">
                  {courses.length === 0
                    ? 'No courses available yet. Please check back later.'
                    : 'Try adjusting your search criteria or browse all categories.'}
                </p>
                {(searchTerm || selectedCategory) && (
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {user?.role === 'STUDENT' && enrolledCourses.length > 0 && (
        <Row className="mt-5">
          <Col>
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h5>Your Learning Progress</h5>
                <p className="mb-0">
                  You are enrolled in <strong>{enrolledCourses.length}</strong> course(s).
                  Continue your learning journey!
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{currentCourse ? 'Edit Course' : 'Add New Course'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Instructor</Form.Label>
              <Form.Control
                type="text"
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Level</Form.Label>
              <Form.Select
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                type="text"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={newCourse.price}
                onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={currentCourse ? handleEditCourse : handleAddCourse}
          >
            {currentCourse ? 'Update Course' : 'Add Course'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CourseList;