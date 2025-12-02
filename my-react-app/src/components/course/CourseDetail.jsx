// src/components/course/CourseDetail.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Tabs, Tab, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentDetailsModal, setShowAssignmentDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view course details');
      setLoading(false);
      return;
    }
    loadCourse();
    checkEnrollment();
    loadAssignments();
  }, [id, user]);

  const loadCourse = async () => {
    try {
      const response = await apiService.get(`/courses/${id}`);
      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course details');
    }
  };

  const checkEnrollment = async () => {
    if (user?.role === 'STUDENT') {
      try {
        const response = await apiService.get('/enrollments/my');
        const enrolledCourses = response.data || [];
        setIsEnrolled(enrolledCourses.some(c => c.courseId === parseInt(id)));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to check enrollment status');
      }
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await apiService.get(`/assignments/course/${id}`);
      setAssignments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Please select a file smaller than 10MB.');
        return;
      }
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-zip-compressed'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('File type not allowed. Please select PDF, Word, Text, Image, or ZIP files.');
        return;
      }
      setSubmissionFile(file);
      setFileName(file.name);
      setFileSize(file.size);
      setError('');
    }
  };

  const removeFile = () => {
    setSubmissionFile(null);
    setFileName('');
    setFileSize(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = (attachmentUrl, fileName) => {
    if (attachmentUrl) {
      const fileId = attachmentUrl.split('/').pop();
      window.location.href = `${apiService.defaults.baseURL}/files/download/assignments/${fileId}`;
    } else {
      setError('No file available for download');
    }
  };

  const handleViewAssignmentDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentDetailsModal(true);
  };

  const submitAssignment = async () => {
    if (!selectedAssignment || (!submissionText.trim() && !submissionFile)) {
      setError('Please provide either text submission or a file attachment.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', submissionText);
      if (submissionFile) formData.append('file', submissionFile);
      const existingSubmission = getSubmission(selectedAssignment.id);
      if (existingSubmission) {
        await apiService.put(`/submissions/${existingSubmission.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Submission updated successfully!');
      } else {
        await apiService.post(`/submissions/${selectedAssignment.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Assignment submitted successfully!');
      }
      setShowSubmitModal(false);
      setShowEditModal(false);
      setSubmissionText('');
      setSubmissionFile(null);
      setFileName('');
      setFileSize(0);
      setSelectedAssignment(null);
      setError('');
      await loadAssignments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setSubmissionFile(null);
    setFileName('');
    setFileSize(0);
    setError('');
    setShowSubmitModal(true);
  };

  const handleEditSubmission = (assignment) => {
    setSelectedAssignment(assignment);
    const submission = getSubmission(assignment.id);
    setSubmissionText(submission?.content || '');
    setSubmissionFile(null);
    setFileName(submission?.attachmentName || '');
    setFileSize(submission?.attachmentSize || 0);
    setError('');
    setShowEditModal(true);
  };

  const hasSubmitted = (assignmentId) => {
    const assignment = assignments.find(ass => ass.id === assignmentId);
    return assignment?.submissions?.some(sub => sub.studentId === user?.id) || false;
  };

  const getSubmission = (assignmentId) => {
    const assignment = assignments.find(ass => ass.id === assignmentId);
    return assignment?.submissions?.find(sub => sub.studentId === user?.id) || null;
  };

  const canEditSubmission = (assignment) => {
    if (!hasSubmitted(assignment.id)) return false;
    return new Date(assignment.dueDate) > new Date();
  };

  const getStatusBadge = (assignment) => {
    if (hasSubmitted(assignment.id)) {
      const submission = getSubmission(assignment.id);
      if (submission?.graded) {
        return <Badge bg="success">Graded: {submission.grade}/{assignment.maxPoints}</Badge>;
      } else if (new Date(assignment.dueDate) < new Date()) {
        return <Badge bg="secondary">Submitted - Closed</Badge>;
      } else {
        return <Badge bg="primary">Submitted - Can Edit</Badge>;
      }
    } else if (new Date(assignment.dueDate) < new Date()) {
      return <Badge bg="danger">Overdue</Badge>;
    } else {
      return <Badge bg="warning">Not Submitted</Badge>;
    }
  };

  const getActionButton = (assignment) => {
    if (user?.role === 'STUDENT') {
      if (hasSubmitted(assignment.id)) {
        if (canEditSubmission(assignment)) {
          return (
            <div className="d-flex gap-1">
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleViewAssignmentDetails(assignment)}
              >
                View Assignment
              </Button>
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => handleEditSubmission(assignment)}
              >
                Edit Submission
              </Button>
            </div>
          );
        } else {
          return (
            <div className="d-flex gap-1">
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleViewAssignmentDetails(assignment)}
              >
                View Assignment
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleViewAssignment(assignment)}
              >
                View Submission
              </Button>
            </div>
          );
        }
      } else {
        return (
          <div className="d-flex gap-1">
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => handleViewAssignmentDetails(assignment)}
            >
              View Assignment
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmitAssignment(assignment)}
              disabled={new Date(assignment.dueDate) < new Date()}
            >
              {new Date(assignment.dueDate) < new Date() ? 'Overdue' : 'Submit'}
            </Button>
          </div>
        );
      }
    } else {
      return (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => handleViewAssignment(assignment)}
        >
          View Details
        </Button>
      );
    }
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowViewModal(true);
  };

  // Date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (!user) {
    return (
      <Container className="my-5 pt-4">
        <Alert variant="danger">Please log in to view this page</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="my-5 pt-4">
        <div className="text-center">
          <ProgressBar animated now={100} />
          <p>Loading course details...</p>
        </div>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="my-5 pt-4">
        <div className="text-center">
          <h3>Course not found</h3>
          <p>The course you're looking for doesn't exist.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 pt-4">
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Badge
                    bg={
                      course.level === 'Beginner' ? 'success' :
                      course.level === 'Intermediate' ? 'warning' : 'danger'
                    }
                    className="mb-2"
                  >
                    {course.level}
                  </Badge>
                  <h2>{course.title}</h2>
                  <p className="text-muted">{course.description}</p>
                </div>
              </div>

              <Tabs defaultActiveKey="overview" className="mb-3">
                <Tab eventKey="overview" title="Overview">
                  <h5>Course Description</h5>
                  <p>{course.description}</p>
                  <h5>What You'll Learn</h5>
                  <ul>
                    <li>Comprehensive understanding of {course.title}</li>
                    <li>Practical skills and real-world applications</li>
                    <li>Best practices and industry standards</li>
                    <li>Hands-on projects and exercises</li>
                  </ul>
                </Tab>

                <Tab eventKey="assignments" title={`Assignments (${assignments.length})`}>
                  <h5>Course Assignments</h5>
                  {isEnrolled || user?.role === 'TEACHER' ? (
                    assignments.length > 0 ? (
                      <div className="list-group">
                        {assignments.map(assignment => (
                          <div key={assignment.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{assignment.title}</h6>
                                  {getStatusBadge(assignment)}
                                </div>
                                <p className="text-muted small mb-2">{assignment.description}</p>
                                <div className="d-flex gap-3 text-muted small">
                                  <span>
                                    <i className="bi bi-calendar me-1"></i>
                                    Due: {formatDate(assignment.dueDate)}
                                  </span>
                                  <span>
                                    <i className="bi bi-star me-1"></i>
                                    Points: {assignment.maxPoints}
                                  </span>
                                  <span>
                                    <i className="bi bi-people me-1"></i>
                                    Submissions: {assignment.submissions?.length || 0}
                                  </span>
                                  {assignment.attachmentUrl && (
                                    <span>
                                      <i className="bi bi-paperclip me-1"></i>
                                      Has Attachment
                                    </span>
                                  )}
                                  <span>
                                    <i className="bi bi-person me-1"></i>
                                    Created by: {assignment.createdBy?.name || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="ms-3">
                                {getActionButton(assignment)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <p>No assignments available for this course yet.</p>
                        {user?.role === 'TEACHER' && (
                          <Button as={Link} to="/teacher" variant="primary">
                            Create Assignment
                          </Button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center text-muted py-4">
                      <p>Enroll in the course to view and submit assignments.</p>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showAssignmentDetailsModal} onHide={() => setShowAssignmentDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assignment: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}
                </Col>
                <Col md={6}>
                  <strong>Maximum Points:</strong> {selectedAssignment.maxPoints}
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Assignment Description:</strong>
                <div className="border rounded p-3 bg-light mt-2">
                  {selectedAssignment.description}
                </div>
              </div>
              {selectedAssignment.attachmentUrl && (
                <div className="mb-3">
                  <strong>Assignment Files:</strong>
                  <div className="border rounded p-3 bg-white mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Badge bg="info" className="me-2">
                          📎 {selectedAssignment.attachmentName || 'File'}
                        </Badge>
                        <small className="text-muted">
                          ({formatFileSize(selectedAssignment.attachmentSize || 0)})
                        </small>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => downloadFile(selectedAssignment.attachmentUrl, selectedAssignment.attachmentName)}
                      >
                        <i className="bi bi-download me-1"></i>
                        Download File
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {user?.role === 'STUDENT' && (
                <div className="mt-4">
                  <hr />
                  <h6>Your Submission Status</h6>
                  {hasSubmitted(selectedAssignment.id) ? (
                    <Alert variant="success">
                      <i className="bi bi-check-circle me-2"></i>
                      You have submitted this assignment.
                      {getSubmission(selectedAssignment.id)?.graded && (
                        <span className="ms-2">
                          Grade: {getSubmission(selectedAssignment.id)?.grade}/{selectedAssignment.maxPoints}
                        </span>
                      )}
                    </Alert>
                  ) : (
                    <Alert variant={new Date(selectedAssignment.dueDate) < new Date() ? 'danger' : 'warning'}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {new Date(selectedAssignment.dueDate) < new Date()
                        ? 'This assignment is overdue.'
                        : 'You have not submitted this assignment yet.'}
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignmentDetailsModal(false)}>
            Close
          </Button>
          {user?.role === 'STUDENT' && !hasSubmitted(selectedAssignment?.id) && new Date(selectedAssignment?.dueDate) > new Date() && (
            <Button
              variant="primary"
              onClick={() => {
                setShowAssignmentDetailsModal(false);
                handleSubmitAssignment(selectedAssignment);
              }}
            >
              Submit Assignment
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <div className="mb-3">
              <h6>Assignment Details</h6>
              <p><strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}</p>
              <p><strong>Points:</strong> {selectedAssignment.maxPoints}</p>
              <p><strong>Description:</strong></p>
              <div className="border rounded p-3 bg-light">
                {selectedAssignment.description}
              </div>
              {selectedAssignment.attachmentUrl && (
                <div className="mt-3">
                  <strong>Assignment Files:</strong>
                  <div className="border rounded p-2 bg-white mt-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        <Badge bg="info" className="me-2">
                          📎 {selectedAssignment.attachmentName || 'File'}
                        </Badge>
                        <small className="text-muted">
                          ({formatFileSize(selectedAssignment.attachmentSize || 0)})
                        </small>
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadFile(selectedAssignment.attachmentUrl, selectedAssignment.attachmentName)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <hr />
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Your Submission (Text) - Optional</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Enter your assignment submission here (optional)..."
            />
            <Form.Text className="text-muted">
              You can provide text submission, file attachment, or both.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>File Attachment (Optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
            />
            <Form.Text className="text-muted">
              Supported formats: PDF, Word (.doc, .docx), Text (.txt), Images (.jpg, .png, .gif), ZIP (.zip) - Max 10MB
            </Form.Text>
            {fileName && (
              <div className="mt-2">
                <Badge bg="success" className="me-2">
                  📎 {fileName} ({formatFileSize(fileSize)})
                </Badge>
                <Button variant="outline-danger" size="sm" onClick={removeFile}>
                  Remove File
                </Button>
              </div>
            )}
          </Form.Group>
          <Alert variant="info">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Either text or file attachment is required.
              <br />
              You can edit your submission until the deadline: {selectedAssignment && formatDate(selectedAssignment.dueDate)}
            </small>
          </Alert>
          {submitting && <ProgressBar animated now={100} label="Submitting..." />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitAssignment}
            disabled={(!submissionText.trim() && !submissionFile) || submitting}
          >
            Submit Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Submission: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <div className="mb-3">
              <h6>Assignment Details</h6>
              <p><strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}</p>
              <p><strong>Points:</strong> {selectedAssignment.maxPoints}</p>
              <p><strong>Description:</strong></p>
              <div className="border rounded p-3 bg-light">
                {selectedAssignment.description}
              </div>
              {selectedAssignment.attachmentUrl && (
                <div className="mt-3">
                  <strong>Assignment Files:</strong>
                  <div className="border rounded p-2 bg-white mt-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        <Badge bg="info" className="me-2">
                          📎 {selectedAssignment.attachmentName || 'File'}
                        </Badge>
                        <small className="text-muted">
                          ({formatFileSize(selectedAssignment.attachmentSize || 0)})
                        </small>
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadFile(selectedAssignment.attachmentUrl, selectedAssignment.attachmentName)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <hr />
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Your Submission (Text) - Optional</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Enter your assignment submission here (optional)..."
            />
            <Form.Text className="text-muted">
              You can provide text submission, file attachment, or both.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>File Attachment (Optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
            />
            <Form.Text className="text-muted">
              Supported formats: PDF, Word (.doc, .docx), Text (.txt), Images (.jpg, .png, .gif), ZIP (.zip) - Max 10MB
            </Form.Text>
            {fileName && (
              <div className="mt-2">
                <Badge bg="success" className="me-2">
                  📎 {fileName} ({formatFileSize(fileSize)})
                </Badge>
                <Button variant="outline-danger" size="sm" onClick={removeFile}>
                  Remove File
                </Button>
              </div>
            )}
          </Form.Group>
          <Alert variant="info">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Either text or file attachment is required.
              <br />
              You can edit your submission until the deadline: {selectedAssignment && formatDate(selectedAssignment.dueDate)}
            </small>
          </Alert>
          {submitting && <ProgressBar animated now={100} label="Submitting..." />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitAssignment}
            disabled={(!submissionText.trim() && !submissionFile) || submitting}
          >
            Update Submission
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submission: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <div>
              <h6>Assignment Details</h6>
              <p><strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}</p>
              <p><strong>Points:</strong> {selectedAssignment.maxPoints}</p>
              <p><strong>Description:</strong></p>
              <div className="border rounded p-3 bg-light">
                {selectedAssignment.description}
              </div>
              {selectedAssignment.attachmentUrl && (
                <div className="mt-3">
                  <strong>Assignment Files:</strong>
                  <div className="border rounded p-2 bg-white mt-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        <Badge bg="info" className="me-2">
                          📎 {selectedAssignment.attachmentName || 'File'}
                        </Badge>
                        <small className="text-muted">
                          ({formatFileSize(selectedAssignment.attachmentSize || 0)})
                        </small>
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => downloadFile(selectedAssignment.attachmentUrl, selectedAssignment.attachmentName)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <hr />
              <h6>Your Submission</h6>
              {hasSubmitted(selectedAssignment.id) ? (
                <div>
                  {getSubmission(selectedAssignment.id)?.content && (
                    <div className="mb-3">
                      <strong>Text Submission:</strong>
                      <div className="border rounded p-3 bg-light mt-2">
                        {getSubmission(selectedAssignment.id).content}
                      </div>
                    </div>
                  )}
                  {getSubmission(selectedAssignment.id)?.attachmentUrl && (
                    <div className="mb-3">
                      <strong>Submitted File:</strong>
                      <div className="border rounded p-2 bg-white mt-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>
                            <Badge bg="info" className="me-2">
                              📎 {getSubmission(selectedAssignment.id).attachmentName || 'File'}
                            </Badge>
                            <small className="text-muted">
                              ({formatFileSize(getSubmission(selectedAssignment.id).attachmentSize || 0)})
                            </small>
                          </span>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => downloadFile(
                              getSubmission(selectedAssignment.id).attachmentUrl,
                              getSubmission(selectedAssignment.id).attachmentName
                            )}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {getSubmission(selectedAssignment.id)?.graded && (
                    <Alert variant="success">
                      <strong>Grade:</strong> {getSubmission(selectedAssignment.id).grade}/{selectedAssignment.maxPoints}
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert variant="warning">
                  No submission found for this assignment.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CourseDetail;