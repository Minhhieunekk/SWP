import React from "react";
import { FaShoppingBag, FaUser, FaTag, FaRegUser } from 'react-icons/fa';
import AppHeader from "./Header";
const Detailuser = () => {
    return (
        <>
        <AppHeader/>
        <div className="container-fluid py-5" style={{ maxWidth: "1400px" }}>
            <div className="row gx-5">
                <div className="col-lg-5 mb-5">
                    <div className="card shadow h-100">
                        <div className="card-body text-center p-5">
                            <div className="author-card-profile mb-4">
                                <div className="author-card-avatar mb-4">
                                    <img src="User-avatar.svg.png" alt="Daniel Adams" className="rounded-circle img-thumbnail" style={{ width: "200px", height: "200px", objectFit: "cover" }} />
                                </div>
                                <button class="btn btn-outline-success" type="button">Upload new image</button>

                            </div>
                            <div className="wizard">
                                <nav className="list-group list-group-flush">
                                    <a className="list-group-item list-group-item-action d-flex align-items-center p-4" href="#">
                                        <FaUser className="me-3" size={24} />
                                        <span className="fs-5">Profile Settings</span>
                                    </a>

                                    <a className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-4" href="#">
                                        <div>
                                            <FaShoppingBag className="me-3 text-muted" size={24} />
                                            <span className="font-weight-medium fs-5">Orders List</span>
                                        </div>
                                        {/* <span className="badge bg-secondary rounded-pill">6</span> */}
                                    </a>

                                    <a className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-4" href="#">
                                        <div>
                                            <FaTag className="me-3 text-muted" size={24} />
                                            <span className="font-weight-medium fs-5">My Vouchers</span>
                                        </div>
                                        {/* <span className="badge bg-secondary rounded-pill">4</span> */}
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
                            <form>
                                <div className="mb-4">
                                    <label htmlFor="account-fn" className="form-label fs-5">Username</label>
                                    <input className="form-control form-control-lg" type="text" id="account-fn" required />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="account-email" className="form-label fs-5">Email</label>
                                    <input className="form-control form-control-lg" type="email" id="account-email" disabled />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="account-phone" className="form-label fs-5">Phone Number</label>
                                    <input className="form-control form-control-lg" type="text" id="account-phone" required />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="account-address" className="form-label fs-5">Address</label>
                                    <input className="form-control form-control-lg" type="text" id="account-address" required />
                                </div>
                                <hr className="my-5" />
                                <div className="text-end">
                                    <button className="btn btn-outline-info btn-lg px-5 py-3 fs-5" type="button">
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
    )
    
}

export default Detailuser;