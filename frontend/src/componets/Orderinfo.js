import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import axios from "axios";
import { Card, Table, Typography, Image, Space, Tag } from "antd";
import { Col } from 'react-bootstrap'
import AppHeader from "./Header";
const { Title, Text } = Typography;

const OrderInfo = () => {
    const location = useLocation();
    const { consumerid } = location.state || {}; 
    const [orderDetails, setOrderDetails] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8088/orderinfo/${consumerid}`)
            .then(res => setOrderDetails(res.data))
            .catch(err => console.error("Error fetching order details:", err));
    }, [consumerid]);

    // Payment status formatting function
    const renderPaymentStatus = (status) => {
        switch (status) {
            case 1:
                return <Tag color="green">Đã thanh toán</Tag>;
            case 2:
                return <Tag color="orange">Đang vận chuyển</Tag>;
            case 3:
                return <Tag color="blue">Đã nhận hàng</Tag>;
            default:
                return <Tag color="default">Trạng thái không xác định</Tag>;
        }
    };

    return (
        <>
            
       <AppHeader/>
        <div className="container py-5">
            <Col>
                <Title level={2} style={{ marginBottom: "20px", textAlign: "center" }}>
                    Lịch sử đơn hàng
                </Title>

                {orderDetails.length > 0 ? (
                    <Card bordered style={{ marginBottom: "20px" }} className="text-center">
                        <Table
                            dataSource={orderDetails}
                            rowKey="order_id"
                            bordered
                            pagination={false}
                        >
                            <Table.Column
                                title="Hình ảnh"
                                dataIndex="image"
                                key="image"
                                align="center"
                                render={image => (
                                    image ? (
                                        <Image
                                            src={`/images/${image}`}
                                            alt="product"
                                            width={50}
                                            height={50}
                                            style={{ objectFit: "cover", borderRadius: 4 }}
                                        />
                                    ) : null
                                )}
                            />
                            <Table.Column title="Tên sản phẩm" dataIndex="name" key="name" align="center" />
                            <Table.Column title="Kích cỡ sản phẩm" dataIndex="size" key="size" align="center" />
                            <Table.Column title="Số lượng" dataIndex="quantity" key="quantity" align="center" />
                            <Table.Column
                                title="Ngày mua hàng"
                                dataIndex="order_date"
                                key="order_date"
                                align="center"
                                render={date => new Date(date).toLocaleDateString()}
                            />
                            <Table.Column
                                title="Trạng thái thanh toán"
                                dataIndex="payment_status"
                                key="payment_status"
                                align="center"
                                render={renderPaymentStatus}
                            />
                            <Table.Column
                                title="Tổng tiền"
                                dataIndex="total"
                                key="total"
                                align="center"
                                render={total => (
                                    <Space>
                                        {total.toLocaleString()} VND
                                    </Space>
                                )}
                            />
                        </Table>
                    </Card>

                ) : (
                    <Card>
                        <Text strong>Không có thông tin đơn hàng</Text>
                    </Card>
                )}
            </Col>
        </div>
        </>
    );
};

export default OrderInfo;
