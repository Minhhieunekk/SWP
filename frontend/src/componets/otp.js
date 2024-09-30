import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
const OTP = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8088/forgot-password', { email });
      setMessage(response.data);
      setStep(2);
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8088/reset-password', { email, otp, newPassword });
      setMessage(response.data);
      setStep(3);
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      {step === 1 && (
        <form onSubmit={handleRequestOTP}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Request OTP</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleResetPassword}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      )}
      {step === 3 && (
        <p>Password reset successful. You can now login with your new password.</p>
        
      )}
      {message && <p>{message}</p>}
      <Link to="/" className='linkreset'>Login now</Link>
    </div>
  );
};

export default OTP;