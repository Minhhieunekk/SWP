import React, { useState, useEffect } from 'react';
import { Card, Modal, Button, Form } from 'react-bootstrap';
import { Edit, Trash, PlusCircle } from 'react-feather';
import '../styles/dashboard.scss'; 
import axios from "axios";
import { useParams } from 'react-router-dom';
import ImageAlertModal from "./ImageAlertModal";


const Cart = () => {
    const consumerId = localStorage.getItem('userId');
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedItems, setSelectedItems] = useState([]); // Track selected items
    const [totalPrice, setTotalPrice] = useState(0);
    const [userInfo, setUserInfo] = useState({});
    // const [paymentMethod, setPaymentMethod] = useState('');
    const [useDeffaultAdd, setUseDeffaultAdd] = useState(true)
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imgUrl, setImgUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');

    const openAlert = () => {
        setIsModalOpen(true);
    };

    const closeAlert = () => {
        setIsModalOpen(false);
    };


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

    const handleCheckboxChange = (item) => {
        // Ensure selectedItems is always treated as an array
        setSelectedItems(prevSelectedItems => {
            if (prevSelectedItems.includes(item.cartid)) {
                return prevSelectedItems.filter(id => id !== item.cartid);
            } else {
                return [...prevSelectedItems, item.cartid];
            }
        });
    };

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axios.post('http://localhost:8088/userInfomation', { userId: consumerId });
                setUserInfo(response.data[0]);
                setPhone(response.data[0].phone);
                setAddress(response.data[0].address);
                setEmail(response.data[0].email);
                console.log(response.data[0].phone)
                console.log(response.data[0].address);
                console.log(response.data[0].email);
                console.log(response.data[0]);
                console.log(address);
            } catch (error) {
                console.error('Error fetching user information', error);
            }
        };

        fetchUserInfo();
    }, [consumerId]);

    const handleDeleteItem = (id) => {
        //aaaaaaaaaaaaa aa
        const confirmDelete = window.confirm("Bạn có muốn xóa món đồ này không?");
        if (confirmDelete) {
            axios.delete(`http://localhost:8088/removefromcart/${id}`).then((res) => {
                console.log("Deleted successfully");
                let updatedCartList = cartItems.filter((item) => {
                return item.cartid !== id;
                });
                setCartItems(updatedCartList);
            })
            .catch((err) => {
                console.log("Error occurred");
            });
        }
        // setCartItems((prevItems) => prevItems.filter((item) => item.cartid !== id));
        // setSelectedItems((prev) => {
        //     const newSelected = { ...prev };
        //     delete newSelected[id];
        //     return newSelected;
        // });
    };

    const deleteSelectedItems = () => {
        console.log(selectedItems.length);
        if (selectedItems.length === 0) {
            alert('Không có sản phẩm nào được chọn');
            return;
        }

        const confirmDelete = window.confirm('Bạn có muốn xóa các món đã chọn không?');
        if (confirmDelete) {
            Promise.all(selectedItems.map(cartid => 
                axios.delete(`http://localhost:8088/removefromcart/${cartid}`)
            )).then(() => {
                setCartItems(cartItems.filter(item => !selectedItems.includes(item.cartid)));
                setSelectedItems([]);
            }).catch(error => {
                console.error('Error deleting selected items', error);
            });
        }
    };

    const handleSelectItem = (id) => {
        setSelectedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const calculateTotalPrice = () => {
        let total = 0;
        selectedItems.forEach(id => {
            const item = cartItems.find(item => item.cartid === id);
            if (item) {
                total += item.price * item.quantity;
            }
        });
        return total;
    };

    const handlePayment = async (paymentType) => {
        handleCheckout(paymentType);
        setIsPopupOpen(false);
        if (paymentType === 'cod') {
            setIsModalOpen(false)
        } else {
            setIsModalOpen(true);
        }
    };
    const beforeHandlePay = () => {
        console.log(selectedItems);
        if (selectedItems.length === 0) {
            alert('Không có sản phẩm nào được chọn');
            return;
        }
        setIsPopupOpen(true);
    };

    const handleCheckout =  (paymentType) => {
        const selectedItemsData = cartItems.filter(item => selectedItems.includes(item.cartid));
        const orderData = {
            userId: consumerId,
            total: totalPrice,
            phone: phone,
            address:  address,
            email: email,
            paymentStatus: paymentType === 'cod' ? 1 : 2,
            items: selectedItemsData.map(item => ({
                productId: item.productid,
                quantity: item.quantity,
                size: item.size // Assuming size is part of the cart item
            }))
        };
         axios.post('http://localhost:8088/order', orderData)
            .then(async response => {
                if (paymentType === 'cod') {
                    alert('Cảm ơn bạn đã đặt hàng');
                } else {
                    setImgUrl(`${response.data.imageUrl}`);
                    console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHH")
                    console.log(imgUrl) 
                    alert(`Payment URL: ${response.data.imageUrl}`);
                }
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
                        setSelectedItems([]);
                } catch (error) {
                    console.error('Error fetching cart items', error);
                    setErrorMessage('Error fetching cart items');
                    setCartItems([]);
                } finally {
                    setLoading(false);
                }
            })
            .catch(error => {
                console.error('Error placing order', error);
            });
    };

    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
      };
    
      const handleAddressChange = (e) => {
        setAddress(e.target.value);
      };
    
      const handleEmailChange = (e) => {
        setEmail(e.target.value);
      };

    useEffect(() => {
        const total = calculateTotalPrice();
        setTotalPrice(total);
    }, [selectedItems, cartItems]);

    // const totalPricee = cartItems.reduce((total, item) => {
    //     return total + (selectedItems[item.cartid] ? item.price * item.quantity : 0);
    // }, 0);

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
                                        setSelectedItems(cartItems.map(item => item.cartid));
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
                        <tr key={item.cartid}>
                            <td>
                                {/* <input
                                    type="checkbox"
                                    checked={!!selectedItems[item.cartid]}
                                    onChange={() => handleSelectItem(item.cartid)}
                                /> */}
                                <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.cartid)}
                                        onChange={() => handleCheckboxChange(item)}
                                    />
                            </td>
                            <td>
                                {item.name} <br></br>
                                Size: {item.size}
                                

                            </td>
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
                                        // Create a new cartItems array with the updated quantity
                                        const newCartItems = cartItems.map(i => 
                                            i.cartid === item.cartid ? { ...i, quantity: newQuantity } : i
                                        );
                                        setCartItems(newCartItems); // Update state with new cartItems array
                                    }}
                                />
                            </td>
                            <td>{(item.price * item.quantity).toLocaleString()} VND</td>
                            <td>
                                <button onClick={() => handleDeleteItem(item.cartid)}>Bỏ khỏi giỏ hàng</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {cartItems.length > 0 && (
                <div>
                    <h2>Tổng cộng: {totalPrice.toLocaleString()} VND</h2>
                    {/* <button onClick={handlePayment}>Thanh toán</button> */}
                    <button onClick={deleteSelectedItems}>Xóa nhiều</button>
                    <button onClick={() => beforeHandlePay()}>Thanh toán</button>
                    {isPopupOpen && (
                        <div className="popup">
                        <div className="container-xl">
                        <div className="table-responsive">
                        <div className="table-wrapper">
                        <div className="table-title">
                        <div className="row">
                            <h2>Chọn địa chỉ</h2>
                            <label>
                                <input
                                    type="radio"
                                    value="default"
                                    checked={useDeffaultAdd === true}
                                    onChange={() => setUseDeffaultAdd(true)}
                                />
                                Địa chỉ mặc định
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="other"
                                    checked={useDeffaultAdd === false}
                                    onChange={() => setUseDeffaultAdd(false)}
                                />
                                Địa chỉ khác
                            </label>
                            {useDeffaultAdd === true ? (
                                <div>
                                    <p>Điện thoại: {userInfo.phone === '' ? '0775667899':userInfo.phone} </p>
                                    <p>Địa chỉ: {userInfo.address === '' ? 'Hà Lội':userInfo.address}</p>
                                    <p>Email: {userInfo.email === '' ? 'chidechoinum1@gmail.com':userInfo.email}</p>
                                </div>
                            ) : (
                                <div>
                                    Điện thoại: <input type="text"  defaultValue={phone} onChange={handlePhoneChange}/>  <br></br>
                                    Địa chỉ: <input type="text"  defaultValue={address} onChange={handleAddressChange}/><br></br>
                                    Email: <input type="text"  defaultValue={email} onChange={handleEmailChange}/>
                                </div>
                            )}
                            <button onClick={() => {
                                handlePayment('cod');
                                // setPaymentMethod('cod');
                                // handleCheckout();
                                // setIsPopupOpen(false);
                            }}>Thanh toán COD</button>
                            <button onClick={() => {
                                handlePayment('online');
                                // setPaymentMethod('online');
                                // handleCheckout();
                                // setIsPopupOpen(false);
                                // setIsModalOpen(true);
                            }}>Thanh toán online</button>
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                    )}

                    <ImageAlertModal
                        isOpen={isModalOpen}
                        onClose={closeAlert}
                        message=""
                        imageUrl={imgUrl} // Replace with your image URL
                    />
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