import React, { useState, useEffect } from 'react';
import { Card, Modal, Button, Form } from 'react-bootstrap';
import { Edit, Trash, PlusCircle } from 'react-feather';
import '../styles/dashboard.scss'; 
import axios from "axios";
import { useParams } from 'react-router-dom';


const Cart = () => {
    const consumerId = localStorage.getItem('userId');
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedItems, setSelectedItems] = useState({}); // Track selected items
    const [totalPrice, setTotalPrice] = useState(0);


    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await axios.post(`http://localhost:8088/cart`,{userId : consumerId});
                console.log(response.data);
                if (response.data === "No item in cart") {
                    setCartItems([]);
                    setErrorMessage("No items in cart");
                } else {
                    setCartItems(response.data);
                    setErrorMessage('');
                }
            } catch (error) {
                console.error('Error fetching cart items', error);
                setErrorMessage('Error fetching cart items');
                setCartItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [consumerId]);

    const handleQuantityChange = (id, quantity, amount) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: Math.max(1, amount) } : item
            )
        );
    };

    const handleDeleteItem = (id) => {
        //aaaaaaaaaaaaa aa
        const confirmDelete = window.confirm("Ban co muon xoa mon nay khong?");
        if (confirmDelete) {
            axios.delete(`http://localhost:8088/removefromcart/${consumerId}/${id}`).then((res) => {
                console.log("Deleted successfully");
                let updatedCartList = cartItems.filter((item) => {
                return item.productid !== id;
                });
                setCartItems(updatedCartList);
            })
            .catch((err) => {
                console.log("Error occurred");
            });
        }
        // setCartItems((prevItems) => prevItems.filter((item) => item.productid !== id));
        // setSelectedItems((prev) => {
        //     const newSelected = { ...prev };
        //     delete newSelected[id];
        //     return newSelected;
        // });
    };

    const handleSelectItem = (id) => {
        setSelectedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // const calculateTotalPrice = () => {
    //     let total = 0;
    //     selectedItems.forEach(id => {
    //         const item = cartItems.find(item => item.id === id);
    //         if (item) {
    //             total += item.price * item.quantity;
    //         }
    //     });
    //     return total;
    // };

    // useEffect(() => {
    //     const total = calculateTotalPrice();
    //     setTotalPrice(total);
    // }, [selectedItems, cartItems]);

    const totalPricee = cartItems.reduce((total, item) => {
        return total + (selectedItems[item.productid] ? item.price * item.quantity : 0);
    }, 0);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Giỏ hàng của bạn</h1>
            <div className="container-xl">
            <div className="table-responsive">
            <div className="table-wrapper">
            <div className="table-title">
            {errorMessage && <div>{errorMessage}</div>}
            {cartItems.length === 0 && !errorMessage && <div>Hiện tại không có sản phẩm nào trong giỏ hàng</div>}
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" 
                                checked={selectedItems.length === cartItems.length} 
                                onChange={() => {
                                    if (selectedItems.length === cartItems.length) {
                                        console.log("aaaaaaaaaaaa");
                                        setSelectedItems([]);
                                    } else {
                                        console.log("bbbbbbbbbbbbbbbbbbb");
                                        setSelectedItems(cartItems.map(item => item.id));
                                    }
                                }} 
                            />
                        </th>
                        <th>Sản phẩm</th>
                        <th>Hình minh họa</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map((item) => (
                        <tr key={item.productid}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={!!selectedItems[item.productid]}
                                    onChange={() => handleSelectItem(item.productid)}
                                />
                            </td>
                            <td>{item.name}</td>
                            <td>
                                {/* <img src={item.image} alt={item.name} style={{ width: '50px' }} /> */}
                                <Card.Img
                                    variant="top"
                                    src={`/images/${item.image}`}
                                    alt={item.name}
                                    style={{ width: '70px' }}
                                    className="img-fluid"
                                    onLoad={() => console.log("Image loaded successfully")}
                                    onError={() => console.log("Image URL:", item.image)}
                                />
                            </td>
                            <td>
                                {item.price.toLocaleString()}
                            </td>
                            <td>
                            <input
                                    type="number"
                                    min="1"
                                    max={item.amount}
                                    value={item.quantity}
                                    onChange={e => {
                                        const newQuantity = Math.min(Math.max(parseInt(e.target.value), 1), item.amount);
                                        const newItems = cartItems.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
                                        setCartItems(newItems);
                                    }}
                                />
                            </td>
                            <td>{(item.price * item.quantity).toLocaleString()} VND</td>
                            <td>
                                <button onClick={() => handleDeleteItem(item.productid)}>Bỏ khỏi giỏ hàng</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {cartItems.length > 0 && (
                <div>
                    <h2>Tổng cộng: {totalPricee.toLocaleString()} VND</h2>
                    {/* <button onClick={handlePayment}>Thanh toán</button> */}
                    <button>Thanh toán</button>
                </div>
            )}
            </div>
            </div>
            </div>
            </div>
        </div>
    );
};

export default Cart;