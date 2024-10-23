import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import "./Signup.css";

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('prefer not to say');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.post('http://localhost:3001/signup', {
        fullName,
        email,
        username,
        password,
        phoneNumber,
        gender,
      });
      alert(response.data.message);
      if (response.data.message === 'User registered successfully!') {
        navigate('/login');
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage('Username already exists. Please choose a different one.');
        } else if (error.response.status === 422) {
          setErrorMessage('Invalid input. Please check your data.');
        } else {
          setErrorMessage('An error occurred. Please try again later.');
        }
      } else {
        setErrorMessage('Network error. Please check your connection.');
      }
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <h2 className="signup-heading">Signup</h2>
        {errorMessage && <p className="signup-error-message">{errorMessage}</p>}
        <form className="signup-form" onSubmit={handleSignup}>
          <input
            className="signup-input-fullname"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <select
            className="signup-input-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="prefer not to say">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            className="signup-input-phone"
            type="text"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <input
            className="signup-input-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setUsername(e.target.value.split('@')[0]);
            }}
            required
          />
          <input
            className="signup-input-username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="signup-input-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="signup-button" type="submit">Sign Up</button>
        </form>
        <button className="signup-button" type="button" onClick={handleGoogleSignup}>
          Sign Up with Google
        </button>
        <p className="signup-login-text">Already have an account? <Link className="signup-login-link" to="/login">Login here</Link></p>
      </div>
    </div>
  );
};

export default Signup;
