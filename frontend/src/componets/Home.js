import React, { useEffect, useState } from "react";
import { Container } from 'react-bootstrap';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/home.scss";
import axios from "axios";
import AppHeader from "./Header";
import { useLocation, useNavigate } from "react-router";

const ProductCard = ({ image, name, category, price, description, totalrate, peoplerate }) => {
    const rate = Math.round(totalrate / peoplerate);
    return (
        <div className="product-card">
            <div className="product-image-wrapper">
                <img src={image} alt={name} className="product-image" />
                <span className="tag hot">HOT</span>
            </div>
            <div className="product-info">
                <h3 className="product-title">{name}</h3>
                <p className="product-category">{category}</p>
                <p className="product-price">{price} VND</p>
                <p className="product-description">{description}</p>
                <button className="add-to-cart-btn">Add to cart</button>
                <div className="rating">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < rate ? "#FFC107" : "none"} stroke="#FFC107" />
                    ))}
                </div>
            </div>
        </div>
    );
}

const Home = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 4; // 4 sản phẩm mỗi trang
    const location = useLocation();
    // const params = new URLSearchParams(location.search);
    // const username = params.get('username') || location.state?.username || 'Guest';
    // const password = params.get('password') || location.state?.password || "";
    // const consumerid=params.get('consumerid') || location.state?.consumerid;
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    // useEffect(() => {
    //     fetchProducts(currentPage);
    // }, [currentPage]);

    useEffect(() => {

        const token = localStorage.getItem('token');
        if (!token) {
            const queryParams = new URLSearchParams(location.search);
            const tokenFromUrl = queryParams.get('token');
            if (tokenFromUrl) {
                localStorage.setItem('token', tokenFromUrl);  // Lưu token vào localStorage        
            }
            return;
        }

        // Fetch user data
        axios.get('http://localhost:8088/protected', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                setUser(res.data)
            })
            .catch(err => {
                console.error(err);
                navigate('/');
            });

        // Fetch products
        fetchProducts(currentPage);
    }, [currentPage, navigate, location.search]);

    const fetchProducts = (page) => {
        axios.get(`http://localhost:8088/home?page=${page}&limit=${limit}`)
            .then(res => {
                setProducts(res.data.products);
                setCurrentPage(res.data.currentPage);
                setTotalPages(res.data.totalPages);
            })
            .catch(err => console.log(err));
    };

    const handlePageChange = (direction) => {
        if (direction === 'prev' && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        } else if (direction === 'next' && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };


    return (
        <>
            <AppHeader username={user?.username} consumerid={user?.consumerid} password={user?.password} />
            
            <Container className="home-container">
                <div className="carousel-container">
                    <button
                        className="carousel-button prev"
                        onClick={() => handlePageChange('prev')}
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
                        onClick={() => handlePageChange('next')}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight size={50} />
                    </button>
                </div>
                <div className="pagination-container">
                    <div className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </div>
                </div>
            </Container>
        </>
    );
};

export default Home;