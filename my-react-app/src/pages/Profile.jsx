import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';


const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    subject: '',
    phone: '',
    qualification: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        subject: user.subject || '',
        phone: user.phone || '',
        qualification: user.qualification || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate profile update
    setTimeout(() => {
      setSuccess('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setLoading(false);
    }, 1000);
  };

  if (!user) {
    return (
      <Container className="my-5 pt-4">
        <div className="text-center">
          <h3>Please log in to view your profile</h3>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 pt-4">
      <Row className="mb-4">
        <Col>
          <h2>My Profile</h2>
          <p className="text-muted">Manage your account information</p>
        </Col>
      </Row>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Body className="text-center">
              <div className="mb-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" 
                     style={{width: '80px', height: '80px', fontSize: '32px'}}>
                  {user.name?.charAt(0) || 'U'}
                </div>
                <h5>{user.name || 'User'}</h5>
                <Badge bg={
                  user.role === 'ADMIN' ? 'danger' : 
                  user.role === 'TEACHER' ? 'warning' : 'success'
                }>
                  {user.role}
                </Badge>
              </div>
              
              <div className="text-start">
                <p><strong>Email:</strong><br />{user.email}</p>
                {user.studentId && (
                  <p><strong>Student ID:</strong><br />{user.studentId}</p>
                )}
                {user.subject && (
                  <p><strong>Subject:</strong><br />{user.subject}</p>
                )}
                <p><strong>Member Since:</strong><br />
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Body>
              <h5 className="card-title mb-4">Update Profile Information</h5>
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {user.role === 'STUDENT' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Form.Group>
                )}

                {user.role === 'TEACHER' && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="e.g., Mathematics, Science"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Qualification</Form.Label>
                      <Form.Control
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="e.g., M.Sc., Ph.D."
                      />
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter phone number"
                  />
                </Form.Group>

                <hr className="my-4" />
                
                <h6 className="mb-3">Change Password (Optional)</h6>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Enter current password"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Confirm new password"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info" className="mb-3">
                  <small>
                    <i className="bi bi-info-circle me-2"></i>
                    Leave password fields blank if you don't want to change your password.
                  </small>
                </Alert>

                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        studentId: user.studentId || '',
                        subject: user.subject || '',
                        phone: user.phone || '',
                        qualification: user.qualification || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setError('');
                      setSuccess('');
                    }}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;