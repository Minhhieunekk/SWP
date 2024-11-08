import React from 'react';
import '../styles/footer.scss'; 
import { Typography } from 'antd';
const {Link}=Typography
const Footer = () => {
    return (
        <footer className="footer-container" style={{position:"relative", top:"200px"}}>
            <div className="footer-column">
                <h3>Thông tin cửa hàng </h3>
                <p className="footer-support-number">Jewelry Online Shop</p>
                <p>Địa chỉ: 342 thôn 4, Thạch Hoà, Thạch Thất, Hà Nội </p>
                <p>Email: jewelryshop@gmail.com</p>
              
            </div>

            <div className="footer-column">
                <h3>Bạn cần hỗ trợ</h3>
                <ul>
                    <li>Liên hệ Hotline: <Link href="tel:0948086971" style={{color:'white'}}>0948086971</Link></li>
                    <li><a href="/https://zalo.me/g/gcrgqq630">Liên hệ</a></li> 
                    <li><a href="/chat">Tư vấn</a></li>                  
                    <li><a href="/">Hướng dẫn sử dụng</a></li>
                </ul>
            </div>

            <div className="footer-column">
                <h3>Trang sức</h3>
                <ul>
                    <li><a href="/gioithieu/1">Dây chuyền</a></li>
                    <li><a href="/gioithieu/2">Vòng tay</a></li>
                    <li><a href="/gioithieu/3">Nhẫn</a></li>
                    <li><a href="/gioithieu/4">Khuyên tai</a></li>
                </ul>
            </div>
        </footer>
    );
};

export default Footer;
