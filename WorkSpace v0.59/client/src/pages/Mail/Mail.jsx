import React, { useState, useEffect, useCallback } from 'react';
import './Mail.css';
import axios from 'axios';
import { debounce } from 'lodash';

const Mail = () => {
  const [mailFormData, setMailFormData] = useState({
    mailReceiver: '',
    mailSubject: '',
    mailMessage: '',
  });

  const [mailStatus, setMailStatus] = useState(null);
  const [sendConfirmation, setSendConfirmation] = useState(null);
  const [mailSessionEmail, setMailSessionEmail] = useState(null);
  const [mailInbox, setMailInbox] = useState([]);
  const [mailSentMail, setMailSentMail] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showComposePopup, setShowComposePopup] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState({});
  const [previousTab, setPreviousTab] = useState('inbox');
  const [deletedEmail, setDeletedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortEmailsByDate = (emails) => {
    return emails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  };
  
  const fetchEmails = async () => {
    try {
        const token = localStorage.getItem('token');

        const sessionResponse = await axios.get('http://localhost:3001/api/session-user', {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
        });
        setMailSessionEmail(sessionResponse.data.email);

        const emailResponse = await axios.get('http://localhost:3001/api/emails', {
            headers: { Authorization: `Bearer ${token}` },
        });

        setMailInbox(sortEmailsByDate(emailResponse.data.received));
        setMailSentMail(sortEmailsByDate(emailResponse.data.sent));
    } catch (error) {
        setMailStatus('Failed to fetch data. Please log in again.');
    } finally {
        setLoading(false);
    }
};


  useEffect(() => {
    setLoading(true);
    fetchEmails();
    const intervalId = setInterval(() => {
      fetchEmails();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleMailChange = (e) => {
    const { name, value } = e.target;
    setMailFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleStarEmail = async (emailId) => {
    try {
      const token = localStorage.getItem('token');

      const updatedInbox = mailInbox.map((email) =>
        email._id === emailId ? { ...email, isStarred: !email.isStarred } : email
      );
      setMailInbox(updatedInbox);

      const updatedSentMail = mailSentMail.map((email) =>
        email._id === emailId ? { ...email, isStarred: !email.isStarred } : email
      );
      setMailSentMail(updatedSentMail);

      if (selectedEmail && selectedEmail._id === emailId) {
        setSelectedEmail((prevEmail) => ({
          ...prevEmail,
          isStarred: !prevEmail.isStarred,
        }));
      }

      await axios.patch(
        `http://localhost:3001/api/emails/${emailId}/star`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error starring email:', error);
    }
  };


  const handleArchiveEmail = async (emailId) => {
    try {
        const token = localStorage.getItem('token');

        setMailInbox(prevInbox =>
            prevInbox.map(email =>
                email._id === emailId ? { ...email, isArchived: true } : email
            )
        );

        await axios.patch(
            `http://localhost:3001/api/emails/${emailId}/archive`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        await fetchEmails();
    } catch (error) {
        console.error('Error archiving email:', error);
    }
};


  const handleToggleRead = async (email) => {
    const updatedEmail = { isRead: !email.isRead };

    setMailInbox((prevEmails) =>
      prevEmails.map((e) =>
        e._id === email._id ? { ...e, isRead: !e.isRead } : e
      )
    );

    if (selectedEmail && selectedEmail._id === email._id) {
      setSelectedEmail((prev) => ({ ...prev, isRead: !prev.isRead }));
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/emails/${email._id}/read`,
        updatedEmail,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error toggling email read status:', error);
    }
  };


  const handleReportSpam = async (emailId) => {
    const token = localStorage.getItem('token');

    try {
      const emailToUpdate = mailInbox.find((email) => email._id === emailId);

      if (emailToUpdate && emailToUpdate.isSpam) {
        const response = await axios.patch(
          `http://localhost:3001/api/emails/${emailId}/mark-not-spam`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setMailInbox((prevEmails) =>
            prevEmails.map((email) =>
              email._id === emailId ? { ...email, isSpam: false, isTrashed: false } : email
            )
          );

          setMailStatus('Email marked as not spam successfully.');
        }
      } else {
        const response = await axios.patch(
          `http://localhost:3001/api/emails/${emailId}/report-spam`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setMailInbox((prevEmails) =>
            prevEmails.filter((email) => email._id !== emailId)
          );

          setMailStatus('Email reported as spam successfully and moved to Spam.');
        }
      }
    } catch (error) {
      console.error('Error reporting spam:', error);
      setMailStatus('Failed to report email. Please try again.');
    }
  };



  const handleDeleteEmail = async (emailId) => {
    const token = localStorage.getItem('token');

    try {
      const emailToDelete = mailInbox.find(email => email._id === emailId);

      if (emailToDelete) {
        setDeletedEmail(emailToDelete);

        setMailInbox(prevEmails =>
          prevEmails.map(email =>
            email._id === emailId ? { ...email, isTrashed: true } : email
          )
        );

        await axios.patch(`http://localhost:3001/api/emails/${emailId}/trash`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error moving email to trash:', error.message);
    }
  };


  const handleUndoDelete = async () => {
    if (!deletedEmail) return;
    const token = localStorage.getItem('token');

    try {
      await axios.patch(
        `http://localhost:3001/api/emails/${deletedEmail._id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMailInbox(prevEmails =>
        prevEmails.map(email =>
          email._id === deletedEmail._id ? { ...email, isTrashed: false } : email
        )
      );

      setDeletedEmail(null);
    } catch (error) {
      console.error('Error restoring email:', error.message);
    }
  };

  const handlePermanentDelete = async (emailId) => {
    const token = localStorage.getItem('token');

    try {
      await axios.delete(`http://localhost:3001/api/emails/${emailId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEmails();
    } catch (error) {
      console.error('Error permanently deleting email:', error.message);
    }
  };



  const handleMailSubmit = async (e) => {
    e.preventDefault();

    if (!mailSessionEmail) {
      setMailStatus("Unable to fetch sender's email.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3001/api/send-email',
        {
          sender: mailSessionEmail,
          receiver: mailFormData.mailReceiver,
          subject: mailFormData.mailSubject,
          message: mailFormData.mailMessage,
        },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      setSendConfirmation('Email sent successfully!');

      setMailFormData({ mailReceiver: '', mailSubject: '', mailMessage: '' });
      setShowComposePopup(false);
      await fetchEmails();

      setTimeout(() => {
        setSendConfirmation(null);
      }, 3000);
    } catch (error) {
      setMailStatus('Failed to send email. Please try again.');
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => setSearchQuery(query), 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const filteredEmails = () => {
    const emailsToSearch = activeTab === 'sent' ? mailSentMail : mailInbox;
    const filtered = emailsToSearch.filter(
        (email) =>
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (email.body && email.body.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return sortEmailsByDate(filtered); 
};

const renderEmails = () => {
  let emailsToDisplay = filteredEmails();
  if (emailsToDisplay === null) {
    return <p>No result found.</p>;
  }

  switch (activeTab) {
    case 'inbox':
      emailsToDisplay = mailInbox.filter(
        (email) => !email.isSpam && !email.isArchived && !email.isTrashed
      );
      break;
    case 'primary':
      emailsToDisplay = mailInbox.filter(
        (email) =>
          !email.isSpam &&
          !email.isArchived &&
          !email.isTrashed &&
          email.category === 'primary'
      );
      break;
    case 'sent':
      emailsToDisplay = mailSentMail.map(email => ({
        ...email,
        isRead: true,
      }));
      break;
    case 'allMail':
      emailsToDisplay = [
        ...mailInbox.filter(
          (email) => !email.isTrashed && !email.isArchived && !email.isSpam
        ),
        ...mailSentMail,
      ];
      break;
    case 'starred':
      emailsToDisplay = mailInbox.filter(
        (email) => email.isStarred && !email.isSpam && !email.isTrashed
      );
      break;
    case 'archived':
      emailsToDisplay = mailInbox.filter(
        (email) => email.isArchived && !email.isTrashed
      );
      break;
    case 'spam':
      emailsToDisplay = mailInbox.filter(
        (email) => email.isSpam && !email.isTrashed
      );
      break;
    case 'trash':
      emailsToDisplay = mailInbox.filter((email) => email.isTrashed);
      break;
    default:
      emailsToDisplay = [];
  }

  emailsToDisplay.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return emailsToDisplay.length ? (
    emailsToDisplay.map((email) => (
      <div
        key={email._id}
        className="mail-item"
        onClick={() => {
          if (!email.isRead && activeTab !== 'sent') {
            handleToggleRead(email);
          }
          setPreviousTab(activeTab);
          setSelectedEmail(email);
          setSearchQuery('');
        }}
        style={{
          fontWeight: email.isRead ? 'normal' : 'bold',
          color: email.isRead ? 'gray' : 'black',
        }}
      >
        <div className="mail-item-header">
          <span className="mail-item-sender">{email.sender}</span>
          <span className="mail-item-subject">{email.subject}</span>
          <span className="mail-item-time">
            {new Date(email.sentAt).toLocaleString()}
          </span>
          <div className="mail-actions">
            {activeTab === 'trash' ? (
              <>
                <span
                  className="mail-action-icon material-symbols-rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUndoDelete(email._id);
                  }}
                  title="Undo Delete"
                >
                  undo
                </span>
                <span
                  className="mail-action-icon material-symbols-rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(email._id);
                  }}
                  title="Delete Forever"
                >
                  delete_forever
                </span>
              </>
            ) : (
              <>
                <span
                  className={`mail-action-icon mail-start-icon material-symbols-rounded ${email.isStarred ? 'starred' : 'unstarred'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarEmail(email._id);
                  }}
                  title="Star/Unstar"
                >
                  star
                </span>

                <span
                  className={`mail-action-icon mail-archive-icon material-symbols-rounded ${email.isArchived ? 'archived' : 'unarchived'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchiveEmail(email._id);
                  }}
                  title="Archive"
                >
                  archive
                </span>

                <span
                  className={`mail-action-icon mail-report-icon material-symbols-rounded`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportSpam(email._id);
                  }}
                  title="Report as Spam"
                >
                  report
                </span>

                <span
                  className={`mail-action-icon mail-delete-icon material-symbols-rounded`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEmail(email._id);
                  }}
                  title="Delete"
                >
                  delete
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    ))
  ) : (
    <p>No emails found.</p>
  );
};
  
  const renderSelectedEmail = () => {
    if (!selectedEmail) return null;

    return (
      <div className="mail-view">
        <div className="mail-view-header">
          <span className="mail-action-icon material-symbols-rounded"
            onClick={() => {
              setSelectedEmail(null);
              setActiveTab(previousTab);
            }}
            title="Back to Previous Tab">
            arrow_back
          </span>
          <div className="mail-view-actions">
            <span
              className={`mail-action-icon mail-start-icon material-symbols-rounded ${selectedEmail.isStarred ? 'starred' : 'unstarred'}`}
              onClick={() => handleStarEmail(selectedEmail._id)}
              title="Star/Unstar"
            >
              star
            </span>
            <span
              className={`mail-action-icon mail-archive-icon material-symbols-rounded ${selectedEmail.isArchived ? 'archived' : 'unarchived'}`}
              onClick={() => handleArchiveEmail(selectedEmail._id)}
              title="Archive"
            >
              archive
            </span>
            <span
              className={`mail-action-icon mail-report-icon material-symbols-rounded`}
              onClick={() => {
                if (!hasBeenRead[selectedEmail._id]) {
                  handleToggleRead(selectedEmail);
                }
              }}
              title={selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}
            >
              {selectedEmail.isRead ? 'mark_email_read' : 'mark_email_unread'}
            </span>
            <span
              className={`mail-action-icon mail-report-icon material-symbols-rounded`}
              onClick={() => handleReportSpam(selectedEmail._id)}
              title="Report as Spam"
            >
              report
            </span>
            <span
              className={`mail-action-icon mail-delete-icon material-symbols-rounded`}
              onClick={() => handleDeleteEmail(selectedEmail._id)}
              title="Delete"
            >
              delete
            </span>

          </div>
        </div>
        <div className="mail-mail-full-view">
          <h2 className="mail-email-subject">{selectedEmail.subject}</h2>
          <div className="mail-email-info">
            <div>
              <span className="mail-email-from">From: {selectedEmail.sender}</span>
              <span className="mail-email-to">To: {selectedEmail.recipient}</span>
            </div>
            <span className="mail-email-received">Received at: {new Date(selectedEmail.sentAt).toLocaleString()}</span>
          </div>
          <div className="mail-email-body">{selectedEmail.body}</div>
        </div>

      </div>
    );
  };

  return (
    <div className="mail-container">
      <div className="mail-sidebar">
        <h1 className='mail-text-logo'>Mail</h1>
        <button className="mail-compose-button" onClick={() => setShowComposePopup(true)}>Compose Mail</button>
        <ul className="mail-nav">
          <li
            className={activeTab === 'inbox' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('inbox');
              setSelectedEmail(null);
            }}
          >
            Inbox
          </li>
          <li
            className={activeTab === 'primary' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('primary');
              setSelectedEmail(null);
            }}
          >
            Primary
          </li>
          <li
            className={activeTab === 'sent' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('sent');
              setSelectedEmail(null);
            }}
          >
            Sent
          </li>
          <li
            className={activeTab === 'allMail' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('allMail');
              setSelectedEmail(null);
            }}
          >
            All Mail
          </li>
          <li
            className={activeTab === 'starred' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('starred');
              setSelectedEmail(null);
            }}
          >
            Starred
          </li>
          <li
            className={activeTab === 'archived' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('archived');
              setSelectedEmail(null);
            }}
          >
            Archived
          </li>
          <li
            className={activeTab === 'spam' ? 'active' : ''}
            onClick={() => {
              setPreviousTab(activeTab);
              setActiveTab('spam');
              setSelectedEmail(null);
            }}
          >
            Spam
          </li>
          <li
            className={activeTab === 'trash' ? 'active' : ''}
            onClick={() => setActiveTab('trash')}
          >
            Trash
          </li>
        </ul>
      </div>
      <div className='mail-mail-cover'>
        <div className="mail-search-container">
          <span className="material-symbols-rounded mail-search-icon">search</span>
          <input
            type="text"
            placeholder="Search emails..."
            onChange={handleSearchChange}
            className="mail-search-input"
          />
          {searchQuery && (
            <div className="mail-search-results">
              {filteredEmails().length > 0 ? (
                filteredEmails().map((email) => (
                  <div
                    key={email._id}
                    className="mail-search-item"
                    onClick={() => {
                      setSelectedEmail(email);
                      setSearchQuery('');
                    }}
                  >
                    <strong>{email.subject}</strong> - {email.sender}
                  </div>
                ))
              ) : (
                <div className="mail-search-no-results">No results found.</div>
              )}
            </div>
          )}

        </div>

        <div className="mail-main">
          <div className='mail-inner-main'>
            {showComposePopup && (
              <div className="mail-popup">
                <form onSubmit={handleMailSubmit}>
                  <input
                    type="email"
                    name="mailReceiver"
                    value={mailFormData.mailReceiver}
                    onChange={handleMailChange}
                    required
                    placeholder="Receiver's Email"
                    className="mail-input"
                  />
                  <input
                    type="text"
                    name="mailSubject"
                    value={mailFormData.mailSubject}
                    onChange={handleMailChange}
                    required
                    placeholder="Subject"
                    className="mail-input"
                  />
                  <textarea
                    name="mailMessage"
                    value={mailFormData.mailMessage}
                    onChange={handleMailChange}
                    required
                    rows="4"
                    placeholder="Message"
                    className="mail-textarea"
                  />
                  <button type="submit" className="mail-send-button">Send</button>
                  <button type="button" onClick={() => setShowComposePopup(false)} className="mail-cancel-button">Cancel</button>
                </form>
              </div>
            )}

            {loading ? <p>Loading...</p> : selectedEmail ? renderSelectedEmail() : renderEmails()}

            {sendConfirmation && (
              <div className="mail-send-confirmation">
                {sendConfirmation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mail;
