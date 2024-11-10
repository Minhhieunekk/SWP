import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Row, Col, Button, Modal } from 'react-bootstrap';
import { Image } from 'antd';
import axios from 'axios';
import AppHeader from './Header';
import { useLocation } from 'react-router';
import {toast,Bounce} from 'react-toastify';

const UserManagementComponent = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [user, setUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUsername, setSelectedUsername] = useState(null);
    const [newRole, setNewRole] = useState(null); // Store new role

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8088/manageruser');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const totalPages = Math.ceil(users.length / usersPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleDelete = (userId, username) => {
        setSelectedUserId(userId);
        setSelectedUsername(username);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:8088/manageruser/${selectedUserId}`);
            setUsers(users.filter((user) => user.consumerid !== selectedUserId));
            setShowDeleteModal(false);
            toast.error('Đã xoá người dùng', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Bounce,
                });
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleChangeRole = (userId, username) => {
        const user = users.find((u) => u.consumerid === userId);
        const newRoleValue = user.admin === 0 ? 1 : 0;
        setSelectedUserId(userId);
        setSelectedUsername(username);
        setNewRole(newRoleValue);
        setShowChangeModal(true);
    };

    const confirmChangeRole = async () => {
        try {
            await axios.put(`http://localhost:8088/manageruser/${selectedUserId}`, { admin: newRole });
            setUsers(users.map((u) => u.consumerid === selectedUserId ? { ...u, admin: newRole } : u));
            setShowChangeModal(false);
            toast.success('Đổi quyền thành công', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Bounce,
                });
        } catch (error) {
            console.error('Error changing user role:', error);
        }
    };

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

    const location = useLocation();
    useEffect(() => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (!token && tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
            fetchUserData(tokenFromUrl);
        } else if (token) {
            fetchUserData(token);
        }
    }, [location.search]);

    return (
        <>
            {user?.admin === 1 && 
                <>
                    <AppHeader />
                    <Container style={{position:"relative",top:"80px"}}>
                        <Col>
                            <Row className='mt-5'>
                                <h2 className='mt-5'>Quản lý người dùng</h2>
                            </Row>
                            <Row>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Tên người dùng</th>
                                            <th>Số điện thoại</th>
                                            <th>Email</th>
                                            <th>Địa chỉ</th>
                                            <th>Ảnh đại diện</th>
                                            <th>Tổng tiền đã mua</th>
                                            <th>Tổng sản phẩm đã mua</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentUsers.map((user) => (
                                            <tr key={user.consumerid}>
                                                <td>{user.username}</td>
                                                <td>{user.phone}</td>
                                                <td>{user.email}</td>
                                                <td>{user.address}</td>
                                                <td>
                                                    {user.image_url && <Image width={50} src={`http://localhost:8088/avatar/${user.image_url}`} alt="avatar" />}
                                                </td>
                                                <td>{parseInt(user.total_spent).toLocaleString() || 0} VND</td>
                                                <td>{user.total_products} sản phẩm</td>
                                                <td>
                                                    <Button variant="outline-success" onClick={() => handleChangeRole(user.consumerid, user.username)} className="w-100">
                                                        Đổi quyền
                                                    </Button>
                                                    <Button variant="outline-danger" onClick={() => handleDelete(user.consumerid, user.username)} className="w-100">
                                                        Xoá
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Row>
                            <Row>
                                <Pagination>
                                    <Pagination.Prev
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    />
                                    {[...Array(totalPages).keys()].map((page) => (
                                        <Pagination.Item
                                            key={page + 1}
                                            active={page + 1 === currentPage}
                                            onClick={() => handlePageChange(page + 1)}
                                        >
                                            {page + 1}
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Next
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    />
                                </Pagination>
                            </Row>
                        </Col>
                    </Container>
                    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Xác nhận xoá người dùng</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Bạn có chắc chắn muốn xoá người dùng <strong>{selectedUsername}</strong>?
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                Hủy
                            </Button>
                            <Button variant="danger" onClick={confirmDelete}>
                                Xoá
                            </Button>
                        </Modal.Footer>
                    </Modal>
                    <Modal show={showChangeModal} onHide={() => setShowChangeModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Xác nhận đổi quyền</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Bạn có chắc chắn muốn đổi quyền của người dùng <strong>{selectedUsername}</strong>?
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowChangeModal(false)}>
                                Hủy
                            </Button>
                            <Button variant="success" onClick={confirmChangeRole}>
                                Chấp nhận
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            }
        </>
    );
};

export default UserManagementComponent;
