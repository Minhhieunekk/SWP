import React from 'react';
import '../styles/footer.scss'; 

const Footer = () => {
    return (
        <footer className="footer-container" style={{position:"relative", top:"200px"}}>
            <div className="footer-column">
                <h3>Thông tin cửa hàng </h3>
                <p className="footer-support-number">Jewelry Online Shop</p>
                <p>Địa chỉ: Ha Noi, THach That, Hoa Lac </p>
                <p>Email: jewelryshop@gmail.com</p>
              
            </div>

            <div className="footer-column">
                <h3>Bạn cần hỗ trợ</h3>
                <ul>
                    <li><a href="/">Liên hệ Hotline: 0948086971</a></li>
                    <li><a href="/">Facebook</a></li>
                    <li><a href="/">Zalo</a></li>                   
                    <li><a href="/">Hướng dẫn sử dụng</a></li>
                </ul>
            </div>

            <div className="footer-column">
                <h3>Trung Tâm</h3>
                <ul>
                    <li><a href="/home">Trang chủ</a></li>
                    <li><a href="/">Giới thiệu</a></li>
                    <li><a href="/">Trang sức</a></li>
                    <li><a href="/blog">Tin tức</a></li>
                </ul>
            </div>
        </footer>
    );
};

export default Footer;
