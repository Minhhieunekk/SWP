import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import AppHeader from "./Header";

const PasswordChangeForm = () => {
  const { consumerid } = useParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageType, setMessageType] = useState('danger');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  // Debounce function to prevent too many API calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Check current password when user stops typing
  const checkCurrentPassword = debounce(async (password) => {
    if (!password) {
      setCurrentPasswordError('');
      return;
    }

    setIsCheckingPassword(true);
    try {
      const response = await axios.post('http://localhost:8088/checkCurrentPassword', {
        currentPassword: password,
        userid: consumerid,
      });

      if (!response.data.valid) {
        setCurrentPasswordError(response.data.message);
      } else {
        setCurrentPasswordError('');
      }
    } catch (error) {
      setCurrentPasswordError('Lỗi kiểm tra mật khẩu');
    }
    setIsCheckingPassword(false);
  }, 500); // Wait 500ms after user stops typing

  useEffect(() => {
    checkCurrentPassword(currentPassword);
  }, [currentPassword]);

  const validateForm = () => {
    const errors = [];
    
    if (!currentPassword) {
      errors.push("Vui lòng nhập mật khẩu hiện tại");
    }
    
    if (currentPasswordError) {
      errors.push(currentPasswordError);
    }
    
    if (!newPassword) {
      errors.push("Vui lòng nhập mật khẩu mới");
    }
    
    if (newPassword !== confirmPassword) {
      errors.push("Mật khẩu mới không khớp");
    }
    
    if (newPassword.length < 8) {
      errors.push("Mật khẩu mới phải có ít nhất 8 ký tự");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages([]);
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setMessages(validationErrors);
      setMessageType('danger');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8088/resetpass', {
        currentPassword,
        newPassword,
        userid: consumerid,
      });

      if (response.data.success) {
        setMessageType('success');
        handleReset();
      } else {
        setMessageType('danger');
      }
      setMessages(response.data.messages);
      
    } catch (error) {
      setMessageType('danger');
      setMessages(['Lỗi kết nối đến máy chủ']);
      console.error('Error:', error);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
    setMessages([]);
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    
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
                      isInvalid={!!currentPasswordError}
                    />
                    <Form.Control.Feedback type="invalid">
                      {currentPasswordError}
                    </Form.Control.Feedback>
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

                  {messages.length > 0 && (
                    <Alert variant={messageType}>
                      <ul className="mb-0">
                        {messages.map((msg, index) => (
                          <div key={index}>{msg}</div>
                        ))}
                      </ul>
                    </Alert>
                  )}

                  <div className="d-grid gap-2">
                    <Button 
                      variant="success" 
                      size="lg" 
                      type="submit"
                      disabled={isCheckingPassword || !!currentPasswordError}
                    >
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