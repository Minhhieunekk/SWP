import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';

const PasswordChangeForm = () => {
  const {consumerid}=useParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8088/resetpass', {
        newpass: newPassword,
        userid: consumerid
      });
      setMessage(response.data);
      if (response.data === "password reset successfully") {
        handleReset();
      }
    } catch (error) {
      setMessage('Error resetting password');
      console.error('Error:', error);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (

    <div className="container-fluid mt-5">
    
      <div className="justify-content-center">
        <div className="card">
          <div className="card-header bg-info text-white text-center">
            <h3 className="mb-0">Change Password</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="currentPassword" className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              {message && <div className="alert alert-info mb-3">{message}</div>}
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-success btn-lg">Change Password</button>
                <button type="button" className="btn btn-warning btn-lg" onClick={handleReset}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeForm;