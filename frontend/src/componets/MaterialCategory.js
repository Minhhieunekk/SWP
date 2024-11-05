import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import AppHeader from "./Header";
import { useParams } from 'react-router-dom';

export const MaterialCategory = () => {
    const [products, setProducts] = useState([]);
    const { id } = useParams();
    
    const materialMap = {
      "1": "Vàng",
      "2": "Bạc"
    };
  
    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await axios.get(`http://localhost:8088/api/materials/${materialMap[id]}`);
          setProducts(response.data);
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };
  
      fetchProducts();
    }, [id]);
  
    return (
      <>
        <AppHeader />
        <Container fluid className="py-4" style={{position:"relative",top:"200px"}}>
          <Row>
            <Col xs={12}>
              <Form.Select className="mb-4" size="sm">
                <option>Sản phẩm mới nhất</option>
                <option>Giá từ thấp đến cao</option>
                <option>Giá từ cao đến thấp</option>
                <option>Sản phẩm bán chạy nhất</option>
              </Form.Select>
            </Col>
          </Row>
          <Row xs={2} md={3} lg={4} className="g-4">
            {products.map(product => (
              <Col key={product.id}>
                <Card className="h-100">
                <Card.Img variant="top" src={`/images/${product.image}`} />
                  {product.isnew === 1 && (
                    <Badge bg="light" text="dark" className="position-absolute top-0 end-0 m-2">
                      NEW
                    </Badge>
                  )}
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h6">{product.name}</Card.Title>
                    <Card.Text className="text-danger fw-bold mt-auto">
                      {parseInt(product.price).toLocaleString()}đ
                    </Card.Text>
                    <small className="text-muted">{product.code}</small>
                    {product.soldcount > 0 && (
                      <small className="text-muted">{product.soldcount} đã bán</small>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </>
    );
  };