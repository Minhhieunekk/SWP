import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import axios from "axios";
import { Card, Table, Typography, Image, Space, Tag, DatePicker, Row, Button, Modal, Input, Rate, Form, message } from "antd";
import { Col } from 'react-bootstrap';
import AppHeader from "./Header";
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const OrderInfo = () => {
    const location = useLocation();
    const { consumerid } = location.state || {};
    const [orderDetails, setOrderDetails] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        axios.get(`http://localhost:8088/orderinfo/${consumerid}`)
            .then(res => {
                setOrderDetails(res.data);
                setFilteredOrders(res.data);
            })
            .catch(err => console.error("Error fetching order details:", err));
    }, [consumerid]);

    const handleDateChange = (dates) => {
        setDateRange(dates);
    };

    useEffect(() => {
        if (dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf("day").valueOf();
            const end = dateRange[1].endOf("day").valueOf();
            setFilteredOrders(orderDetails.filter(order => {
                const orderDate = new Date(order.order_date).getTime();
                return orderDate >= start && orderDate <= end;
            }));
        } else {
            setFilteredOrders(orderDetails);
        }
    }, [dateRange, orderDetails]);

    const renderPaymentStatus = (status) => {
        switch (status) {
            case 0: return <Tag color="green">Chưa thanh toán</Tag>;
            case 1: return <Tag color="orange">Đã thanh toán</Tag>;
            default: return <Tag color="default">Trạng thái không xác định</Tag>;
        }
    };

    const renderOrderStatus = (status) => {
        switch (status) {
            case 0: return <Tag color="red">Đã hủy</Tag>;
            case 1: return <Tag color="blue">Chờ xác nhận</Tag>;
            case 2: return <Tag color="cyan">Đã xác nhận</Tag>;
            case 3: return <Tag color="purple">Đang chuẩn bị hàng</Tag>;
            case 4: return <Tag color="orange">Đang giao hàng</Tag>;
            case 5: return <Tag color="green">Đã giao hàng</Tag>;
            case 6: return <Tag color="volcano">Giao hàng thất bại</Tag>;
            default: return <Tag color="default">Trạng thái không xác định</Tag>;
        }
    };

    const handleRowClick = (order) => {
        if (order.order_status === 5) { 
            console.log("Selected order:", order);
            setSelectedProduct(order);
            setIsModalVisible(true);
        }
    };

    const handleFeedbackSubmit = async (values) => {
        const feedbackData = {
            user_id: consumerid,
            product_id: selectedProduct.productid,
            rate: values.rate,
            feedback: values.feedback
        };

        try {
            await axios.post("http://localhost:8088/submitFeedback", feedbackData);
            message.success("Feedback submitted successfully!");
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            message.error("Error submitting feedback.");
        }
    };

    return (
        <>
            <AppHeader />
            <div className="container py-5" style={{ position: 'relative', top: "100px" }}>
                <Col>
                    <Title level={1} style={{ marginBottom: "20px", textAlign: "center" }}>Lịch sử đơn hàng</Title>

                    <Row justify="center" style={{ marginBottom: "20px" }}>
                        <Space direction="horizontal">
                            <RangePicker onChange={handleDateChange} />
                            <Button type="primary" onClick={() => setDateRange([null, null])}>Xóa bộ lọc</Button>
                        </Space>
                    </Row>

                    {filteredOrders.length > 0 ? (
                        <Card bordered style={{ marginBottom: "20px" }} className="text-center">
                            <Table
                                dataSource={filteredOrders}
                                rowKey="order_id"
                                bordered
                                pagination={false}
                                onRow={(record) => ({
                                    onClick: () => handleRowClick(record),
                                })}
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
                                    title="Trạng thái đơn hàng"
                                    dataIndex="order_status"
                                    key="order_status"
                                    align="center"
                                    render={renderOrderStatus}
                                />
                                <Table.Column
                                    title="Tổng tiền"
                                    dataIndex="total"
                                    key="total"
                                    align="center"
                                    render={total => (
                                        <Space>
                                            {parseInt(total).toLocaleString()} VND
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

                <Modal
                    title="Đánh giá sản phẩm"
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form form={form} onFinish={handleFeedbackSubmit}>
                        <Form.Item>
                            <Image
                                src={`/images/${selectedProduct?.image}`}
                                alt="product"
                                width={100}
                                height={100}
                            />
                            <Title level={4}>{selectedProduct?.name}</Title>
                        </Form.Item>
                        <Form.Item name="rate" label="Đánh giá" rules={[{ required: true, message: "Vui lòng chọn đánh giá sao!" }]}>
                            <Rate allowClear />
                        </Form.Item>
                        <Form.Item name="feedback" label="Phản hồi" rules={[{ required: true, message: "Vui lòng nhập feedback!" }]}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">Gửi feedback</Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
};

export default OrderInfo;
