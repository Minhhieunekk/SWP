import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import '../styles/chatbot.scss';
import AppHeader from './Header';

const API_URL = 'http://localhost:8088/api';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat-history`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: inputMessage, timestamp: new Date() }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: inputMessage
      });

      // Add bot response to chat
      setMessages(prev => [...prev, { type: 'bot', content: response.data.response, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, there was an error processing your message.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppHeader />
      <Container fluid className="chat-container py-4" style={{ position: 'relative', top: '120px', backgroundColor: '#f8f9fa' }}>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="chat-card shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">AI Chatbot</h4>
              </Card.Header>

              <Card.Body className="chat-body">
                <div className="messages-container">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message-wrapper ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                    >
                      <div className="message-content">
                        {message.content}
                      </div>
                      <small className="message-timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-center p-3">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </Card.Body>

              <Card.Footer className="bg-white">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-2">
                    <Col>
                      <Form.Control
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading}
                      >
                        Send
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Chatbot;
