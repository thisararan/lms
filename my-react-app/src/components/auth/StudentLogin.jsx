import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const StudentLogin = () => {
  const { studentLogin } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password minimum length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email: formData.email });
      
      // Trim whitespace from credentials
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim()
      };
      
      const result = await studentLogin(credentials);
      
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        navigate('/');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div
                  className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <i className="fas fa-user-graduate fa-2x"></i>
                </div>
                <h2 className="text-success fw-bold">Student Login</h2>
                <p className="text-muted">Access your student account</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="py-2"
                    autoComplete="email"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="py-2"
                    minLength={6}
                    autoComplete="current-password"
                  />
                </Form.Group>

                <Button
                  variant="success"
                  type="submit"
                  className="w-100 py-2 fw-medium"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In as Student
                    </>
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted mb-2">
                  Don't have an account?{' '}
                  <Link to="/student-register" className="text-success text-decoration-none fw-medium">
                    Register here
                  </Link>
                </p>
                <p className="text-muted mb-0">
                  Are you a teacher or admin?{' '}
                  <Link to="/teacher-login" className="text-success text-decoration-none fw-medium">
                    Login here
                  </Link>
                </p>
              </div>

            
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentLogin;