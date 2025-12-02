// src/components/management/AssignmentManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Table, Badge,
  Alert, Modal, ProgressBar, Spinner
} from 'react-bootstrap';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { triggerDashboardRefresh } from '../../services/dashboardService';

const AssignmentManagement = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState({}); // { assignmentId: [submissions] }
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Modals
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  
  // Form & Upload
  const [formData, setFormData] = useState({
    id: '', title: '', description: '', courseId: '', dueDate: '', maxPoints: 100,
    file: null, fileName: '', attachmentUrl: '', attachmentSize: null, attachmentType: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Feedback
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
    else setLoading(false);
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadCourses(),
        loadAssignments()
      ]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await apiService.get('/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await apiService.get('/assignments');
      let filtered = res.data || [];

      if (user.role === 'TEACHER') {
        filtered = filtered.filter(a => a.teacher_id === user.id || a.created_by === user.id);
      }

      setAssignments(filtered.map(a => ({
        ...a,
        courseTitle: courses.find(c => c.id === a.course_id)?.title || 'Unknown Course'
      })));
    } catch (err) {
      setError('Failed to load assignments');
    }
  };

  // FIXED: Load submissions only when teacher opens the modal
  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);

    try {
      const res = await apiService.get(`/submissions/assignment/${assignment.id}`);
      setSubmissions(prev => ({
        ...prev,
        [assignment.id]: res.data || []
      }));
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissions(prev => ({ ...prev, [assignment.id]: [] }));
      setError('No submissions found');
    }
  };

  const getAssignmentSubmissions = (assignmentId) => {
    return submissions[assignmentId] || [];
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB)');

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiService.fileUpload.upload(file, (progress) => setUploadProgress(progress));
      setIsUploading(false);
      return res.data.fileId || res.data.filename;
    } catch (err) {
      setIsUploading(false);
      throw err;
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.courseId || !formData.dueDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      let fileId = null;
      if (formData.file) {
        fileId = await handleFileUpload(formData.file);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        courseId: parseInt(formData.courseId),
        dueDate: formData.dueDate,
        maxPoints: parseInt(formData.maxPoints),
        ...(fileId && {
          attachmentUrl: `/uploads/${fileId}`,
          attachmentName: formData.file.name,
          attachmentSize: formData.file.size,
          attachmentType: formData.file.type
        })
      };

      if (formData.id) {
        await apiService.put(`/assignments/${formData.id}`, payload);
        setSuccess('Assignment updated successfully!');
      } else {
        await apiService.post('/assignments', payload);
        setSuccess('Assignment created successfully!');
        triggerDashboardRefresh();
      }

      loadAssignments();
      closeModals();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment permanently?')) return;
    try {
      await apiService.delete(`/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setSuccess('Assignment deleted');
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const gradeSubmission = async (submissionId, grade) => {
    if (!grade || grade < 0) {
      setError('Enter valid grade');
      return;
    }
    try {
      await apiService.put(`/submissions/${submissionId}/grade`, { grade: parseInt(grade) });
      setSubmissions(prev => ({
        ...prev,
        [selectedAssignment.id]: prev[selectedAssignment.id].map(s =>
          s.id === submissionId ? { ...s, graded: true, grade: parseInt(grade) } : s
        )
      }));
      setSuccess('Grade saved!');
    } catch (err) {
      setError('Failed to save grade');
    }
  };

  const closeModals = () => {
    setShowAssignmentModal(false);
    setShowEditAssignmentModal(false);
    setShowSubmissionsModal(false);
    setFormData({
      id: '', title: '', description: '', courseId: '', dueDate: '', maxPoints: 100,
      file: null, fileName: '', attachmentUrl: '', attachmentSize: null, attachmentType: ''
    });
    setError('');
    setSuccess('');
  };

  const openEditModal = (assignment) => {
    setFormData({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      courseId: assignment.course_id || assignment.courseId,
      dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
      maxPoints: assignment.max_points || 100,
      file: null,
      fileName: assignment.attachment_name || '',
      attachmentUrl: assignment.attachment_url || '',
      attachmentSize: assignment.attachment_size,
      attachmentType: assignment.attachment_type
    });
    setShowEditAssignmentModal(true);
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString() : 'N/A';

  if (loading) return (
    <Container className="text-center py-5">
      <Spinner animation="border" /> <span className="ms-3">Loading...</span>
    </Container>
  );

  return (
    <Container className="my-5 pt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Assignment Management</h2>
          <p className="text-muted">
            {user.role === 'TEACHER' ? 'Manage assignments for your courses' : 'View your assignments'}
          </p>
        </Col>
        {user.role === 'TEACHER' && (
          <Col xs="auto">
            <Button variant="primary" onClick={() => setShowAssignmentModal(true)}>
              Create Assignment
            </Button>
          </Col>
        )}
      </Row>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body>
          {assignments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No assignments found</h5>
              {user.role === 'TEACHER' && (
                <Button variant="primary" onClick={() => setShowAssignmentModal(true)}>
                  Create Your First Assignment
                </Button>
              )}
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Points</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => {
                  const subs = getAssignmentSubmissions(assignment.id);
                  const graded = subs.filter(s => s.graded).length;
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <strong>{assignment.title}</strong>
                        {assignment.description && <br />}
                        <small className="text-muted">{assignment.description.substring(0, 60)}...</small>
                      </td>
                      <td>{assignment.courseTitle}</td>
                      <td>{formatDate(assignment.due_date || assignment.dueDate)}</td>
                      <td>{assignment.max_points || assignment.maxPoints}</td>
                      <td>
                        <Badge bg="info">{subs.length} submitted</Badge>{' '}
                        {graded > 0 && <Badge bg="success">{graded} graded</Badge>}
                      </td>
                      <td>
                        {user.role === 'TEACHER' && (
                          <>
                            <Button size="sm" variant="outline-primary" onClick={() => viewSubmissions(assignment)}>
                              View
                            </Button>{' '}
                            <Button size="sm" variant="outline-secondary" onClick={() => openEditModal(assignment)}>
                              Edit
                            </Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={() => deleteAssignment(assignment.id)}>
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create / Edit Modal */}
      <Modal show={showAssignmentModal || showEditAssignmentModal} onHide={closeModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{showEditAssignmentModal ? 'Edit' : 'Create'} Assignment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitAssignment}>
          <Modal.Body>
            {/* Form fields same as before */}
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course *</Form.Label>
                  <Form.Select
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses
                      .filter(c => c.instructor_id === user.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>File (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setFormData({ ...formData, file, fileName: file.name });
                }}
              />
              {formData.fileName && <small>Selected: {formData.fileName}</small>}
            </Form.Group>
            {isUploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isUploading}>
              {showEditAssignmentModal ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Submissions Modal */}
      <Modal show={showSubmissionsModal} onHide={closeModals} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Submissions: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <>
              <p><strong>Due:</strong> {formatDate(selectedAssignment.due_date)}</p>
              <h6>Student Submissions ({getAssignmentSubmissions(selectedAssignment.id).length})</h6>
              {getAssignmentSubmissions(selectedAssignment.id).length === 0 ? (
                <p className="text-muted">No submissions yet.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted</th>
                      <th>File</th>
                      <th>Grade</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAssignmentSubmissions(selectedAssignment.id).map(sub => (
                      <tr key={sub.id}>
                        <td>{sub.student_name || sub.studentName}</td>
                        <td>{formatDate(sub.submitted_at || sub.submittedAt)}</td>
                        <td>
                          {sub.attachment_url && (
                            <a href={`/api/files/download${sub.attachment_url}`} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          )}
                        </td>
                        <td>
                          {sub.graded ? (
                            <Badge bg="success">{sub.grade}/{selectedAssignment.max_points}</Badge>
                          ) : (
                            <Form.Control
                              type="number"
                              size="sm"
                              style={{ width: '80px', display: 'inline-block' }}
                              placeholder="Grade"
                              onChange={e => {
                                if (e.target.value) gradeSubmission(sub.id, e.target.value);
                              }}
                            />
                          )}
                        </td>
                        <td>
                          {!sub.graded && (
                            <Button size="sm" onClick={() => {
                              const input = document.querySelector(`input[placeholder="Grade"]`);
                              if (input?.value) gradeSubmission(sub.id, input.value);
                            }}>
                              Save
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AssignmentManagement;