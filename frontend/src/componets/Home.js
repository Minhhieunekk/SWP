import React, { useEffect, useState } from "react";
import { Container, Row, Col } from 'react-bootstrap';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import "../styles/home.scss";
import axios from "axios";
import AppHeader from "./Header";
import Footer from "./Footer";
// import Cart from './Cart';

import { useLocation, useNavigate } from "react-router";

const ProductCard = ({ productid, image, name, categoryname, material, price, totalrate, peoplerate }) => {
    const navigate = useNavigate();
    const rate = Math.round(totalrate / peoplerate);

    const handleCardClick = () => {
        navigate(`/productdetail/${productid}`);
    };

    return (
        <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="product-image-wrapper">
                <img src={image} alt={name} className="product-image" />
                <span className="tag hot">HOT</span>
            </div>
            <div className="product-info">
                <h3 className="product-title">{name}</h3>
                <p className="product-category">{categoryname} {material}</p>
                <p className="product-price">{price} VND</p>
               
                <div className="rating">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < rate ? "#FFC107" : "none"} stroke="#FFC107" />
                    ))}
                </div>
            </div>
        </div>
    );
};


const Home = () => {
    const [products, setProducts] = useState([]);
    const [productsbt, setProductsBt] = useState([]);
    const [productsdc, setProductsDc] = useState([]); // For dây chuyền
    const [productsvt, setProductsVt] = useState([]); // For vòng tay
    const [productsnh, setProductsNh] = useState([]); // For nhẫn
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageBt, setCurrentPageBt] = useState(1);
    const [currentPageDc, setCurrentPageDc] = useState(1); // For dây chuyền
    const [currentPageVt, setCurrentPageVt] = useState(1); // For vòng tay
    const [currentPageNh, setCurrentPageNh] = useState(1); // For nhẫn
    const [totalPages, setTotalPages] = useState(1);
    const [totalPagesBt, setTotalPagesBt] = useState(1);
    const [totalPagesDc, setTotalPagesDc] = useState(1); // For dây chuyền
    const [totalPagesVt, setTotalPagesVt] = useState(1); // For vòng tay
    const [totalPagesNh, setTotalPagesNh] = useState(1); // For nhẫn
    const limit = 4;
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            const queryParams = new URLSearchParams(location.search);
            const tokenFromUrl = queryParams.get('token');
            if (tokenFromUrl) {
                localStorage.setItem('token', tokenFromUrl);
                navigate('/home');
            } else {
                navigate('/');
                return;
            }
        }

        fetchUserData(token);
        fetchProductsData(currentPage, 'products');
        fetchProductsData(currentPageBt, 'productsbt');
        fetchProductsData(currentPageDc, 'productsdc'); // Fetch for dây chuyền
        fetchProductsData(currentPageVt, 'productsvt'); // Fetch for vòng tay
        fetchProductsData(currentPageNh, 'productsnh'); // Fetch for nhẫn
    }, [currentPage, currentPageBt, currentPageDc, currentPageVt, currentPageNh, location.search, navigate]);

    const fetchUserData = async (token) => {
        try {
            const res = await axios.get('http://localhost:8088/protected', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(res.data);
            localStorage.setItem('userId', res.data.consumerid);
        } catch (err) {
            console.error(err);
            navigate('/');
        }
    };

    const fetchProductsData = async (page, type) => {
        let endpoint;
        if (type === 'products') endpoint = 'home';
        else if (type === 'productsbt') endpoint = 'home/bongtai';
        else if (type === 'productsdc') endpoint = 'home/daychuyen';
        else if (type === 'productsvt') endpoint = 'home/vongtay';
        else if (type === 'productsnh') endpoint = 'home/nhan';

        try {
            const res = await axios.get(`http://localhost:8088/${endpoint}?page=${page}&limit=${limit}`);
            if (type === 'products') {
                setProducts(res.data.products);
                setTotalPages(res.data.totalPages);
            } else if (type === 'productsbt') {
                setProductsBt(res.data.products);
                setTotalPagesBt(res.data.totalPages);
            } else if (type === 'productsdc') {
                setProductsDc(res.data.products);
                setTotalPagesDc(res.data.totalPages);
            } else if (type === 'productsvt') {
                setProductsVt(res.data.products);
                setTotalPagesVt(res.data.totalPages);
            } else if (type === 'productsnh') {
                setProductsNh(res.data.products);
                setTotalPagesNh(res.data.totalPages);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePageChange = (direction, type) => {
        if (type === 'products') {
            if (direction === 'prev' && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else if (direction === 'next' && currentPage < totalPages) {
                setCurrentPage(prev => prev + 1);
            }
        } else if (type === 'productsbt') {
            if (direction === 'prev' && currentPageBt > 1) {
                setCurrentPageBt(prev => prev - 1);
            } else if (direction === 'next' && currentPageBt < totalPagesBt) {
                setCurrentPageBt(prev => prev + 1);
            }
        } else if (type === 'productsdc') {
            if (direction === 'prev' && currentPageDc > 1) {
                setCurrentPageDc(prev => prev - 1);
            } else if (direction === 'next' && currentPageDc < totalPagesDc) {
                setCurrentPageDc(prev => prev + 1);
            }
        } else if (type === 'productsvt') {
            if (direction === 'prev' && currentPageVt > 1) {
                setCurrentPageVt(prev => prev - 1);
            } else if (direction === 'next' && currentPageVt < totalPagesVt) {
                setCurrentPageVt(prev => prev + 1);
            }
        } else if (type === 'productsnh') {
            if (direction === 'prev' && currentPageNh > 1) {
                setCurrentPageNh(prev => prev - 1);
            } else if (direction === 'next' && currentPageNh < totalPagesNh) {
                setCurrentPageNh(prev => prev + 1);
            }
        }
    };

    return (
        <>
            <AppHeader username={user?.username} consumerid={user?.consumerid} password={user?.password} />
            <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel" data-bs-interval="3000" style={{ position: "relative", top: "120px" }}>
                <div class="carousel-indicators">
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
                </div>
                <div class="carousel-inner" >
                    <div class="carousel-item active">
                        <img src="banner1.jpg" class="d-block w-100 " alt="banner1" />
                    </div>
                    <div class="carousel-item">
                        <img src="banner2.jpg" class="d-block w-100 " alt="banner2" />
                    </div>
                    <div class="carousel-item">
                        <img src="banner3.jpg" class="d-block w-100 " alt="banner3" />
                    </div>
                </div>
            </div>


            <Container fluid className="home-container" style={{ position: "relative", top: "130px" }}>
                <div className="center-text mb-3"><h2>Sản phẩm chúng tôi</h2></div>
                <Row className="justify-content-center g-0">
                    <Col md={11}>
                        <div className="carousel-container">
                            <button
                                className="carousel-button prev"
                                onClick={() => handlePageChange('prev', 'products')}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={50} />
                            </button>
                            <div className="product-grid">
                                {products.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                            <button
                                className="carousel-button next"
                                onClick={() => handlePageChange('next', 'products')}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight size={50} />
                            </button>
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-center g-0 mt-4">
                    <Col md={11} className="text-center">
                        <img src="banner4.jpg" alt="anh1" className="img-fluid" style={{ width: "200%" }} />
                        <div className="center-text mt-3 mb-3"><h2>Trang sức khuyên tai</h2></div>
                    </Col>
                    <Col md={11}>
                        <div className="carousel-container">
                            <button
                                className="carousel-button prev"
                                onClick={() => handlePageChange('prev', 'productsbt')}
                                disabled={currentPageBt === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={50} />
                            </button>
                            <div className="product-grid">
                                {productsbt.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                            <button
                                className="carousel-button next"
                                onClick={() => handlePageChange('next', 'productsbt')}
                                disabled={currentPageBt === totalPagesBt}
                                aria-label="Next page"
                            >
                                <ChevronRight size={50} />
                            </button>
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-center g-0 mt-4">
                    <Col md={11} className="text-center">
                        <img src="banner5.jpg" alt="anh1" className="img-fluid" style={{ width: "200%" }} />
                        <div className="center-text mt-3 mb-3"><h2>Trang sức dây chuyền</h2></div>
                    </Col>
                    <Col md={11}>
                        <div className="carousel-container">
                            <button
                                className="carousel-button prev"
                                onClick={() => handlePageChange('prev', 'productsdc')}
                                disabled={currentPageDc === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={50} />
                            </button>
                            <div className="product-grid">
                                {productsdc.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                            <button
                                className="carousel-button next"
                                onClick={() => handlePageChange('next', 'productsdc')}
                                disabled={currentPageDc === totalPagesDc}
                                aria-label="Next page"
                            >
                                <ChevronRight size={50} />
                            </button>
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-center g-0 mt-4">
                    <Col md={11} className="text-center">
                        <img src="banner3.jpg" alt="anh1" className="img-fluid" style={{ width: "200%" }} />
                        <div className="center-text mt-3 mb-3"><h2>Trang sức vòng tay</h2></div>
                    </Col>
                    <Col md={11}>
                        <div className="carousel-container">
                            <button
                                className="carousel-button prev"
                                onClick={() => handlePageChange('prev', 'productsvt')}
                                disabled={currentPageVt === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={50} />
                            </button>
                            <div className="product-grid">
                                {productsvt.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                            <button
                                className="carousel-button next"
                                onClick={() => handlePageChange('next', 'productsvt')}
                                disabled={currentPageVt === totalPagesVt}
                                aria-label="Next page"
                            >
                                <ChevronRight size={50} />
                            </button>
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-center g-0 mt-4">
                    <Col md={11} className="text-center">
                        <img src="banner1.jpg" alt="anh1" className="img-fluid" style={{ width: "200%" }} />
                        <div className="center-text mt-3 mb-3"><h2>Trang sức nhẫn</h2></div>
                    </Col>
                    <Col md={11}>
                        <div className="carousel-container">
                            <button
                                className="carousel-button prev"
                                onClick={() => handlePageChange('prev', 'productsnh')}
                                disabled={currentPageNh === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={50} />
                            </button>
                            <div className="product-grid">
                                {productsnh.map((product) => (
                                    <ProductCard key={product.id} {...product} />
                                ))}
                            </div>
                            <button
                                className="carousel-button next"
                                onClick={() => handlePageChange('next', 'productsnh')}
                                disabled={currentPageNh === totalPagesNh}
                                aria-label="Next page"
                            >
                                <ChevronRight size={50} />
                            </button>
                        </div>
                    </Col>
                </Row>

            </Container>


            <Footer />
        </>
    );
};

export default Home;
