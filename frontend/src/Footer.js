import React from 'react';
import './Footer.css'; // Import custom CSS

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-column">
                <h2>Logo</h2>
            </div>
            <div className="footer-column">
                
                <h3>Bạn cần hỗ trợ</h3>
                <p className="footer-support-number">123456789</p>
                <p>Địa chỉ: Ha Noi, THach That, Hoa Lac </p>
                <p>Email: somethingnghisau@gamil.com</p>
                <div className="footer-social-icons">
                    {/* Social media icons */}
                    <i className="fab fa-facebook"></i>
                   <i className="fab fa-twitter"></i>
                    <i className="fab fa-instagram"></i>
                    <i className="fab fa-youtube"></i>
                </div>
                <div className="footer-payment-icons">
                    {/* Payment method icons */}
                    <img src="/images/VPBank.png" alt="VPBank" />
                    <img src="/images/MBBank.png" alt="MBBank" />
                    <img src="/images/COD.png" alt="COD Pay" />
                    <img src="/images/visa.png" alt="Visa" />
                </div>
            </div>

            <div className="footer-column">
                <h3>Góc Thắc Mắc</h3>
                <ul>
                    <li><a href="/">Liên hệ Hotline: 123456789</a></li>
                    <li><a href="/">FaceBook</a></li>
                    <li><a href="/">Zalo</a></li>                   
                    <li><a href="/">Hướng dẫn sử dụng</a></li>
                </ul>
            </div>

            <div className="footer-column">
                <h3>Trung Tâm</h3>
                <ul>
                    <li><a href="/">Trang chủ</a></li>
                    <li><a href="/">Giới thiệu</a></li>
                    <li><a href="/">Danh mục</a></li>
                    <li><a href="/">Tin tức</a></li>
                    <li><a href="/">Liên hệ</a></li>
                    <li><a href="/">Hướng dẫn sử dụng</a></li>
                </ul>
            </div>
        </footer>
    );
};

export default Footer;
