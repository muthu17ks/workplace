const User = require('../models/User');
const Mail = require('../models/Mail');
const { google } = require('googleapis');
// const oauth2Client = require('../config/oauth2Client'); // Adjust the path as necessary

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Fetch all emails (received and sent) for the authenticated user
const getEmails = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).send({ message: 'User not found' });

    const [receivedEmails, sentEmails] = await Promise.all([
      Mail.find({ recipient: user.email }).sort({ sentAt: -1 }),
      Mail.find({ sender: user.email }).sort({ sentAt: -1 }),
    ]);

    res.json({ received: receivedEmails, sent: sentEmails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Send an email
const sendEmail = async (sender, receiver, subject, message, accessToken) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const email = [
      `From: ${sender}`,
      `To: ${receiver}`,
      `Subject: ${subject}`,
      '',
      message,
    ].join('\n');

    const base64EncodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64EncodedEmail,
      },
    });

    return { message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

// Fetch session user information
const getSessionUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.json({ email: user.email });
  } catch (error) {
    console.error('Error fetching session user:', error);
    res.status(500).send({ message: 'Error fetching user information' });
  }
};

// Handle email sending logic
const handleSendEmail = async (req, res) => {
  const { sender, receiver, subject, message } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.refreshToken) {
      return res.status(403).send({ message: 'No refresh token found for this user.' });
    }

    oauth2Client.setCredentials({ refresh_token: user.refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    const result = await sendEmail(sender, receiver, subject, message, credentials.access_token);

    const newMail = new Mail({
      sender,
      recipient: receiver,
      subject,
      body: message,
      sentAt: new Date(),
    });

    await newMail.save();
    res.send(result);
  } catch (error) {
    console.error('Error in sending email:', error);
    res.status(500).send({ message: error.message });
  }
};

// Mark an email as read/unread
const markEmailReadStatus = async (req, res) => {
  const { id } = req.params;
  const { isRead } = req.body;

  try {
    const mail = await Mail.findByIdAndUpdate(id, { isRead }, { new: true });

    if (!mail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    res.send({ message: 'Email marked as read/unread', email: mail });
  } catch (error) {
    console.error('Error updating email read status:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Toggle star status of an email
const toggleStarEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findById(id);
    if (!mail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    mail.isStarred = !mail.isStarred;
    await mail.save();

    res.send({ message: `Email ${mail.isStarred ? 'starred' : 'unstared'} successfully`, email: mail });
  } catch (error) {
    console.error('Error toggling star status of email:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Toggle archive status of an email
const toggleArchiveEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findById(id);
    if (!mail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    mail.isArchived = !mail.isArchived;
    await mail.save();

    res.send({ message: `Email ${mail.isArchived ? 'archived' : 'unarchived'} successfully`, email: mail });
  } catch (error) {
    console.error('Error toggling archive status of email:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Report an email as spam
const reportSpamEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findById(id);
    if (!mail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    mail.isSpam = true;
    await mail.save();

    res.send({ message: 'Email reported as spam successfully', email: mail });
  } catch (error) {
    console.error('Error reporting email as spam:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Mark an email as not spam
const markNotSpamEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findById(id);
    if (!mail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    mail.isSpam = false;
    await mail.save();

    res.send({ message: 'Email marked as not spam successfully', email: mail });
  } catch (error) {
    console.error('Error marking email as not spam:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Move an email to trash
const moveToTrashEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedMail = await Mail.findByIdAndUpdate(
      id,
      { isTrashed: true },
      { new: true }
    );

    if (!updatedMail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    res.send({ message: 'Email moved to trash successfully', updatedMail });
  } catch (error) {
    console.error('Error moving email to trash:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Restore a trashed email
const restoreEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const restoredEmail = await Mail.findByIdAndUpdate(
      id,
      { isTrashed: false },
      { new: true }
    );

    if (!restoredEmail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    res.status(200).send({ message: 'Email restored successfully', email: restoredEmail });
  } catch (error) {
    console.error('Error restoring email:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Permanently delete an email
const deleteEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMail = await Mail.findByIdAndDelete(id);
    if (!deletedMail) {
      return res.status(404).send({ message: 'Email not found' });
    }

    res.send({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Permanently delete an email by ID
const permanentDeleteEmail = async (req, res) => {
  try {
    const emailId = req.params.emailId;
    await Mail.findByIdAndDelete(emailId);
    res.status(200).json({ message: 'Email permanently deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to permanently delete email.' });
  }
};

// Fetch unread emails for the logged-in user
const getUnreadEmails = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).send({ message: 'User not found' });

    const unreadEmails = await Mail.find({ recipient: user.email, isRead: false }).sort({ sentAt: -1 });
    res.json(unreadEmails);
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

module.exports = {
  getEmails,
  handleSendEmail,
  getSessionUser,
  markEmailReadStatus,
  toggleStarEmail,
  toggleArchiveEmail,
  reportSpamEmail,
  markNotSpamEmail,
  moveToTrashEmail,
  restoreEmail,
  deleteEmail,
  permanentDeleteEmail,
  getUnreadEmails,
};
