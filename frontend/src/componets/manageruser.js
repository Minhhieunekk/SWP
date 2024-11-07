import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Row, Col } from 'react-bootstrap';
import { Image } from 'antd';
import axios from 'axios';
import AppHeader from './Header';

const UserManagementComponent = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

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

    return (
        <>
            <AppHeader />
            <Container>
                <Col>
                    <Row className='mt-5'><h2 className='mt-5'>Quản lý người dùng</h2></Row>
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
                                        <td>{user.total_spent || 0} VND</td>
                                        <td>{user.total_products} sản phẩm</td>
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
        </>
    );
};

export default UserManagementComponent;