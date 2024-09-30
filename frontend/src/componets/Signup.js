import React, { useEffect, useState } from "react";
import "../styles/signup.scss"
import Validationsignup from "./Signupvalidation";
import axios from 'axios'

const Signup = () => {
	const [values,setValues] = useState ({
		username:'',
		password:'',
		phone:'',
		email:'',
		address:''
	})
	const [message, setMessage] = useState("");
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
	// const [isEmailAvailable,setIsEmailAvailable] = useState (true);
	// const [isPhoneAvailable,setIsPhoneAvailable] = useState (true);
	
	useEffect(() => {
        const checkUsername = async () => {
            if (values.username) {
                try {
                    const response = await axios.post('http://localhost:8088/checkuser', { username: values.username });
                    setIsUsernameAvailable(!response.data.exists);
                    setMessage(response.data.message);
                } catch (err) {
                    console.error("Error checking username:", err);
                    setMessage("Error checking username availability");
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            checkUsername();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [values.username]);

    const handleSignup = async (e) => {
        e.preventDefault();
        const validationErrors = Validationsignup(values) || {};
        if (Object.keys(validationErrors).length === 0 && isUsernameAvailable) {
            try {
                const response = await axios.post('http://localhost:8088/signup', values);
                console.log("Registration successful", response.data);
               
            } catch (err) {
                console.error("Registration error", err);
                setMessage("Registration failed. Please try again.");
            }
        } else {
            
            console.log("Validation errors:", validationErrors);
        }
    };

    const handleinput = (event) => {
        setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

	return (
		<>
			<div className="container">
				<div className="screen">
					<div className="screen__content">
						<form className="login" onSubmit={handleSignup}>
							<div className="login__field">
								<i className="login__icon fas fa-user"></i>
								<input type="text" className="login__input" placeholder="Username" onChange={handleinput} name="username" />
								{message && <span className={isUsernameAvailable ? "success" : "error"}>{message}</span>}
							</div>
							<div className="login__field">
								<i className="login__icon fas fa-lock"></i>
								<input type="password" className="login__input" placeholder="Password" onChange={handleinput} name="password"/>
							</div>
							<div className="login__field">
								<i className="login__icon fas fa-lock"></i>
								<input type="number" className="login__input" placeholder="Phone" onChange={handleinput} name="phone"/>
							</div>
							<div className="login__field">
								<i className="login__icon fas fa-lock"></i>
								<input type="email" className="login__input" placeholder="Email" onChange={handleinput} name="email"/>
							</div>
							<div className="login__field">
								<i className="login__icon fas fa-lock"></i>
								<input type="text" className="login__input" placeholder="Address" onChange={handleinput} name="address"/>
							</div>
							<button type="submit" className="button login__submit" disabled={!isUsernameAvailable}>
                                <span className="button__text">Sign up Now</span>
                                <i className="button__icon fas fa-chevron-right"></i>
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
	)
}

export default Signup