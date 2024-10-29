import React, { useEffect, useState } from "react";
import "../styles/signup.scss";
import Validationsignup from "./Signupvalidation";
import axios from 'axios';
import AppHeader from "./Header";
const Signup = () => {
    const [values, setValues] = useState({
        username: '',
        password: '',
        phone: '',
        email: '',
        address: ''
    });
    const [messages, setMessages] = useState({
        username: '',
        email: '',
        phone: ''
    });
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);

    // Check username
    useEffect(() => {
        const checkUsername = async () => {
            if (values.username) {
                try {
                    const response = await axios.post('http://localhost:8088/checkuser', { username: values.username });
                    setIsUsernameAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, username: response.data.message }));
                } catch (err) {
                    console.error("Error checking username:", err);
                    setMessages((prev) => ({ ...prev, username: "Error checking username availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            checkUsername();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [values.username]);

    // Check email
    useEffect(() => {
        const checkEmail = async () => {
            if (values.email) {
                try {
                    const response = await axios.post('http://localhost:8088/checkemail', { email: values.email });
                    setIsEmailAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, email: response.data.message }));
                } catch (err) {
                    console.error("Error checking email:", err);
                    setMessages((prev) => ({ ...prev, email: "Error checking email availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            checkEmail();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [values.email]);

    // Check phone
    useEffect(() => {
        const checkPhone = async () => {
            if (values.phone) {
                try {
                    const response = await axios.post('http://localhost:8088/checkphone', { phone: values.phone });
                    setIsPhoneAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, phone: response.data.message }));
                } catch (err) {
                    console.error("Error checking phone:", err);
                    setMessages((prev) => ({ ...prev, phone: "Error checking phone availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            checkPhone();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [values.phone]);

    const handleSignup = async (e) => {
        e.preventDefault();
        const validationErrors = Validationsignup(values) || {};
        if (Object.keys(validationErrors).length === 0 && isUsernameAvailable && isEmailAvailable && isPhoneAvailable) {
            try {
                const response = await axios.post('http://localhost:8088/signup', values);
                console.log("Registration successful", response.data);
            } catch (err) {
                console.error("Registration error", err);
                setMessages((prev) => ({ ...prev, general: "Registration failed. Please try again." }));
            }
        } else {
            console.log("Validation errors:", validationErrors);
        }
    };

    const handleInput = (event) => {
        setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    return (
        <>
        <AppHeader/>
        <div className="container" style={{position:'relative',top:'80px'}}>
            <div className="screen">
                <div className="screen__content">
                    <form className="login" onSubmit={handleSignup}>
                        <h3>Đăng ký</h3>
                        <div className="login__field">
                            <input type="text" className="login__input" placeholder="Tên đăng nhập" onChange={handleInput} name="username" />
                            {messages.username && <span className={isUsernameAvailable ? "success" : "error"}>{messages.username}</span>}
                        </div>
                        <div className="login__field">
                            <input type="password" className="login__input" placeholder="Mật khẩu" onChange={handleInput} name="password" />
                        </div>
                        <div className="login__field">
                            <input type="number" className="login__input" placeholder="Số điện thoại" onChange={handleInput} name="phone" /><br/>
                            {messages.phone && <span className={isPhoneAvailable ? "success" : "error"}>{messages.phone}</span>}
                        </div>
                        <div className="login__field">
                            <input type="email" className="login__input" placeholder="Email" onChange={handleInput} name="email" /><br/>
                            {messages.email && <span className={isEmailAvailable ? "success" : "error"}>{messages.email}</span>}
                        </div>
                        <div className="login__field">
                            <input type="text" className="login__input" placeholder="Địa chỉ" onChange={handleInput} name="address" />
                        </div>
                        <button type="submit" className="button login__submit" disabled={!isUsernameAvailable || !isEmailAvailable || !isPhoneAvailable}>
                            <span className="button__text">Đăng ký ngay</span>
                        </button>
                    </form>
                </div>
                <div className="screen__background">
                    <span className="screen__background__shape screen__background__shape4"></span>
                    <span className="screen__background__shape screen__background__shape3"></span>
                    <span className="screen__background__shape screen__background__shape2"></span>
                    <span className="screen__background__shape screen__background__shape1"></span>
                </div>
            </div>
        </div>
    
        </>
        );
};

export default Signup;
