import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';

const Settings = () => {
  return (
    <Container className="my-5 pt-4">
      <Row>
        <Col>
          <h1 className="mb-4">Settings</h1>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            Settings functionality is under development. Coming soon!
          </Alert>

          <Card className="moodle-card">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-sliders me-2"></i>
                Account Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Advanced account settings and preferences will be available here soon.
                You'll be able to customize your learning experience, manage notifications,
                and configure system preferences.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="moodle-card">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-tools me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary py-2">
                  <i className="bi bi-download me-2"></i>
                  Export Data
                </button>
                <button className="btn btn-outline-secondary py-2">
                  <i className="bi bi-bell me-2"></i>
                  Notification Settings
                </button>
                <button className="btn btn-outline-info py-2">
                  <i className="bi bi-display me-2"></i>
                  Display Preferences
                </button>
                <button className="btn btn-outline-warning py-2">
                  <i className="bi bi-shield-check me-2"></i>
                  Privacy Settings
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;