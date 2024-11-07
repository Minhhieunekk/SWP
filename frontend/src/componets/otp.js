import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Form, Button, Container, Card, Row, Col, Alert } from 'react-bootstrap';

const OTP = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8088/forgot-password', { email });
      setMessage(response.data);
      setStep(2);
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8088/reset-password', { email, otp, newPassword });
      setMessage(response.data);
      setStep(3);
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <Card>
            <Card.Header className="bg-info text-white text-center">
              <h3 className="mb-0">{step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}</h3>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}
              {step === 1 && (
                <Form onSubmit={handleRequestOTP}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Địa chỉ email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Nhập email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button variant="primary" size="lg" type="submit">
                      Yêu cầu OTP
                    </Button>
                  </div>
                </Form>
              )}
              {step === 2 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3" controlId="otp">
                    <Form.Label>OTP</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button variant="success" size="lg" type="submit">
                      Thay đổi mật khẩu
                    </Button>
                  </div>
                </Form>
              )}
              {step === 3 && (
                <p>Mật khẩu đã được thay đổi thành công vui lòng <Link to="/" className="linkreset">đăng nhập</Link> với mật khẩu mới.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OTP;
