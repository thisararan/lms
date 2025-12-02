import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/student-login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'TEACHER':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'STUDENT':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/student-login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;