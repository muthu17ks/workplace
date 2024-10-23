import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Authentication/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [updatedDetails, setUpdatedDetails] = useState({});
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Phone verification states
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [message, setMessage] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchUserDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3001/user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data.dob) {
                    response.data.dob = new Date(response.data.dob).toISOString().split('T')[0];
                }

                setUserDetails(response.data);
                setUpdatedDetails(response.data);
                setIsVerified(response.data.phoneVerified);
            } catch (error) {
                console.error('Error fetching user details:', error);
                setErrorMessage('Failed to fetch user details. Please try again.');
                logout();
                navigate('/login');
            }
        };

        fetchUserDetails();
    }, [isAuthenticated, logout, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:3001/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert('Account deleted successfully.');
            logout();
            navigate('/signup');
        } catch (error) {
            console.error('Error deleting account:', error);
            setErrorMessage('Failed to delete account. Please try again.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUpdatedDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleSave = async (field) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3001/user`, { [field]: updatedDetails[field] }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserDetails((prevDetails) => ({
                ...prevDetails,
                [field]: updatedDetails[field],
            }));
        } catch (error) {
            console.error('Error updating user details:', error);
            setErrorMessage('Failed to update user details. Please try again.');
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmNewPassword) {
            alert('Please fill in all password fields.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const hasPassword = userDetails && userDetails.password;
            if (hasPassword && !oldPassword) {
                alert('Please enter your old password.');
                return;
            }

            if (hasPassword) {
                const verifyResponse = await axios.post(
                    `http://localhost:3001/user/verify-password`,
                    { password: oldPassword },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!verifyResponse.data.valid) {
                    alert('Old password is incorrect.');
                    return;
                }
            }

            await axios.put(
                `http://localhost:3001/user/password`,
                { oldPassword, newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert('Password updated successfully.');
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            console.error('Error updating password:', error.response.data);
            setErrorMessage('Failed to update password. Please try again.');
        }
    };

    const sendVerification = async () => {
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

        if (!formattedPhone.startsWith('+')) {
            setMessage('Please enter a valid phone number.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3001/send-otp', { phoneNumber: formattedPhone, userId: userDetails._id }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsCodeSent(true);
            setMessage('Verification code sent!');
        } catch (error) {
            console.error('Error sending verification:', error);
            setMessage('Failed to send verification code. Make sure the number is correct.');
        }
    };

    const verifyCode = async () => {
        try {
            const token = localStorage.getItem('token');
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const response = await axios.post('http://localhost:3001/verify-otp', { phoneNumber: formattedPhone, code, userId: userDetails._id }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (response.data.success) {
                setMessage('Phone number verified successfully! ✅');
                setIsVerified(true);
                await axios.put(`http://localhost:3001/user`, { phoneVerified: true }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } else {
                setMessage('Invalid code. Please try again.');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            setMessage('Verification failed. Please try again.');
        }
    };
    

    return (
        <div className="profile-container">
            <div className='profile-inner-container'>
                <h2 className="profile-title">Public Profile</h2>
                {errorMessage && <p className="profile-error-message">{errorMessage}</p>}
                {userDetails ? (
                    <div className="profile-details">
                        <div className="profile-field name">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={updatedDetails.fullName}
                                onChange={handleChange}
                                onBlur={() => handleSave('fullName')}
                            />
                        </div>

                        <div className="profile-field username">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={updatedDetails.username}
                                onChange={handleChange}
                                onBlur={() => handleSave('username')}
                            />
                        </div>

                        <div className="profile-field phone">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={updatedDetails.phoneNumber}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    handleChange(e);
                                }}
                                onBlur={() => handleSave('phoneNumber')}
                                placeholder="Enter phone number (without country code)"
                            />
                            {!isCodeSent ? (
                                <button onClick={sendVerification} style={{ padding: '10px 20px', marginTop: '10px' }}>
                                    Send Verification Code
                                </button>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Enter verification code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        style={{ margin: '10px', padding: '10px', width: '300px' }}
                                    />
                                    <button onClick={verifyCode} style={{ padding: '10px 20px' }}>
                                        Verify Code
                                    </button>
                                </>
                            )}
                        </div>

                        <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>

                        <div className="profile-field dob">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={updatedDetails.dob}
                                onChange={handleChange}
                                onBlur={() => handleSave('dob')}
                            />
                        </div>

                        <div className="profile-field email">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={updatedDetails.email}
                                onChange={handleChange}
                                onBlur={() => handleSave('email')}
                            />
                        </div>

                        <div className="profile-field bio">
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                value={updatedDetails.bio}
                                onChange={handleChange}
                                onBlur={() => handleSave('bio')}
                            />
                        </div>

                        <div className="profile-field instagram">
                            <label>Instagram</label>
                            <input
                                type="url"
                                name="instagram"
                                value={updatedDetails.instagram}
                                onChange={handleChange}
                                onBlur={() => handleSave('instagram')}
                            />
                        </div>

                        <div className="profile-field linkedin">
                            <label>LinkedIn</label>
                            <input
                                type="url"
                                name="linkedin"
                                value={updatedDetails.linkedin}
                                onChange={handleChange}
                                onBlur={() => handleSave('linkedin')}
                            />
                        </div>

                        <div className="profile-field github">
                            <label>GitHub</label>
                            <input
                                type="url"
                                name="github"
                                value={updatedDetails.github}
                                onChange={handleChange}
                                onBlur={() => handleSave('github')}
                            />
                        </div>

                        {userDetails && userDetails.password && (
                            <div className="profile-field old-password">
                                <label>Old Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter old password"
                                />
                            </div>
                        )}

                        <div className="profile-field new-password">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="profile-field confirm-password">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="profile-actions">
                            <button className='profile-password-update-button' onClick={handlePasswordChange}>Update Password</button>
                            <button className="profile-logout-button" onClick={handleLogout}>Logout</button>
                            <button className="profile-delete-button" onClick={handleDeleteAccount}>Delete Account</button>
                        </div>
                    </div>
                ) : (
                    <p className="profile-loading-message">Loading user details...</p>
                )}
            </div>
        </div>
    );
};

export default Profile;
