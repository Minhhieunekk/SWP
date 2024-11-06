import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import AppHeader from "./Header";
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router";
export const MaterialCategory = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('all'); // Default to show all products
  const { id } = useParams();
  const [isNew,setIsNew]=useState(false);
  
  const materialMap = {
    "1": "Vàng",
    "2": "Bạc"
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://localhost:8088/api/materials/${materialMap[id]}`);
        setProducts(response.data);
        setError(null); // Clear previous errors if fetch is successful
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Could not fetch products. Please try again later.');
      }
    };

    fetchProducts();
  }, [id]);

  const handleSortChange = (e) => {
    const selectedOption = e.target.value;
    setSortOption(selectedOption);
  
    if (selectedOption === 'newest') {
      setIsNew(true); // Đặt isNew thành true khi chọn sản phẩm mới nhất
    } else {
      setIsNew(false); // Đặt isNew thành false cho các tùy chọn khác
    }
  };

  const getSortedProducts = () => {
    let sortedProducts = [...products];

    switch (sortOption) {
      case 'newest':
        return sortedProducts.slice(-10); // Show last 10 products for "Sản phẩm mới nhất"
      case 'priceAsc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'priceDesc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'bestSelling':
        return sortedProducts.sort((a, b) => b.soldcount - a.soldcount); // Sort by sold count
      case 'all':
      default:
        return sortedProducts; // Show all products
    }
  };

  const sortedProducts = getSortedProducts();
  const navigate=useNavigate();
  return (
    <>
      <AppHeader />
      <Container fluid className="py-4" style={{ position: "relative", top: "200px" }}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Row>
          <Col xs={12}>
            <Form.Select className="mb-4" size="sm" onChange={handleSortChange}>
              <option value="all">Tất cả sản phẩm</option>
              <option value="newest">Sản phẩm mới nhất</option>
              <option value="priceAsc">Giá từ thấp đến cao</option>
              <option value="priceDesc">Giá từ cao đến thấp</option>
              {/* <option value="bestSelling">Sản phẩm bán chạy nhất</option> */}
            </Form.Select>
          </Col>
        </Row>
        <Row xs={2} md={3} lg={4} className="g-4">
          {sortedProducts.map(product => (
            <Col key={product.id}>
              <Card className="h-100" style={{cursor:'pointer'}} onClick={()=>navigate(`/productdetail/${product.productid}`)}>
                <Card.Img variant="top" src={`/images/${product.image}`} />
                {isNew && (
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