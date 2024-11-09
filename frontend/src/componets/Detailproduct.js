import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { Star } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate,useLocation } from 'react-router-dom';
import "../styles/detailproduct.scss";
import { Image } from 'antd';
import AppHeader from "./Header";
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const ProductCard = ({
    productid,
    image,
    name,
    categoryname,
    material,
    price,
    totalrate,
    peoplerate,
    description,
    discount_value,
    brand,
    goldage,
    code,
    sizes
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(sizes[0]?.size || 5);
    const [popupVisible, setPopupVisible] = useState(false);
    const userId = localStorage.getItem('userId');
   
    const navigate = useNavigate();
    const rate = Math.round(totalrate / peoplerate);

    const handleQuantityChange = (e) => {
        const newQuantity = parseInt(e.target.value);
        const maxAmount = sizes.find(size => size.size === selectedSize)?.amount || 0;
        setQuantity(newQuantity > maxAmount ? maxAmount : newQuantity);
    };

    const handleSizeChange = (e) => {
        setSelectedSize(parseInt(e.target.value));
        setQuantity(1); // Reset quantity when size changes
    };

    const calculatePrice = (basePrice, size) => {
        const increasePercentage = 0.02;
        const increaseAmount = basePrice * increasePercentage * (size - 5);
        return basePrice + increaseAmount;
    };

    const currentPrice = calculatePrice(price, selectedSize) * quantity;
    const selectedSizeData = sizes.find(size => size.size === selectedSize);
    const amount = selectedSizeData ? selectedSizeData.amount : 0;

    const AddToCart = async () => {
        try {
            const responseData = await axios.post(`http://localhost:8088/addtocart`, {
                userid: userId,
                productid,
                quantity,
                size: selectedSize
            });
            if (responseData.data === 'Existed') {
                Swal.fire({
                    title: "Jewelry thông báo",
                    text: "Sản phẩm này đã có trong giỏ hàng",
                    icon: "info"
                  });
                return;
            } else {
                setPopupVisible(true);
            };
            
        } catch (error) {
            console.error('Error adding to cart', error);
        }
    };
    const HandletoBuy = async () => {
        try {
            const responseData = await axios.post(`http://localhost:8088/addtocart`, {
                userid: userId,
                productid,
                quantity,
                size: selectedSize
            });
            if (responseData.data === 'Existed') {
                Swal.fire({
                    title: "Jewelry thông báo",
                    text: "Sản phẩm này đã có trong giỏ hàng",
                    icon: "info"
                  });
                return;
            } else {
                navigate(`/cart/${userId}`);
            };
            
        } catch (error) {
            console.error('Error adding to cart', error);
        }
    };

    const handleContinueShopping = () => {
        setPopupVisible(false);
    };

    const handleGoToCart = () => {
        setPopupVisible(false);
        navigate(`/cart/${userId}`);
    };
    const [user, setUser] = useState(null);
    const fetchUserData = async (token) => {
        try {
    
          const res = await axios.get('http://localhost:8088/api/user/details', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setUser(res.data);
    
        } catch (err) {
          console.error('Error fetching user data:', err);
    
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
    
          }
        }
      };
      const location = useLocation();
      useEffect(() => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (!token && tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          fetchUserData(tokenFromUrl);
        } else if (token) {
          fetchUserData(token);
        }
      }, [location.search])

    return (
        <div className="container mt-4" style={{ position: "relative", top: "50px" }}>
            <Card className="product-detail-card shadow-sm" style={{ width: '800px' }}>
                <Row className="g-0">
                <Card.Title className="fw-bold mt-3">{name}</Card.Title>
                    <Col md={6} className="d-flex align-items-center">
                    
                        <Image variant="top" src={`/images/${image}`} alt={name} className="img-fluid" />
                    </Col>
                    <Col md={6}>
                        <Card.Body>
                            
                            <Card.Text className='ms-5 d-flex' ><strong style={{ marginRight: '5px' }}>Chất liệu:</strong>{`${categoryname} ${material} ${goldage || ''}`}</Card.Text>
                            <Card.Text  className='ms-5 d-flex' ><strong style={{ marginRight: '5px' }}>Thương hiệu:</strong>  {` ${brand} `}</Card.Text>
                            <Card.Text  className='ms-5 d-flex'><strong style={{ marginRight: '5px' }}>Mã sản phẩm:</strong> {`${code} `}</Card.Text>
                            <Card.Text className="text-decoration-line-through fw-bold mb-3">{(currentPrice/discount_value*100).toLocaleString()} VND</Card.Text>
                            <Card.Text className="text-success fw-bold mb-3" >{currentPrice.toLocaleString()} VND</Card.Text>
                            
                            <div className="mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < rate ? "#FFC107" : "none"} color="#FFC107" />
                                ))}
                                <span className="ms-2">({peoplerate} đánh giá)</span>
                            </div>
                            <p className={amount > 0 ? "text-success" : "text-danger"}>
                                {amount > 0 ? "Còn hàng" : "Hết hàng"}
                            </p>
                            <Form.Group className="mb-3">
                                <Form.Label>Kích cỡ:</Form.Label>
                                <Form.Select value={selectedSize} onChange={handleSizeChange}>
                                    {sizes.map((size) => (
                                        <option key={size.size} value={size.size}>{size.size}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Số lượng:</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    min="1"
                                    max={amount}
                                    className="text-center"
                                />
                            </Form.Group>
                            { user?.admin !==1 &&
                                <div className="d-grid gap-2">
                                <Button variant="outline-success" size="lg" disabled={amount === 0} onClick={HandletoBuy} >Mua ngay</Button>
                                <Button variant="outline-info" size="lg" disabled={amount === 0} onClick={AddToCart}>Thêm vào giỏ hàng</Button>
                                {popupVisible && (
                                    <div className="popup-container">
                                        <div className="popup">
                                            <p className="popup-message">Đã thêm sản phẩm vào giỏ hàng</p>
                                        <div className="popup-actions">
                                            <button 
                                            className="popup-button continue-button" 
                                            onClick={handleContinueShopping}
                                            >
                                            Tiếp tục mua hàng
                                            </button>
                                            <button 
                                            className="popup-button cart-button" 
                                            onClick={handleGoToCart}
                                            >
                                            Đến giỏ hàng
                                            </button>
                                        </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                             }
                            
                        </Card.Body>
                    </Col>
                </Row>
                <Card.Body>
                    <h4>Mô tả sản phẩm</h4>
                    <p>{description}</p>
                    <h4>Thông tin thêm</h4>
                    <p><span style={{ fontStyle: "italic" }}>Bảo hành trong 1 năm, đổi trả hoàn toàn miễn phí</span></p>
                    <p><span style={{ fontStyle: "italic" }}>Mua 2 sản phẩm trở lên, sẽ được tặng 1 sản phẩm cùng loại</span></p>
                </Card.Body>
            </Card>
        </div>
    );
};

const ProductDetailPage = () => {
    const [productData, setProductData] = useState([]);
    const [error, setError] = useState(null);
    const { productid } = useParams();

    useEffect(() => {
        const fetchProductData = async () => {
            if (!productid) return;
            try {
                const response = await axios.get(`http://localhost:8088/productdetail`, { params: { productid } });
                setProductData(response.data.product);
                setError(null);
            } catch (error) {
                setError(error.response?.data?.error || 'An error occurred while fetching the product');
            }
        };
        fetchProductData();
    }, [productid]);

    if (error) {
        return <Alert variant="danger" className="mt-4">{error}</Alert>;
    }

    if (productData.length === 0) {
        return <Alert variant="info" className="mt-4">Loading...</Alert>;
    }

    // Extract product details and group sizes
    const productDetails = {
        ...productData[0],
        sizes: productData.map(item => ({ size: item.size, amount: item.amount })),
    };

    return (
        <div style={{ overflow: "hidden" }}>
            <AppHeader />
            <ProductCard {...productDetails} />
        </div>
    );
};

export default ProductDetailPage;
