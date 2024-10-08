import React, { useState } from 'react';
import './ProductDetail.css';
import Star from './Star'; // Assuming you have a Star component

const ProductDetail = () => {
    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description'); 
    const [selectedSize, setSelectedSize] = useState('S'); 
    const [productPrice, setProductPrice] = useState(23710000); 

    const sizePrices = {
        S: 23710000,
        M: 24710000,
        B: 25710000,
    };

    const images = [
        "https://cdn.pnj.io/images/detailed/86/gnddddh000184-nhan-kim-cuong-vang-14k-pnj-01.png",
        "https://cdn.pnj.io/images/detailed/125/gnddddw001069-nhan-kim-cuong-vang-trang-14k-pnj-2.png",
        "https://cdn.pnj.io/images/detailed/125/gnddddw001069-nhan-kim-cuong-vang-trang-14k-pnj-3.png"
    ];

    const productContent = {
        description: ["Đây là mô tả sản phẩm chi tiết. Sản phẩm được làm từ nguyên liệu cao cấp và thiết kế tinh tế."],
        policy: ["Chính sách bảo hành sản phẩm trong 12 tháng. Đổi trả hàng trong vòng 30 ngày."],
        questions: ["Câu hỏi thường gặp: 1. Sản phẩm có bảo hành không? 2. Làm thế nào để đổi trả?"]
    };

    const handleQuantityChange = (e) => setQuantity(e.target.value);
    const handleImageClick = (index) => setMainImageIndex(index);
    const handleNextImage = () => setMainImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    const handlePrevImage = () => setMainImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    const handleTabClick = (tab) => setActiveTab(tab);
    const handleSizeChange = (e) => {
        const size = e.target.value;
        setSelectedSize(size);
        setProductPrice(sizePrices[size]);
    };

    // Image Carousel Component
    const ProductImageCarousel = () => (
        <div className="product-image-container">
            <button className="prev-arrow" onClick={handlePrevImage}>&lt;</button>
            <img className="main-product-image" src={images[mainImageIndex]} alt="Product" />
            <button className="next-arrow" onClick={handleNextImage}>&gt;</button>
            <div className="product-thumbnails">
                {images.map((img, index) => (
                    <img key={index} src={img} alt={`Thumbnail ${index}`} onClick={() => handleImageClick(index)} />
                ))}
            </div>
        </div>
    );

    // Product Info Component
    const ProductInfo = () => (
        <div className="product-info">
            <h2 className="product-title">Dây chuyền Vàng trắng Ý 18K PNJ 0000W001351</h2>
            <div className="star-rate">
                <Star totalStars={5} />
            </div>
            <p className="product-price">{productPrice.toLocaleString()} đ</p>
            <p className="product-installment">Chỉ cần trả 1.975.834 đ/tháng</p>
            <p className="product-availability">Còn hàng</p>
            <div className="product-size">
                <label htmlFor="size">Chọn kích cỡ:</label>
                <select id="size" value={selectedSize} onChange={handleSizeChange}>
                    {Object.keys(sizePrices).map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
            <div className="product-quantity">
                <label>Số lượng:</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min="1"
                    max="5"
                />
            </div>
        </div>
    );

    // Product Tabs Component
    const ProductTabs = () => (
        <div className="information">
            <div className="info-tabs">
                {['description', 'policy', 'questions'].map((tab) => (
                    <div
                        key={tab}
                        className={`info-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </div>
                ))}
            </div>
            <div className="info-content">
                {productContent[activeTab].map((text, index) => (
                    <p key={index}>{text}</p>
                ))}
            </div>
        </div>
    );

    // Main return of ProductDetail component
    return (
        <div className="product-detail-container">
            <div className="product-breadcrumb">
                <a href="/">Trang Chủ</a> / <span>Chi Tiết Sản Phẩm</span>
            </div>

            <ProductImageCarousel />
            <ProductInfo />
            <ProductTabs />

            <div className="promotion-box">
                <div className="product-promotions">
                    <ul>
                        <li>Giảm đến 300K khi thanh toán bằng VNPAY-QR</li>
                        <li>Giảm 800.000VND cho đơn hàng từ 20.000.000 VND khi thanh toán qua VPBank</li>
                        <li>Ưu đãi thêm lên đến 1.5tr khi thanh toán bằng thẻ TECHCOMBANK</li>
                        <li>Tặng 01 trang sức khi mua hóa đơn từ 15.000.000 đ</li>
                    </ul>
                </div>
            </div>

            <div className="add-to-cart-container">
                <button className="buy-now">Mua ngay</button>
                <button className="add-to-cart">Thêm vào giỏ hàng</button>
            </div>
        </div>
    );
};

export default ProductDetail;
