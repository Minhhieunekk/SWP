import React, { useEffect, useState } from 'react';
import '../styles/dashboard.scss';
import '../styles/order.scss';
import axios from 'axios';
import Modal from 'react-modal';
import AppHeader from './Header';

const orderStatusLabels = {
  0: 'Hủy',
  1: 'Đã nhận đơn hàng',
  2: 'Đang đóng hàng',
  3: 'Đang vận chuyển',
  4: 'Hoàn Thành',
};

const TrackingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(1); // Default status
  const [orderStatus, setOrderStatus] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [modifiedItems, setModifiedItems] = useState([]);  // To track modified or deleted items
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newTotal, setNewTotal] = useState(0);
  const [oldTotal, setOldTotal] = useState(0);
  const [newListItem, setNewListItem] = useState(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    column: 'order_date',    // Column to sort by (e.g., 'order_id', 'username', etc.)
    direction: 'DESC', // 'ASC' or 'DESC'
  });

  const [user, setUser] = useState(null);

const fetchUserData = async (token) => {
  try {
    
    const res = await axios.get('http://localhost:8088/api/user/details', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUser(res.data);
       
  } catch (err) {
    console.error('Error fetching user data:', err);
   
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      
    }
  }
};

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

  const [orderCounts, setOrderCounts] = useState({
    not_paid: 0,
    paid: 0,
    received: 0,
    packaging: 0,
    shipping: 0,
    done: 0,
    cancel: 0,
  });

  const fetchOrderStatus = async () => {
    const response = await axios.get('http://localhost:8088/order-status-counts', {
      params: {
        start_date: filters.startDate,
        end_date: filters.startDate,
      },
    });
    setOrderCounts(response.data);
    console.log(response.data);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetchUserData(token);
    fetchOrders();
    fetchOrderStatus();
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

  const handleRowClick = async (orderId, currentPaymentStatus, oldTotal, currentOrderStatus) => {
    const response = await axios.get(`http://localhost:8088/orders/${orderId}/items`);
    setSelectedOrderItems(response.data);
    setNewListItem(response.data);
    setSelectedOrderId(orderId);
    setPaymentStatus(currentPaymentStatus);
    setOrderStatus(currentOrderStatus);
    setOldTotal(oldTotal);
    setNewTotal(oldTotal);
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
    if (newQuantity === 0) {
      const confirmDelete = window.confirm("Bạn có muốn xóa món đồ này không?");
      if (confirmDelete) {
        setModifiedItems(prevItems => {
          const updatedItems = prevItems.filter(item => item.order_item_id !== orderItemId);
          updatedItems.push({ order_item_id: orderItemId, deleted: true });
          return updatedItems;
        });
        console.log ('updatedItemsupdatedItems');
        console.log (modifiedItems);
        selectedOrderItems.forEach(element => {
          if(element.order_item_id === orderItemId) element.quantity = newQuantity;
        });
        let updatedItems1 = selectedOrderItems.filter(element => element.order_item_id !== orderItemId);
        setSelectedOrderItems(updatedItems1);
        console.log('ggggggggggggggggggggggg')
        console.log(updatedItems1);
        const newprice = calculateTotalPrice();
        setNewTotal(newprice);
      } else {
        // selectedOrderItems.forEach(element => {
        //   if(element.order_item_id === orderItemId) element.quantity = newQuantity;
        // });
      }
    } else {
      setModifiedItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.order_item_id !== orderItemId);
        updatedItems.push({ order_item_id: orderItemId, newQuantity });
        return updatedItems;
      });
      selectedOrderItems.forEach(element => {
        if(element.order_item_id === orderItemId) element.quantity = newQuantity;
      });
      const newprice = calculateTotalPrice();
      setNewTotal(newprice);
    }
    
    // const newCartItems = selectedOrderItems.map(i => 
    //   i.order_item_id === orderItemId ? { ...i, quantity: newQuantity } : i.quantity
    // );
    // selectedOrderItems.forEach(element => {
    //   if(element.order_item_id === orderItemId) element.quantity = newQuantity;
    // });
    // newListItem.forEach(element => {
    //   if(element.order_item_id === orderItemId) element.quantity = newQuantity;
    // });
    // if (newQuantity === 0) {

    // }
    
  };

  // Mark item for deletion (do not delete immediately)
  const markItemForDeletion = (orderItemId) => {
    setModifiedItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.order_item_id !== orderItemId);
      updatedItems.push({ order_item_id: orderItemId, deleted: true });
      return updatedItems;
    });
    const tempList2 = selectedOrderItems.filter(element => element.order_item_id !== orderItemId);
    setSelectedOrderItems(tempList2);
    const newprice = calculateTotalPrice();
    setNewTotal(newprice);
    console.log(modifiedItems);
    
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
      const abcde = await axios.put('http://localhost:8088/orders/updateTotal', { orderId:selectedOrderId, newTotal: newTotal });
      console.log('updateeeeeeeeeeeeeeeeeeeeeeeee');
      console.log(abcde.data);  
      console.log(abcde);
      console.log(selectedOrderId);
      console.log(newTotal);
      alert('Đã lưu thay đổi!');
      setModifiedItems([]); // Clear the modified items
      setOldTotal(newTotal);
      setNewTotal(0);
      handleRowClick(selectedOrderId, paymentStatus, oldTotal, orderStatus); // Refresh order details
    } catch (error) {
      console.log('errrrrrrrr');
      console.log(error);
      alert('Error saving changes');
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      const response = await axios.put('http://localhost:8088/order/order-status', { orderId: selectedOrderId, status });
      alert(response.data.message);
      setOrderStatus(status);
    } catch (error) {
      alert('Error updating payment status');
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;
    console.log('listttttttt');
    console.log(selectedOrderItems);
    console.log(newListItem);
    selectedOrderItems.forEach(item => {
        if (item) {
            total += item.price * item.quantity;
        }
    });
    return total;
};
  ////////////////
  ////////////////


  const handleClose = () => {
    setIsModalOpen(false);
    setModifiedItems([]);
    setNewTotal(0);
    fetchOrders();
  };

  return (
    <>
    <AppHeader username={user?.username} consumerid={user?.consumerid} password={user?.password} />
    <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
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

      <div className="count-all-status">
        <div className="status-row">
          <div className="status-item">
            <span className="status-label">Not Paid:</span>
            <span className="status-count">{orderCounts.not_paid}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Paid:</span>
            <span className="status-count">{orderCounts.paid}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Received:</span>
            <span className="status-count">{orderCounts.received}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Packaging:</span>
            <span className="status-count">{orderCounts.packaging}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Shipping:</span>
            <span className="status-count">{orderCounts.shipping}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Done:</span>
            <span className="status-count">{orderCounts.done}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Cancelled:</span>
            <span className="status-count">{orderCounts.cancel}</span>
          </div>
        </div>
      </div>

      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th onClick={() => handleSort('order_id')}>Mã đơn hàng</th>
            <th onClick={() => handleSort('username')}>Tên người đặt hàng</th>
            <th onClick={() => handleSort('total')}>Số tiền</th>
            <th onClick={() => handleSort('order_date')}>Ngày đặt hàng</th>
            <th onClick={() => handleSort('payment_status')}>Thanh toán</th>
            <th onClick={() => handleSort('order_status')}>Trạng thái đơn hàng</th>
            <th>SĐT người nhận</th>
            <th>Địa chỉ</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.order_id} onClick={() => handleRowClick(order.order_id, order.payment_status, order.total, order.order_status)}>
              <td>{order.order_id}</td>
              <td>{order.username}</td>
              <td>{(order.total * 1).toLocaleString()} VND</td>
              <td>{new Date(order.order_date).toLocaleDateString()}</td>
              <td> {order.payment_status === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
              <td className={getStatusClass(order.order_status)}>{orderStatusLabels[order.order_status]}</td> {/* Display label */}
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
          Trang trước
        </button>
        <span>
          Trang {currentPage} trên {totalPages}
        </span>
        <button
          onClick={() => handlePagination('next')}
          disabled={currentPage === totalPages}
        >
          Trang sau
        </button>
      </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    

      <Modal isOpen={isModalOpen} onRequestClose={handleClose} ariaHideApp={false}>
      <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
        <div className="container-xl">
        <div className="table-responsive">
        <div className="table-wrapper">
        <div className="table-title">
        <div className="row">
          
        <h2>Chi tiết đơn hàng</h2>
        <p>Giá trị đơn hàng: {oldTotal}</p>
        {/* { modifiedItems.length !==0 ? <p>Giá trị đơn hàng nếu cập nhật: {newTotal}</p> : null} */}
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Ảnh</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrderItems.map(item => (
              <tr key={item.order_item_id}>
                <td>{item.name}</td>
                <td><img src={item.image} alt={item.name} style={{ width: '100px' }} /></td>
                <td>{item.size}</td>
                <td>{item.quantity}</td>
                <td>{(item.price*1).toLocaleString()} VND</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div>
          {/* <h3>Total: {total}</h3> */}
          <label>
            Trạng thái đơn hàng: {orderStatusLabels[orderStatus]}
            {orderStatus === 1 || orderStatus === 2 ? (
              <button onClick={() => updateOrderStatus(3)}>Đến bước đóng hàng</button>
            ) : orderStatus === 3 ? (
              <button onClick={() => updateOrderStatus(4)}>Đến bước vận chuyển</button>
            ) : orderStatus === 4 ? (
              <button onClick={() => updateOrderStatus(5)}>Hoàn thành đơn hàng</button>
            ) : null}

            {orderStatus !== 0 && orderStatus !== 5&& (
              <button onClick={() => updateOrderStatus(0)}>Hủy đơn hàng</button>
            )}
          </label>
        </div>
        <button onClick={saveChanges}>Lưu</button>
        <button onClick={handleClose}>Đóng</button>
        </div>
        </div>
        </div>
        </div>
      </Modal>
    </>
  );
};

export default TrackingOrder;