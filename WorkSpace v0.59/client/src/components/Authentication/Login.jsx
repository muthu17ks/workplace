import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();

  const getQueryParam = (param) => {
    return new URLSearchParams(location.search).get(param);
  };

  useEffect(() => {
    const token = getQueryParam('token');
    if (token) {
      localStorage.setItem('token', token);
      login(token);
      navigate('/Dashboard');
    }
  }, [location.search, login, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      console.log('Response data:', data);
  
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      localStorage.setItem('token', data.token);
      login(data.token);
      alert('Login successful!');
      navigate('/Dashboard');
    } catch (error) {
      alert(error.message || 'An unknown error occurred.');
    }
  };
  

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2 className="login-heading">Login</h2>
        {errorMessage && <p className="login-error-message">{errorMessage}</p>}
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            className="login-input-email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="login-button" type="submit">Login</button>
          <button className="login-button" type="button" onClick={handleGoogleLogin}>
            Login with Google
          </button>
          <p className="login-signup-text">
            Don't have an account? <Link className="login-signup-link" to="/signup">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
