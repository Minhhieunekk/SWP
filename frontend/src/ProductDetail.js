import React, { useState } from 'react';
import './ProductDetail.css';
import Star from './Star';

const ProductDetail = () => {
    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description'); 
    const [selectedSize, setSelectedSize] = useState('S'); 
    const [productPrice, setProductPrice] = useState(23710000); 
    
    //Tạm thời fix cứng information. Đợi lấy từ data truyền vô nhé 
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

    const productDescription = [
        "Đây là mô tả sản phẩm chi tiết. Sản phẩm được làm từ nguyên liệu cao cấp và thiết kế tinh tế.",
        "Đây là mô tả sản phẩm chi tiết. Sản phẩm được làm từ nguyên liệu cao cấp và thiết kế tinh tế.",
        "Đây là mô tả sản phẩm chi tiết. Sản phẩm được làm từ nguyên liệu cao cấp và thiết kế tinh tế."
    ];
    const productPolicy =[
        "Chính sách bảo hành sản phẩm trong 12 tháng. Đổi trả hàng trong vòng 30 ngày.",
        "Chính sách bảo hành sản phẩm trong 12 tháng. Đổi trả hàng trong vòng 30 ngày.",
        "Chính sách bảo hành sản phẩm trong 12 tháng. Đổi trả hàng trong vòng 30 ngày."
    ] ;
    const productQuestions = [
        "Câu hỏi thường gặp: 1. Sản phẩm có bảo hành không? 2. Làm thế nào để đổi trả?",
        "Câu hỏi thường gặp: 1. Sản phẩm có bảo hành không? 2. Làm thế nào để đổi trả?",
        "Câu hỏi thường gặp: 1. Sản phẩm có bảo hành không? 2. Làm thế nào để đổi trả?"
    ] ;

    // Cập nhật số lượng sản phẩm khi người dùng thay đổi giá trị trong input
    const handleQuantityChange = (e) => {
        setQuantity(e.target.value);
    };

    // Cập nhật chỉ số ảnh chính khi người dùng nhấp vào một ảnh thu nhỏ
    const handleImageClick = (index) => {
        setMainImageIndex(index);
    };

    // Chuyển sang ảnh tiếp theo trong danh sách ảnh
    const handleNextImage = () => {
        setMainImageIndex((prevIndex) => (prevIndex + 1) % images.length); // Quay lại đầu danh sách nếu ở ảnh cuối
    };

    // Chuyển về ảnh trước đó trong danh sách ảnh
    const handlePrevImage = () => {
        setMainImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length); // Quay về cuối danh sách nếu ở ảnh đầu
    };

    // Cập nhật tab thông tin hiện tại khi người dùng nhấp vào tab
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // Cập nhật kích cỡ đã chọn và giá sản phẩm tương ứng khi người dùng thay đổi kích cỡ
    const handleSizeChange = (e) => {
        const size = e.target.value; // Lấy kích cỡ từ lựa chọn của người dùng
        setSelectedSize(size); // Cập nhật kích cỡ đã chọn
        setProductPrice(sizePrices[size]); // Cập nhật giá sản phẩm dựa trên kích cỡ đã chọn
    };

    return (
        <div className="product-detail-container">
            <div className="product-breadcrumb">
                <a href="/">Trang Chủ</a> / <span>Chi Tiết Sản Phẩm</span>
            </div>

            <div className="product-detail">
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

                <div className="product-info">
                    <h2 className="product-title">Dây chuyền Vàng trắng Ý 18K PNJ 0000W001351</h2>

                    <div className="star-rate">
                        <Star totalStars={5} />
                    </div>

                    <p className="product-price">{productPrice.toLocaleString()} đ</p>
                    <p className="product-installment">Chỉ cần trả 1.975.834 đ/tháng</p>
                    <p>(Giá sản phẩm thay đổi tùy trọng lượng vàng và đá) </p>
                    <p className="product-availability">Còn hàng</p>
                    <div className="product-size">
                        <label htmlFor="size">Chọn kích cỡ:</label>
                        <select id="size" value={selectedSize} onChange={handleSizeChange}>
                            <option value="S">Small</option>
                            <option value="M">Medium</option>
                            <option value="B">Big</option>
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
            </div>

            <div className="information">
                <div className="info-tabs">
                    <div 
                        className={`info-tab ${activeTab === 'description' ? 'active' : ''}`} 
                        onClick={() => handleTabClick('description')}
                    >
                        Mô tả sản phẩm
                    </div>
                    <div 
                        className={`info-tab ${activeTab === 'policy' ? 'active' : ''}`} 
                        onClick={() => handleTabClick('policy')}
                    >
                        Chính sách
                    </div>
                    <div 
                        className={`info-tab ${activeTab === 'questions' ? 'active' : ''}`} 
                        onClick={() => handleTabClick('questions')}
                    >
                        Câu hỏi
                    </div>
                </div>
                <div className="info-content">
                    {activeTab === 'description' && productDescription.map((desc, index) => (
                        <p key={index}>{desc}</p>
                    ))}
                    {activeTab === 'policy' && productPolicy.map((policy, index) => (
                        <p key={index}>{policy}</p>
                    ))}
                    {activeTab === 'questions' && productQuestions.map((question, index) => (
                        <p key={index}>{question}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
