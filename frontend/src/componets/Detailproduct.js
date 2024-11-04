import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { Star } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import "../styles/detailproduct.scss";
import AppHeader from "./Header";
import { useLocation, useNavigate } from "react-router";

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
    amount
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState(5);
    const [popupVisible, setPopupVisible] = useState(false); 
    const sizes = [5, 6, 7, 8, 9, 10];
    const rate = Math.round(totalrate / peoplerate);
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const handleQuantityChange = (e) => {
        const newQuantity = parseInt(e.target.value);
        setQuantity(newQuantity > amount ? amount : newQuantity);
    };

    const handleSizeChange = (e) => {
        setSelectedSize(parseInt(e.target.value));
    };

    const calculatePrice = (basePrice, size) => {
        if (size === 5) {
            return basePrice;
        } else {
            const increasePercentage = 0.02;
            const increaseAmount = basePrice * increasePercentage * (size - 5);
            return basePrice + increaseAmount;
        }
    };

    const currentPrice = calculatePrice(price, selectedSize) * quantity;

    const AddToCart = async () => {
        // const navigate = useNavigate();
        try {
            console.log(`userId là:${userId}`);
            console.log(userId);
            console.log(localStorage);
             await axios.post(`http://localhost:8088/addtocart`,{userid : userId, productid:productid, quantity:quantity, size: selectedSize});
            
            setPopupVisible(true); 
            // navigate(`/cart/${userId}`)
        } catch (error) {
            console.error('Error fetching cart items', error);
        } 
    };

    const handleContinueShopping = () => {
        setPopupVisible(false); // Close the popup
    };

    const handleGoToCart = () => {
        setPopupVisible(false); // Close the popup
        navigate(`/cart/${userId}`); // Navigate to the cart page
    };

    // const addtocart
    
    return (
        <div className="container mt-4" style={{ position: "relative", top: "50px" }}>

            <Card className="product-detail-card shadow-sm" style={{ width: '800px' }}>
                <Row className="g-0">
                    <Col md={6} className="d-flex align-items-center">
                        <Card.Img
                            variant="top"
                            src={`/images/${image}`}
                            alt={name}
                            className="img-fluid"
                        />
                    </Col>
                    <Col md={6}>
                        <Card.Body>
                            <Card.Title className="fw-bold">{name}</Card.Title>
                            <Card.Text className="text-muted mb-2">{`${categoryname} ${material}`}</Card.Text>
                            <Card.Text className="fw-bold mb-3">{currentPrice.toLocaleString()} VND</Card.Text>
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
                                        <option key={size} value={size}>{size}</option>
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
                            <div className="d-grid gap-2">
                                <Button variant="primary" size="lg" disabled={amount === 0}>Mua ngay</Button>
                                <Button variant="outline-primary" size="lg" disabled={amount === 0} onClick={AddToCart}>Thêm vào giỏ hàng</Button>
                                {popupVisible && (
                                    <div className="popup">
                                        <p>Đã thêm sản phẩm vào giỏ hàng</p>
                                        <button onClick={handleContinueShopping}>Tiếp tục mua hàng</button>
                                        <button onClick={handleGoToCart}>Đến giỏ hàng</button>
                                    </div>
                                )}
                            </div>
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
}
const ProductDetailPage = () => {
    const [productData, setProductData] = useState([]);

    const [error, setError] = useState(null);
    const { productid } = useParams();
    useEffect(() => {
        const fetchProductData = async () => {
            console.log("Received request for product ID:", productid);
            if (!productid) {
                console.error('Product ID is undefined');
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8088/productdetail`, { params: { productid } });
                setProductData(response.data.product);
                setError(null);
            } catch (error) {
                console.error('Error fetching product data:', error);
                setError(error.response?.data?.error || 'An error occurred while fetching the product');
            }
        };
        fetchProductData();
    }, [productid]);

    if (error) {
        return <Alert variant="danger" className="mt-4">{error}</Alert>;
    }

    if (!productData) {
        return <Alert variant="info" className="mt-4">Loading...</Alert>;
    }


    return (
        <div style={{ overflow: "hidden" }}>
            <AppHeader />
            {productData.map((product) => (
                <ProductCard key={product.id} {...product} />
            ))}
        </div>
    )

};

export default ProductDetailPage;
