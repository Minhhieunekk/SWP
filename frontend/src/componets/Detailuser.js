import React, { useEffect, useState, useLayoutEffect } from "react";
import { FaShoppingBag, FaUser, FaTag } from 'react-icons/fa';
import AppHeader from "./Header";
import axios from "axios";

const Detailuser = () => {
    const [user, setuser] = useState(null);
    const [formdata, setFormdata] = useState({
        username: '',
        phone: '',
        address: '',
        email: '',
        image: ''
    });
    const [file, setFile] = useState(null);

    const handleInput = (e) => {
        setFormdata(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Function to handle file selection
    const handleFile = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    // Function to handle the file upload
    const handleFileUpload = async (file) => {
        const formdata = new FormData();
        formdata.append('image', file);
        formdata.append('consumerid', user.consumerid); // Gửi consumerid tới backend

        try {
            const res = await axios.post('http://localhost:8088/upload', formdata);
            if (res.data.status === "true") {
                // Tạo đường dẫn tạm thời cho hình ảnh và tự động cập nhật
                const imageUrl = URL.createObjectURL(file);
                setFormdata(prev => ({
                    ...prev,
                    image: imageUrl // Cập nhật đường dẫn hình ảnh mới
                }));
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8088/updateuser', formdata)
            .then(res => {
                console.log("Profile updated successfully:", res.data);
            })
            .catch(err => {
                console.error("Error updating profile:", err);
            });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('http://localhost:8088/protected', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                axios.post('http://localhost:8088/checkuser', { username: res.data.username })
                    .then(response => {
                        if (response.data.exists) {
                            const userData = response.data.user;
                            setuser(userData);
                            setFormdata({
                                username: userData.username,
                                phone: userData.phone,
                                address: userData.address,
                                email: userData.email,
                                image: `http://localhost:8088/avatar/${userData.image_url}` // Đảm bảo đường dẫn hình ảnh chính xác
                            });
                        } else {
                            console.error("User not found");
                        }
                    })
                    .catch(error => {
                        console.error("Error checking user:", error);
                    });
            })
            .catch(err => {
                console.error("Error fetching protected data:", err);
            });
    }, []);

    
    useLayoutEffect(() => {
        if (file) {
            handleFileUpload(file); 
        }
    }, [file]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <AppHeader />
            <div className="container-fluid py-5" style={{ maxWidth: "1400px",position:"relative",top:"100px" }}>
                <div className="row gx-5">
                    <div className="col-lg-5 mb-5">
                        <div className="card shadow h-100">
                            <div className="card-body text-center p-5">
                                <div className="author-card-profile mb-4">
                                    <div className="author-card-avatar mb-4">
                                        <img
                                            src={formdata.image} // Đường dẫn hình ảnh từ state
                                            alt={formdata.username}
                                            className="rounded-circle img-thumbnail"
                                            style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                        />
                                    </div>
                                    {/* Input for file selection */}
                                    <input type="file" onChange={handleFile} style={{ display: 'none' }} id="fileInput" />
                                    {/* Single button for both choosing and uploading the image */}
                                    <button
                                        className="btn btn-outline-success"
                                        type="button"
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        Choose & Upload new image
                                    </button>
                                </div>
                                <div className="wizard">
                                    <nav className="list-group list-group-flush">
                                        <a className="list-group-item list-group-item-action d-flex align-items-center p-4" href="/detailuser">
                                            <FaUser className="me-3" size={24} />
                                            <span className="fs-5">Profile Settings</span>
                                        </a>
                                        <a className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-4" href="/">
                                            <div>
                                                <FaShoppingBag className="me-3 text-muted" size={24} />
                                                <span className="font-weight-medium fs-5">Orders List</span>
                                            </div>
                                        </a>
                                        <a className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-4" href="/">
                                            <div>
                                                <FaTag className="me-3 text-muted" size={24} />
                                                <span className="font-weight-medium fs-5">My Vouchers</span>
                                            </div>
                                        </a>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        <div className="card shadow h-100">
                            <div className="card-body p-5">
                                <h2 className="card-title mb-5">Profile Settings</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="account-fn" className="form-label fs-5">Username</label>
                                        <input name="username" value={formdata.username}
                                            className="form-control form-control-lg"
                                            type="text"
                                            id="account-fn" required
                                            onChange={handleInput} />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="account-email" className="form-label fs-5">Email</label>
                                        <input value={formdata.email}
                                            className="form-control form-control-lg"
                                            type="email"
                                            id="account-email" disabled />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="account-phone" className="form-label fs-5">Phone Number</label>
                                        <input name="phone" value={formdata.phone}
                                            className="form-control form-control-lg"
                                            type="text"
                                            id="account-phone" required
                                            onChange={handleInput} />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="account-address" className="form-label fs-5">Address</label>
                                        <input name="address" value={formdata.address}
                                            className="form-control form-control-lg"
                                            type="text"
                                            id="account-address" required
                                            onChange={handleInput} />
                                    </div>
                                    <hr className="my-5" />
                                    <div className="text-end">
                                        <button className="btn btn-outline-info btn-lg px-5 py-3 fs-5" type="submit">
                                            Update Profile
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Detailuser;
