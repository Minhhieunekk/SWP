import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Badge, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import AppHeader from "./Header";
import { useNavigate } from "react-router";
import { ArrowRightOutlined } from "@ant-design/icons";

const ProductFilter = () => {
  const [selectedFilters, setSelectedFilters] = useState({
    brands: '',
    goldAges: '',
    materials: '',
    genders: '',
    productTypes: ''
  });

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortOption, setSortOption] = useState('all');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('100.000.000');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, filtersResponse] = await Promise.all([
          axios.get('http://localhost:8088/api/products'),
          axios.get('http://localhost:8088/api/filters')
        ]);
        setProducts(productsResponse.data);
        setFilters(formatFilters(filtersResponse.data));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const formatFilters = (filtersData) => {
    return Object.entries(filtersData).map(([key, values]) => ({
      id: key,
      label: getFilterLabel(key),
      options: values.map(value => ({
        value: value === 'Tất cả' ? '' : value,
        label: value
      }))
    }));
  };

  const getFilterLabel = (key) => {
    const labels = {
      brands: 'Thương hiệu',
      goldAges: 'Tuổi vàng',
      materials: 'Chất liệu',
      genders: 'Giới tính',
      productTypes: 'Loại trang sức'
    };
    return labels[key] || key;
  };

  const handleFilterChange = (filterId, value) => {
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      [filterId]: value
    }));
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const parseCurrency = (formattedValue) => {
    return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
  };

  const handleMinPriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setMinPrice(formatCurrency(rawValue));
  };

  const handleMaxPriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setMaxPrice(formatCurrency(rawValue));
  };

  const filteredProducts = products.filter(product => {
    const parsedMinPrice = parseCurrency(minPrice);
    const parsedMaxPrice = parseCurrency(maxPrice);

    return (
      Object.entries(selectedFilters).every(([key, value]) => {
        if (!value) return true;
        switch (key) {
          case 'brands':
            return product.brand === value;
          case 'goldAges':
            return product.goldage === value;
          case 'materials':
            return product.material === value;
          case 'genders':
            return (value === 'Nam' && product.gender === 'Nam') ||
                   (value === 'Nữ' && product.gender === 'Nữ');
          case 'productTypes':
            return product.categoryname === value;
          default:
            return true;
        }
      }) &&
      product.price >= parsedMinPrice &&
      product.price <= parsedMaxPrice
    );
  });

  const getSortedProducts = () => {
    let sortedProducts = [...filteredProducts];

    switch (sortOption) {
      case 'newest':
        return sortedProducts.slice(-20);
      case 'priceLowToHigh':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'priceHighToLow':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'promo':
        return sortedProducts.filter(product => product.discount_id);
      case 'all':
      default:
        return sortedProducts;
    }
  };

  const sortedProducts = getSortedProducts();

  return (
    <>
      <AppHeader />
      <Container fluid className="py-4" style={{ position: "relative", top: "200px" }}>
        <Row>
          <Col xs={2}>
            <Form.Select className="mb-4" size="sm" onChange={handleSortChange}>
              <option value="all">Tất cả sản phẩm</option>
              <option value="newest">Sản phẩm mới nhất</option>
              <option value="priceLowToHigh">Giá từ thấp đến cao</option>
              <option value="priceHighToLow">Giá từ cao đến thấp</option>
              <option value="promo">Sản phẩm khuyến mãi</option>
            </Form.Select>
          </Col>
          <Col xs={10} className="mb-4">
            <Row>
              {filters.map(filter => (
                <Col key={filter.id} xs={6} sm={4} md={3} lg={2} className="mb-2">
                  <Form.Select
                    size="sm"
                    onChange={e => handleFilterChange(filter.id, e.target.value)}
                    value={selectedFilters[filter.id]}
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
        <Row className="mb-3">
          <Form.Group controlId="priceRange" className="mb-4">
            <Row className="align-items-center">
              <Col xs={3} md={1}>
                <Form.Label>Khoảng giá: </Form.Label>
              </Col>
              <Col xs={4} md={3}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Giá thấp nhất"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="text-center"
                  />
                  <InputGroup.Text>VND</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col xs="auto" className="d-flex justify-content-center">
                <ArrowRightOutlined style={{ fontSize: '20px', color: '#888' }} />
              </Col>
              <Col xs={4} md={3}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Giá cao nhất"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="text-center"
                  />
                  <InputGroup.Text>VND</InputGroup.Text>
                </InputGroup>
              </Col>
            </Row>
          </Form.Group>
        </Row>
        <Row xs={2} md={3} lg={4} className="g-4">
          {sortedProducts.map(product => (
            <Col key={product.id}>
              <Card className="h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/productdetail/${product.productid}`)}>
                <Card.Img variant="top" src={product.image} />
                {product.isnew === 1 && (
                  <Badge bg="light" text="dark" className="position-absolute top-0 end-0 m-2">
                    NEW
                  </Badge>
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h6">{product.name}</Card.Title>
                  {product.discount_id ? 
                  <>
                    <Card.Text className="text-danger fw-bold mt-auto" style={{textDecoration:"line-through"}}>
                    {parseInt(product.old_price).toLocaleString()}VND
                  </Card.Text>
                  <Card.Text className="text-success fw-bold mt-auto">
                    {parseInt(product.price).toLocaleString()}VND
                  </Card.Text>
                  </> : 
                  <Card.Text className="text-success fw-bold mt-auto">
                    {parseInt(product.price).toLocaleString()}VND
                  </Card.Text>
                  }
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

export default ProductFilter;
