import React, { useEffect, useState } from 'react';
import '../styles/dashboard.scss';
import axios from 'axios';
import Modal from 'react-modal';

const paymentStatusLabels = {
  1: 'Chưa thanh toán',
  2: 'Đã thanh toán',
  3: 'Đang đóng hàng',
  4: 'Đang vận chuyển',
  5: 'Hoàn Thành',
};

const TrackingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(1); // Default status
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await axios.get('http://localhost:8088/orders');
      setOrders(response.data);
    };
    fetchOrders();
  }, []);

  const handleRowClick = async (orderId, currentPaymentStatus) => {
    const response = await axios.get(`http://localhost:8088/orders/${orderId}/items`);
    setSelectedOrderItems(response.data);
    setSelectedOrderId(orderId);
    setPaymentStatus(currentPaymentStatus);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    await axios.put(`http://localhost:8088/orders/${selectedOrderId}`, { paymentStatus });
    setIsModalOpen(false);
    // Optionally refresh the orders list
    const response = await axios.get('http://localhost:8088/orders');
    setOrders(response.data);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="container-xl">
    <div className="table-responsive">
    <div className="table-wrapper">
    <div className="table-title">
    <div className="row">
    {/* <div className="col-sm-6"> */}
      <h1>Theo dõi đơn hàng</h1>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Tên người đặt hàng</th>
            <th>Số tiền</th>
            <th>Ngày đặt hàng</th>
            <th>Trạng thái đơn hàng</th>
            <th>SĐT người nhận</th>
            <th>Địa chỉ</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.order_id} onClick={() => handleRowClick(order.order_id, order.payment_status)}>
              <td>{order.order_id}</td>
              <td>{order.username}</td>
              <td>{(order.total * 1).toLocaleString()}</td>
              <td>{new Date(order.order_date).toLocaleDateString()}</td>
              <td>{paymentStatusLabels[order.payment_status]}</td> {/* Display label */}
              <td>{order.phone}</td>
              <td>{order.address}</td>
              <td>{order.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen} onRequestClose={handleClose} ariaHideApp={false}>
        <div className="container-xl">
        <div className="table-responsive">
        <div className="table-wrapper">
        <div className="table-title">
        <div className="row">
        <h2>Chi tiết đơn hàng</h2>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Ảnh</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrderItems.map(item => (
              <tr key={item.order_item_id}>
                <td>{item.name}</td>
                <td><img src={item.image} alt={item.name} style={{ width: '100px' }} /></td>
                <td>{item.size}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div>
          {/* <h3>Total: {total}</h3> */}
          <label>
            Trạng thái đơn hàng:
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(Number(e.target.value))}>
              <option value={1}>Chưa thanh toán</option>
              <option value={2}>Đã thanh toán</option>
              <option value={3}>Đang đóng hàng</option>
              <option value={4}>Đang vận chuyển</option>
              <option value={5}>Hoàn Thành</option>
            </select>
          </label>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleClose}>Close</button>
        </div>
        </div>
        </div>
        </div>
      </Modal>
    </div>
    </div>
    </div>
    </div>
    </div>
    // </div>
  );
};

export default TrackingOrder;