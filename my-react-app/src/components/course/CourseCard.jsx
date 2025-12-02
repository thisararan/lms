import React from 'react';
import { Card, Button, Badge, ProgressBar } from 'react-bootstrap';

const CourseCard = ({ course, user, onEnroll }) => {
  const isEnrolled = course.enrolled;
  
  const getLevelBadge = (level) => {
    const variants = {
      'Beginner': 'success',
      'Intermediate': 'warning',
      'Advanced': 'danger'
    };
    return variants[level] || 'secondary';
  };

  const handleEnrollClick = () => {
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  return (
    <Card className="course-card moodle-card h-100">
      <Card.Header className="course-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <Badge bg="light" text="dark" className="moodle-badge">
            {course.category}
          </Badge>
          <Badge bg={getLevelBadge(course.level)} className="moodle-badge">
            {course.level}
          </Badge>
        </div>
      </Card.Header>
      
      <Card.Body className="d-flex flex-column">
        <div className="mb-3">
          <Card.Title className="h5 text-primary mb-2">{course.title}</Card.Title>
          <Card.Text className="text-muted small mb-3">
            {course.description}
          </Card.Text>
          
          <div className="course-meta mb-3">
            <div className="d-flex justify-content-between text-sm text-muted mb-2">
              <span>
                <i className="bi bi-person me-1"></i>
                {course.instructor}
              </span>
              <span>
                <i className="bi bi-clock me-1"></i>
                {course.duration}
              </span>
            </div>
            <div className="d-flex justify-content-between text-sm text-muted">
              <span>
                <i className="bi bi-people me-1"></i>
                {course.students} students
              </span>
              <span>
                <i className="bi bi-star-fill text-warning me-1"></i>
                {course.rating}
              </span>
            </div>
          </div>
        </div>
        {isEnrolled && (
          <div className="mt-auto mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Progress</small>
              <small className="text-muted">{course.progress}%</small>
            </div>
            <ProgressBar now={course.progress} className="mb-3" />
          </div>
        )}

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <span className="h5 text-primary mb-0">{course.price}</span>
            
            {isEnrolled ? (
              <Button variant="success" size="sm" disabled className="btn-moodle">
                <i className="bi bi-check-circle me-1"></i>
                Enrolled
              </Button>
            ) : user?.role === 'STUDENT' ? (
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleEnrollClick}
                className="btn-moodle"
              >
                <i className="bi bi-cart-plus me-1"></i>
                Enroll
              </Button>
            ) : (
              <Button variant="outline-primary" size="sm" className="btn-moodle-outline">
                <i className="bi bi-eye me-1"></i>
                View
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CourseCard;