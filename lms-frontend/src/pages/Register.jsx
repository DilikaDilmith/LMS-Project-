import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ROLE_STUDENT',
    instituteId: 1
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData);
    if (success) navigate('/login');
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <Row>
        <Col md={12}>
          <Card className="shadow-lg" style={{ width: '500px' }}>
            <Card.Body className="p-5">
              <h2 className="text-center text-primary mb-4">Register</h2>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control name="firstName" placeholder="First Name" onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control name="lastName" placeholder="Last Name" onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control name="username" placeholder="Username" onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control name="email" type="email" placeholder="Email" onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control name="password" type="password" placeholder="Password" onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control name="phone" placeholder="Phone" onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select name="role" onChange={handleChange}>
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_LECTURER">Lecturer</option>
                    <option value="ROLE_PARENT">Parent</option>
                    <option value="ROLE_INSTITUTE_ADMIN">Institute Admin</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Institute ID</Form.Label>
                  <Form.Control name="instituteId" type="number" value={1} onChange={handleChange} />
                </Form.Group>
                <Button variant="success" type="submit" className="w-100">
                  Register
                </Button>
              </Form>
              <p className="text-center text-muted mt-3">
                Already have an account? <Link to="/login" className="text-primary">Login</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;