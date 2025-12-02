// src/components/common/Navbar.jsx
import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NavbarComponent = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar expand="lg" className="navbar-custom" fixed="top">
      <Container>
        <Navbar.Brand href="/admin" className="fw-bold">
          <i className="bi bi-mortarboard-fill me-2"></i>
          LMS Platform
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && <Nav.Link href="/admin">Dashboard</Nav.Link>}
            {user?.role === 'ADMIN' && (
              <>
                <Nav.Link href="/admin/teachers">Manage Teachers</Nav.Link>
                <Nav.Link href="/admin/students">Manage Students</Nav.Link> {/* ✅ NEW: Manage Students Link */}
                <Nav.Link href="/admin/courses">Manage Courses</Nav.Link>
              </>
            )}
            {user?.role === 'TEACHER' && (
              <Nav.Link href="/teacher/dashboard">Teacher Dashboard</Nav.Link>
            )}
            {user?.role === 'STUDENT' && (
              <Nav.Link href="/courses">My Courses</Nav.Link>
            )}
          </Nav>
          
          <Nav className="align-items-center">
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                  <i className="bi bi-person-circle me-2"></i>
                  {user.name}
                  <Badge bg="light" text="dark" className="ms-2">
                    {user.role}
                  </Badge>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <strong>{user.email}</strong>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item href="/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button variant="outline-light" href="/student-register">
                  Student Register
                </Button>
                <Button variant="outline-light" href="/student-login">
                  Student Login
                </Button>
                <Button variant="light" href="/admin-login">
                  Admin Login
                </Button>
                <Button variant="light" href="/teacher-login">
                  Teacher Login
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;