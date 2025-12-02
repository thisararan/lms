// src/components/admin/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Modal, Form, Badge,
  InputGroup, FormControl, Spinner, Alert, Pagination, Tooltip, OverlayTrigger
} from 'react-bootstrap';
import { apiService } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    phone: '',
    status: 'ACTIVE'
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await apiService.users.getAllStudents();
      console.log('📊 Students data:', res.data); // Debug log
      
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStudents(data);
      setFiltered(data);
    } catch (err) {
      setError('Failed to load students');
      console.error('❌ Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    const filteredList = students.filter(s =>
      s.name?.toLowerCase().includes(lower) ||
      s.email?.toLowerCase().includes(lower) ||
      s.studentId?.toLowerCase().includes(lower)
    );
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [search, students]);

  const handleSave = async () => {
    try {
      if (editingStudent) {
        await apiService.users.updateStudent(editingStudent.id, formData);
      } else {
        await apiService.users.createStudent(formData);
      }
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', studentId: '', phone: '', status: 'ACTIVE' });
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      console.error('❌ Save error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student permanently?')) {
      try {
        await apiService.users.deleteStudent(id);
        loadStudents();
      } catch (err) {
        setError('Delete failed');
      }
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name || '',
        email: student.email || '',
        password: '', // Don't show existing password for security
        studentId: student.studentId || '',
        phone: student.phone || '',
        status: student.status || 'ACTIVE'
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '', email: '', password: '', studentId: '', phone: '', status: 'ACTIVE'
      });
    }
    setShowModal(true);
  };

  const togglePassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ✅ Get the display password - now it's always the original password
  const getDisplayPassword = (student) => {
    return student.password || 'Not set';
  };

  // Check if password is visible (not masked)
  const isPasswordVisible = (studentId) => {
    return showPassword[studentId] || false;
  };

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentStudents = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <Container className="my-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary fw-bold">
                <i className="fas fa-user-graduate me-3"></i>
                Student Management
              </h2>
              <p className="text-muted">Manage all students • Total: <strong>{filtered.length}</strong></p>
              <small className="text-success">
                <i className="fas fa-info-circle me-1"></i>
                Passwords shown are the original passwords given to students
              </small>
            </div>
            <Button variant="success" onClick={() => openModal()}>
              <i className="fas fa-user-plus me-2"></i> Add New Student
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                <FormControl
                  placeholder="Search by name, email, or student ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Student ID</th>
                      <th>Phone</th>
                      <th>Password</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((s, i) => (
                      <tr key={s.id}>
                        <td>{indexOfFirst + i + 1}</td>
                        <td>
                          <strong>{s.name || 'No Name'}</strong>
                        </td>
                        <td>{s.email}</td>
                        <td><code>{s.studentId || '—'}</code></td>
                        <td>{s.phone || '—'}</td>
                        <td>
                          <InputGroup size="sm" style={{ maxWidth: '200px' }}>
                            <FormControl
                              type={isPasswordVisible(s.id) ? 'text' : 'password'}
                              value={getDisplayPassword(s)}
                              readOnly
                              className="bg-white"
                              title="Original student password"
                            />
                            <Button
                              variant={isPasswordVisible(s.id) ? 'warning' : 'outline-secondary'}
                              size="sm"
                              onClick={() => togglePassword(s.id)}
                            >
                              <i className={`fas fa-eye${isPasswordVisible(s.id) ? '-slash' : ''}`}></i>
                            </Button>
                          </InputGroup>
                          <small className="text-muted d-block mt-1">
                            <i className="fas fa-key me-1"></i>Student Password
                          </small>
                        </td>
                        <td>
                          <Badge bg={s.status === 'ACTIVE' ? 'success' : 'secondary'}>
                            {s.status || 'ACTIVE'}
                          </Badge>
                        </td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td>
                          <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
                            <Button size="sm" variant="outline-primary" className="me-2"
                              onClick={() => openModal(s)}>
                              <i className="fas fa-edit"></i>
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                            <Button size="sm" variant="outline-danger"
                              onClick={() => handleDelete(s.id)}>
                              <i className="fas fa-trash"></i>
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="justify-content-center mt-4">
                  <Pagination.Prev
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item
                      key={i+1}
                      active={i+1 === currentPage}
                      onClick={() => setCurrentPage(i+1)}
                    >
                      {i+1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingStudent ? 'Edit Student' : 'Add New Student'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{editingStudent ? 'New Password (optional)' : 'Password *'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={editingStudent ? 'Leave blank to keep current' : 'Enter student password'}
                    required={!editingStudent}
                  />
                  <Form.Text className="text-muted">
                    {editingStudent 
                      ? 'Leave blank to keep current password' 
                      : 'This password will be visible to admin and given to student'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student ID</Form.Label>
                  <Form.Control
                    value={formData.studentId}
                    onChange={e => setFormData({...formData, studentId: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {editingStudent ? 'Update' : 'Create'} Student
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentManagement;