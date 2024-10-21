import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import AppHeader from "./Header";
const PasswordChangeForm = () => {
  const { consumerid } = useParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8088/resetpass', {
        newpass: newPassword,
        userid: consumerid,
      });
      setMessage(response.data);
      if (response.data === 'password reset successfully') {
        handleReset();
      }
    } catch (error) {
      setMessage('Error resetting password');
      console.error('Error:', error);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
    <AppHeader/>
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100">
        <Col xs={12} md={6} lg={4} className="mx-auto">
          <Card>
            <Card.Header className="bg-info text-white text-center">
              <h3 className="mb-0">Thay đổi mật khẩu</h3>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Mật khẩu hiện tại</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>Mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Nhập lại mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                {message && <Alert variant="info">{message}</Alert>}

                <div className="d-grid gap-2">
                  <Button variant="success" size="lg" type="submit">
                    Thay đổi mật khẩu
                  </Button>
                  <Button variant="warning" size="lg" type="button" onClick={handleReset}>
                    Đặt lại 
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default PasswordChangeForm;
