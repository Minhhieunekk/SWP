import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider } from 'antd';
import { Image, Button } from 'react-bootstrap';
import { PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import AppHeader from './Header';
const { Title, Paragraph, Text, Link } = Typography;

const Contact = () => {
    const [status, setStatus] = useState("Đã đóng cửa");
    const openingTime = "08:00"; 

    useEffect(() => {
        const updateStatus = () => {
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            const isOpen = currentHour >= 8 && currentHour < 18; 

            if (isOpen) {
                setStatus("Đang mở cửa");
            } else {
                setStatus("Đã đóng cửa");
            }
        };

        updateStatus(); 
        const interval = setInterval(updateStatus, 60000); 

        return () => clearInterval(interval); 
    }, []);

    return (
        <>
        <AppHeader/>
        <div className="d-flex justify-content-center align-items-center p-4" style={{position:'relative',top:'150px'}}>
       
            <Card style={{ width: 500 }} bordered>
                <div className="text-center mb-4">
                    <Image src="logoshop.png" alt="PNJ Logo" className="mb-3" roundedCircle style={{ width: '100px' }} />
                    <Title level={2}>Trang sức Nhóm 6 <CheckCircleOutlined style={{ color: 'green' }} /></Title>
                    <Text type="secondary">Mua sắm & Bán lẻ</Text>
                </div>
                
                <Divider />

                <div className="text-center">
                    <Button variant='outline-success' href="https://zalo.me/g/gcrgqq630" target="_blank" rel="noopener noreferrer">
                        Nhắn tin
                    </Button>
                </div>

                <Divider />

                <div className="details">
                    <Paragraph><strong>Địa chỉ:</strong> Thạch Thất, Hòa Lạc, FPT</Paragraph>
                    <Paragraph>
                        <strong>Điện thoại:</strong> <Link href="tel:1800545457"><PhoneOutlined /> 0948086971</Link>
                    </Paragraph>
                    <Paragraph><strong>Trạng thái:</strong> {status} • Mở cửa lúc {openingTime}</Paragraph>
                    <Paragraph>
                        <strong>Website:</strong> <Link href="/" target="_blank" rel="noopener noreferrer">Shop trang sức jewelry</Link>
                    </Paragraph>
                </div>

                <Divider />

                <Paragraph className="text-center" style={{ fontStyle: 'italic' }}>
                    Ngành nghề kinh doanh chính: Sản xuất kinh doanh trang sức bằng vàng, bạc, đá quý, phụ kiện thời trang, quà lưu niệm...
                </Paragraph>

                <Divider />

                <div className="text-center">
                    <Image src="images\zaloqr.jpg" alt="QR Code" style={{ width: '150px' }} />
                    <Paragraph> Mở Zalo, bấm quét QR để quét và xem trên điện thoại </Paragraph>
                </div>
            </Card>
        </div>
        </>
    );
};

export default Contact;
