import React, { useState } from 'react'
import "../styles/login.scss"
import { IoLogoFacebook } from "react-icons/io";
import { FaGithub } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import Validation from './Loginvalidation';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppHeader from './Header';

const Login = () => {
	const [values,setValues] =useState(
		{
			username:'',
			password:''
		}
	)
	const navigate=useNavigate();
	const handlesubmit = (event) => {
		event.preventDefault();
		Validation(values);
		axios.post('http://localhost:8088/login', values)
			.then(res => {
				if (res.data.success) {
					localStorage.setItem('token', res.data.token);
					navigate('/');
				} else {
					alert("No user information");
				}
			})
			.catch(err => console.log(err));
	}

	const handleinput = (event) => {
		setValues(prev => ({...prev,[event.target.name]:event.target.value}))		
	}
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8088/auth/google';
  };
  const handleFacebookLogin=() => {
	window.location.href = 'http://localhost:8088/auth/facebook'
  }
  const handleGithubLogin = () => {
	window.location.href = 'http://localhost:8088/auth/github'
  }
	return (
		<>
		<AppHeader/>
			<div className="container" style={{position:'relative',top:'80px'}}>
				<div className="screen">
					<div className="screen__content">
					 	
						<form className="login" action='' onSubmit={handlesubmit}>
						<h3>Đăng nhập</h3>
							<div className="login__field">
								<i className="login__icon fas fa-user"></i>
								<input type="text" className="login__input" placeholder="Tên đăng nhập" onChange={handleinput} name='username'/>
								
							</div>
							<div className="login__field">
								<i classNameName="login__icon fas fa-lock"></i>
								<input type="password" className="login__input" placeholder="Mật khẩu" onChange={handleinput} name='password'  />
							</div>
							<button type='submit' className="button login__submit ">
								<span className="button__text">Đăng nhập ngay</span>
								<i className="button__icon fas fa-chevron-right"></i>
							</button>
							
							<Link to="/signup" className="button login__submit" >
								<span className="button__text">Đăng ký </span>
								<i className="button__icon fas fa-chevron-right"></i>
							</Link>
							<div className='forgotpass'>
							<Link to="/otp" className='linkreset'>Quên mật khẩu?</Link>
							</div>
						</form>

						<div className="social-login">
						<p style={{margin: 'auto'}}>Đăng nhập qua</p>
							<div className="social-icons">
							
								<div className="social-login__icon fab fa-facebook" onClick={handleFacebookLogin}><IoLogoFacebook /></div>
								<div className="social-login__icon fab fa-instagram" onClick={handleGithubLogin} ><FaGithub /></div>
								<div className="social-login__icon fab fa-twitter" onClick={handleGoogleLogin}><FaGoogle /></div>
							</div>
						</div>
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
export default Login