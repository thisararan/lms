// src/components/management/AssignmentManagement.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Alert, Modal } from 'react-bootstrap';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { triggerDashboardRefresh } from '../../services/dashboardService';

const AssignmentManagement = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]); // For selected assignment
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '', title: '', description: '', courseId: '', dueDate: '', maxPoints: 100, file: null, fileName: ''
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        apiService.courses.getAllCourses(),
        apiService.assignments.getAllAssignments()
      ]);

      setCourses(coursesRes.data?.data || coursesRes.data || []);
      let allAssignments = assignmentsRes.data?.data || assignmentsRes.data || [];

      if (user.role === 'TEACHER') {
        allAssignments = allAssignments.filter(a => a.createdBy?.id === user.id);
      } else if (user.role === 'STUDENT') {
        const enrollRes = await apiService.get('/enrollments/my-course-ids');
        const enrolledIds = enrollRes.data?.data || [];
        allAssignments = allAssignments.filter(a => enrolledIds.includes(a.courseId));
      }

      setAssignments(allAssignments);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    setLoadingSubmissions(true);
    setSubmissions([]);

    try {
      const res = await apiService.get(`/submissions/assignment/${assignment.id}`);
      const data = res.data?.data || res.data || [];
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const gradeSubmission = async (submissionId, grade) => {
    if (!grade || grade < 0) return setError('Invalid grade');
    try {
      await apiService.put(`/submissions/${submissionId}/grade`, null, {
        params: { grade: parseInt(grade), feedback: 'Graded via LMS' }
      });
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, graded: true, grade: parseInt(grade) } : s
      ));
      setSuccess('Grade saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save grade');
    }
  };

  const downloadFile = (url, name) => {
    if (!url) return;
    const fileName = url.split('/').pop();
    window.open(`/api/files/download/submissions/${fileName}`, '_blank');
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }) : 'N/A';
  };

  if (loading) return <div className="text-center py-5"><i className="bi bi-hourglass-split" style={{fontSize: '3rem'}}></i></div>;

  return (
    <Container className="my-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Assignment Management</h2>
              <p className="text-muted">
                {user?.role === 'TEACHER' ? 'Manage your assignments' : 'View your assignments'}
              </p>
            </div>
            {user?.role === 'TEACHER' && (
              <Button variant="primary" onClick={() => setShowAssignmentModal(true)}>
                Create Assignment
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          {assignments.length === 0 ? (
            <p className="text-center text-muted py-5">No assignments found.</p>
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
                  const subs = submissions.filter(s => s.assignmentId === assignment.id);
                  return (
                    <tr key={assignment.id}>
                      <td><strong>{assignment.title}</strong></td>
                      <td>{assignment.course?.title || 'Unknown'}</td>
                      <td>{formatDate(assignment.dueDate)}</td>
                      <td>{assignment.maxPoints}</td>
                      <td>
                        <Badge bg="info">{subs.length} submitted</Badge>
                      </td>
                      <td>
                        {user.role === 'TEACHER' && (
                          <Button size="sm" onClick={() => viewSubmissions(assignment)}>
                            View Submissions
                          </Button>
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

      {/* Submissions Modal */}
      <Modal show={showSubmissionsModal} onHide={() => setShowSubmissionsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Submissions: {selectedAssignment?.title}
            <Badge bg="primary" className="ms-3">{submissions.length}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingSubmissions ? (
            <p>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <Alert variant="info">No submissions yet.</Alert>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submitted</th>
                  <th>File</th>
                  <th>Content</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td>{sub.studentName}<br/><small>{sub.studentEmail}</small></td>
                    <td>{formatDate(sub.submittedAt)}</td>
                    <td>
                      {sub.attachmentName ? (
                        <Button size="sm" variant="link" onClick={() => downloadFile(sub.attachmentUrl, sub.attachmentName)}>
                          {sub.attachmentName}
                        </Button>
                      ) : 'Text only'}
                    </td>
                    <td><small>{sub.content?.substring(0, 80)}...</small></td>
                    <td>
                      {sub.graded ? (
                        <Badge bg="success">{sub.grade}/{selectedAssignment?.maxPoints}</Badge>
                      ) : (
                        <Form.Control
                          type="number"
                          size="sm"
                          style={{width: '80px'}}
                          placeholder="0"
                          onBlur={(e) => e.target.value && gradeSubmission(sub.id, e.target.value)}
                        />
                      )}
                    </td>
                    <td>
                      {sub.graded ? 'Graded' : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AssignmentManagement;