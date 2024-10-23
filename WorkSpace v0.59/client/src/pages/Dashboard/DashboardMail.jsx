import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DashboardMail.css';

const DashboardMail = () => {
  const [unreadEmails, setUnreadEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnreadEmails = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      try {
        const response = await axios.get('http://localhost:3001/api/dashboard/unread-emails', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUnreadEmails(response.data.unread);
      } catch (err) {
        console.error('Error fetching unread emails:', err);
        setError('Failed to load unread emails. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadEmails();
  }, []);

  const handleEmailClick = (id) => {
    navigate(`/mail/${id}`);
  };

  if (isLoading) return <p>Loading unread emails...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-mail-box">
      <h3 className="dashboard-mail-title">Unread Emails</h3>
      <ul className="dashboard-mail-list">
        {unreadEmails.length > 0 ? (
          unreadEmails.map(email => (
            <li key={email._id} className="dashboard-mail-item" onClick={() => handleEmailClick(email._id)}>
              <div className="dashboard-mail-item-info">
                <div className="dashboard-mail-item-top">
                  <span className="dashboard-mail-item-sender">{email.sender}</span>
                  <span className="dashboard-mail-item-date">{new Date(email.sentAt).toLocaleString()}</span>
                </div>
                <span className="dashboard-mail-item-subject">{email.subject}</span>
              </div>
            </li>
          ))
        ) : (
          <li className="dashboard-mail-item">No unread emails found.</li>
        )}
      </ul>
    </div>
  );
};

export default DashboardMail;
