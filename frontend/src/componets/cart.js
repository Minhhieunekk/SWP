import React, { useState, useEffect } from 'react';

import '../styles/dashboard.scss'; 
import axios from "axios";



const Cart = () => {
    const consumerId = localStorage.getItem('consumerid');
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedItems, setSelectedItems] = useState({}); // Track selected items

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

    const totalPrice = cartItems.reduce((total, item) => {
        return total + (selectedItems[item.productid] ? item.price * item.quantity : 0);
    }, 0);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Your Cart</h1>
            {errorMessage && <div>{errorMessage}</div>}
            {cartItems.length === 0 && !errorMessage && <div>No items in cart</div>}
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Name</th>
                        <th>Image</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Delete</th>
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
                                <img src={item.image} alt={item.name} style={{ width: '50px' }} />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    min="1"
                                    max={item.amount}
                                    onChange={handleQuantityChange}
                                />
                            </td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                            <td>
                                <button onClick={() => handleDeleteItem(item.productid)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {cartItems.length > 0 && (
                <div>
                    <h2>Total Price: ${totalPrice.toFixed(2)}</h2>
                </div>
            )}
        </div>
    );
};

export default Cart;