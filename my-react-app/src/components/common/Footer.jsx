// src/components/Footer.jsx
import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section text-light">
      <Container>
        <Row className="justify-content-center text-center mb-3">
          <Col xs={12}>
            <h3 className="footer-title">✨ LMS Platform ✨</h3>
            <p className="footer-subtitle">
              Empowering Learning Through Technology
            </p>
          </Col>
        </Row>

        <Row className="justify-content-center text-center mb-4">
          <Col xs={12} md={4}>
            <h5 className="footer-heading">Contact Us</h5>
            <ul className="list-unstyled footer-contact">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@lms.com">support@lms.com</a>
              </li>
              <li>
                <strong>Phone:</strong>{" "}
                <a href="tel:+941234567">(+94) 123-4567</a>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="footer-divider" />

        <Row>
          <Col className="text-center">
            <p className="footer-copy">
              © {currentYear} LMS Platform — All Rights Reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
