import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import AppHeader from "./Header";
import { useParams } from 'react-router-dom';

export const JewelryCategory = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [sortOption, setSortOption] = useState('newest');
    const { type } = useParams();
    
    const typeMap = {
      "1": "Dây chuyền",
      "2": "Vòng Tay",
      "3": "Nhẫn",
      "4": "Khuyên tai"
    };
  
    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await axios.get(`http://localhost:8088/api/jewelry/${typeMap[type]}`);
          setProducts(response.data);
          setError(null); // Clear previous errors if fetch is successful
        } catch (error) {
          console.error('Error fetching products:', error);
          setError('Could not fetch products. Please try again later.');
        }
      };
  
      fetchProducts();
    }, [type]);
  
    const handleSortChange = (e) => {
      setSortOption(e.target.value);
    };

    const sortedProducts = [...products].sort((a, b) => {
      switch (sortOption) {
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'bestSelling':
          // Assuming you have a best-selling property; replace with actual field if it exists
          return b.sold - a.sold; 
        default:
          return 0; // No sorting or default sorting by newest
      }
    });
  
    return (
      <>
        <AppHeader />
        <Container fluid className="py-4" style={{ position: "relative", top: "200px" }}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row>
            <Col xs={12}>
              <Form.Select className="mb-4" size="sm" onChange={handleSortChange}>
                <option value="newest">Sản phẩm mới nhất</option>
                <option value="priceAsc">Giá từ thấp đến cao</option>
                <option value="priceDesc">Giá từ cao đến thấp</option>
                <option value="bestSelling">Sản phẩm bán chạy nhất</option>
              </Form.Select>
            </Col>
          </Row>
          <Row xs={2} md={3} lg={4} className="g-4">
            {sortedProducts.map(product => (
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
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </>
    );
};
