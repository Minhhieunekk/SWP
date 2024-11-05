import React, { useEffect, useState } from 'react';
import '../styles/dashboard.scss';
import '../styles/order.css';
import axios from 'axios';
import Modal from 'react-modal';

const paymentStatusLabels = {
  0: 'Hủy',
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

  const [modifiedItems, setModifiedItems] = useState([]);  // To track modified or deleted items
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    column: 'order_date',    // Column to sort by (e.g., 'order_id', 'username', etc.)
    direction: 'DESC', // 'ASC' or 'DESC'
  });

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '-1',
    numberPerPage: 10,
  });

  const fetchOrders = async () => {
    const response = await axios.get('http://localhost:8088/orders', {
      params: {
        ...filters,
        page: currentPage,
        sortColumn: sortConfig.column,
        sortDirection: sortConfig.direction,
      },
    });
    setOrders(response.data.orders);
    setTotalPages(response.data.totalPages);
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, currentPage, sortConfig]);

  // Toggle sort direction when clicking the column
  const handleSort = (column) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.column === column) {
        // If the same column is clicked, toggle the direction
        return {
          column,
          direction: prevConfig.direction === 'ASC' ? 'DESC' : 'ASC',
        };
      } else {
        // If a new column is clicked, default to ascending order
        return {
          column,
          direction: 'ASC',
        };
      }
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handlePagination = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 0:
        return 'status-red'; // Red for 'Hủy'
      case 5:
        return 'status-green'; // Green for 'Hoàn Thành'
      case 1:
      case 2:
        return ''; // No class for 'Chưa thanh toán' and 'Đã thanh toán'
      default:
        return 'status-orange'; // Orange for other statuses
    }
  };

  // useEffect(() => {
  //   const fetchOrders = async () => {
  //     const response = await axios.get('http://localhost:8088/orders');
  //     setOrders(response.data);
  //   };
  //   fetchOrders();
  // }, []);

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

  ////////////////
  ////////////////
  // Update item quantity in local state (track changes)
  const updateItemQuantity = (orderItemId, newQuantity) => {
    setModifiedItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.order_item_id !== orderItemId);
      updatedItems.push({ order_item_id: orderItemId, newQuantity });
      return updatedItems;
    });
  };

  // Mark item for deletion (do not delete immediately)
  const markItemForDeletion = (orderItemId) => {
    setModifiedItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.order_item_id !== orderItemId);
      updatedItems.push({ order_item_id: orderItemId, deleted: true });
      return updatedItems;
    });
  };

  // Save changes (commit the changes to the database)
  const saveChanges = async () => {
    try {
      for (const modifiedItem of modifiedItems) {
        if (modifiedItem.newQuantity !== undefined) {
          // Update item quantity in the database
          await axios.put('http://localhost:8088/order-item/quantity', { orderItemId: modifiedItem.order_item_id, newQuantity: modifiedItem.newQuantity });
        }
        if (modifiedItem.deleted) {
          // Delete item from the database
          await axios.delete(`http://localhost:8088/order-item/${modifiedItem.order_item_id}`);
        }
      }
      alert('Changes saved successfully!');
      setModifiedItems([]); // Clear the modified items
      handleRowClick(selectedOrderId); // Refresh order details
    } catch (error) {
      alert('Error saving changes');
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      const response = await axios.put('http://localhost:8088/order/payment-status', { orderId: selectedOrderId, status });
      alert(response.data.message);
      setPaymentStatus(status);
    } catch (error) {
      alert('Error updating payment status');
    }
  };
  ////////////////
  ////////////////


  const handleClose = () => {
    setIsModalOpen(false);
    fetchOrders();
  };

  return (
    <div className="container-xl">
    <div className="table-responsive">
    <div className="table-wrapper">
    <div className="table-title">
    <div className="row">
    {/* <div className="col-sm-6"> */}
      <h1>Theo dõi đơn hàng</h1>

      <div>
        <label>Từ ngày:</label>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <label>đến ngày:</label>
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <label>Trạng thái đơn hàng:</label>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="-1">Tất cả</option>
          <option value="0">Hủy</option>
          <option value="1">Chưa thanh toán</option>
          <option value="2">Đã thanh toán</option>
          <option value="3">Đang đóng hàng</option>
          <option value="4">Đang vận chuyển</option>
          <option value="5">Hoàn Thành</option>
        </select>
        <label>Số lượng đơn hàng 1 trang:</label>
        <select
          name="numberPerPage"
          value={filters.numberPerPage}
          onChange={handleFilterChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th onClick={() => handleSort('order_id')}>Mã đơn hàng</th>
            <th onClick={() => handleSort('username')}>Tên người đặt hàng</th>
            <th onClick={() => handleSort('total')}>Số tiền</th>
            <th onClick={() => handleSort('order_date')}>Ngày đặt hàng</th>
            <th onClick={() => handleSort('payment_status')}>Trạng thái đơn hàng</th>
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
              <td className={getStatusClass(order.payment_status)}>{paymentStatusLabels[order.payment_status]}</td> {/* Display label */}
              <td>{order.phone}</td>
              <td>{order.address}</td>
              <td>{order.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          onClick={() => handlePagination('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePagination('next')}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

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
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrderItems.map(item => (
              <tr key={item.order_item_id}>
                <td>{item.name}</td>
                <td><img src={item.image} alt={item.name} style={{ width: '100px' }} /></td>
                <td>{item.size}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>
                  <button onClick={() => markItemForDeletion(item.order_item_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div>
          {/* <h3>Total: {total}</h3> */}
          <label>
            Trạng thái đơn hàng: {paymentStatusLabels[paymentStatus]}
            {paymentStatus === 1 || paymentStatus === 2 ? (
              <button onClick={() => updateOrderStatus(3)}>Đến bước đóng hàng</button>
            ) : paymentStatus === 3 ? (
              <button onClick={() => updateOrderStatus(4)}>Đến bước vận chuyển</button>
            ) : paymentStatus === 4 ? (
              <button onClick={() => updateOrderStatus(5)}>Hoàn thành đơn hàng</button>
            ) : null}

            {paymentStatus !== 0 && paymentStatus !== 5&& (
              <button onClick={() => updateOrderStatus(0)}>Hủy</button>
            )}
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