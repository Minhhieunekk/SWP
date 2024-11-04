import React, { useState, useEffect } from 'react';
import './Contact.css';

const Contact = () => {
    const [status, setStatus] = useState("Đã đóng cửa");
    const openingTime = "08:00"; 

    useEffect(() => {
        const updateStatus = () => {
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            const isOpen = currentHour >= 8 && currentHour < 18; // Example: open from 08:00 to 18:00

            if (isOpen) {
                setStatus("Đang mở cửa");
            } else {
                setStatus("Đã đóng cửa");
            }
        };

        updateStatus(); // Run once on mount
        const interval = setInterval(updateStatus, 60000); // Update every 60 seconds

        return () => clearInterval(interval); // Clean up interval on unmount
    }, []);

    return (
        <div className="contact-container">
            <div className="contact-card">
                <div className="contact-info">
                    <img src="/images/logo.png" alt="PNJ Logo" className="logo" />
                    <h1>Trang sức Nhóm 6 <span className="verified">✔️</span></h1>
                    <p>Mua sắm & Bán lẻ</p>
                    <a href="https://zalo.me/your-id" target="_blank" rel="noopener noreferrer" className="message-button">
                        Nhắn tin
                    </a>
                    <div className="details">
                        <p><strong>Địa chỉ:</strong> Thachj Thất, Hòa Lạc, FPT</p>
                        <p><strong>Điện thoại:</strong> <a href="tel:1800545457">1800545457</a></p>
                        <p><strong>Trạng thái:</strong> {status} • Mở cửa lúc {openingTime}</p>
                        <p><strong>Website:</strong> <a href="fgfg" target="_blank" rel="noopener noreferrer">fgfgf</a></p>
                    </div>
                    <p className="description">
                        Ngành nghề kinh doanh chính: Sản xuất kinh doanh trang sức bằng vàng, bạc, đá quý, phụ kiện thời trang, quà lưu niệm...
                    </p>
                </div>
                <div className="qr-code-section">
                    <img src="/images/QR-code.jpeg" alt="QR Code" className="qr-code" />
                    <p>Mở Zalo, bấm quét QR để quét và xem trên điện thoại</p>
                </div>
            </div>
        </div>
    );
};

export default Contact;