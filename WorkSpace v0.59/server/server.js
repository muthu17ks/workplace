// Load environment variables
require('dotenv').config();

// Import libraries
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const passport = require('passport');
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const helmet = require('helmet');
const { google } = require('googleapis');
const twilio = require('twilio');

// Import models
const Document = require("./models/Document");
const File = require("./models/File");
const User = require('./models/User');
const Mail = require('./models/mail');

// Import routes
const taskRoutes = require('./routes/taskRoutes');
const connectDB = require('./config/db');
const initializePassport = require('./config/passport');
const authenticateJWT = require('./middleware/authMiddleware');


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware setup
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(require('express-session')({
  secret: process.env.SESSION_SECRET || 'a5f9d6f87e4c47c78a9e5c2bf3b4f67ea2d3b9c8944d91f6e74511a3d9f2c12b3f2d9b7e1f3e2d1a0c4f7e1b9c6e1f4d',
  resave: false,
  saveUninitialized: true,
}));

// Helmet for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-12345'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

// MongoDB connection
connectDB();

// Passport initialization
initializePassport(app);

// Routes
app.use('/tasks', taskRoutes);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage: storage });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const createDefaultFolders = async () => {
  const documentsFolder = await File.findOne({ name: 'Documents', parent: null });
  if (!documentsFolder) {
    await new File({
      name: 'Documents',
      parent: null,
      type: 'folder',
      isDeletable: false
    }).save();
  }
  const myDriveFolder = await File.findOne({ name: 'My Drive', parent: null });
  if (!myDriveFolder) {
    await new File({
      name: 'My Drive',
      parent: null,
      type: 'folder',
      isDeletable: false,
    }).save();
  }
};

createDefaultFolders();



// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

app.post('/signup', async (req, res) => {
  const { fullName, username, email, password, phoneNumber, gender } = req.body;

  console.log('Signup request:', req.body);

  if (!fullName || !username || !email || !password || !gender || phoneNumber === null) {
    return res.status(400).send({ message: 'All fields are required, and phone number cannot be null.' });
  }

  try {
    if (await User.findOne({ username })) {
      return res.status(400).send({ message: 'Username already exists. Please choose a different one.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).send({ message: 'Email already exists. Please choose a different one.' });
    }

    console.log('Hashing password for user:', username);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      gender
    });

    await newUser.save();
    res.send({ message: 'User registered successfully!' });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern.username) {
        return res.status(400).send({ message: 'Username already exists. Please choose a different one.' });
      }
      if (err.keyPattern.email) {
        return res.status(400).send({ message: 'Email already exists. Please choose a different one.' });
      }
      if (err.keyPattern.phoneNumber) {
        return res.status(400).send({ message: 'Phone number already exists. Please choose a different one.' });
      }
    }
    console.error('Error registering user:', err);
    res.status(500).send({ message: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userEmail = user.email;
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
      res.send({ message: 'Login successful!', token });
    } else {
      res.status(401).send({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send({ message: 'Error logging in' });
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/protected', authenticateJWT, (req, res) => {
  res.send('This is a protected route');
});

app.get('/user', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.sendStatus(404);
    }
    res.json({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      dob: user.dob,
      bio: user.bio,
      instagram: user.instagram,
      linkedin: user.linkedin,
      github: user.github,
      password: user.password ? true : false,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.sendStatus(500);
  }
});

app.put('/user/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }
    } else {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Old password is required' });
      }

      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});


app.post('/user/verify-password', authenticateJWT, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ valid: false, message: 'No password set for this account.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(401).json({ valid: false });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


app.delete('/user', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.sendStatus(404);
    }
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting account:', error);
    res.sendStatus(500);
  }
});

app.put('/user', authenticateJWT, async (req, res) => {
  const { fullName, username, email, phoneNumber, gender, dob, bio, instagram, linkedin, github } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.user.userId, {
      fullName,
      username,
      email,
      phoneNumber,
      gender,
      dob,
      bio,
      instagram,
      linkedin,
      github,
    }, { new: true });

    res.json({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      dob: user.dob,
      bio: user.bio,
      instagram: user.instagram,
      linkedin: user.linkedin,
      github: user.github,
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).send({ message: 'Failed to update user details.' });
  }
});

app.get('/auth/google', passport.authenticate('google', {
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive',
  ],
  accessType: 'offline',
  prompt: 'consent'
}));


app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), async (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, { expiresIn: '1h' });

  res.redirect(`http://localhost:3000/login?token=${token}`);
});


app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


// mail routes

app.get('/api/emails', authenticateJWT, async (req, res) => {
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
});


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


app.get('/api/session-user', authenticateJWT, async (req, res) => {
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
});


app.post('/api/send-email', authenticateJWT, async (req, res) => {
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
});


app.put('/api/emails/:id/read', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/star', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/archive', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/report-spam', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/mark-not-spam', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/trash', authenticateJWT, async (req, res) => {
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
});


app.patch('/api/emails/:id/restore', authenticateJWT, async (req, res) => {
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
});


app.delete('/api/emails/:id', authenticateJWT, async (req, res) => {
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
});

app.delete('/api/emails/:emailId/permanent', async (req, res) => {
  try {
    const emailId = req.params.emailId;
    await Mail.findByIdAndDelete(emailId);
    res.status(200).json({ message: 'Email permanently deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to permanently delete email.' });
  }
});


// dashboardmail mail routes

app.get('/api/dashboard/unread-emails', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    const unreadEmails = await Mail.find({
      recipient: user.email,
      isRead: false,
    }).sort({ sentAt: -1 });

    res.json({ unread: unreadEmails });
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});



// Drive Routes

app.delete('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File/Folder not found' });
    }

    if (file.name === 'My Drive') {
      return res.status(403).json({ error: 'You cannot delete the "My Drive" folder.' });
    }

    if (file.type === 'folder') {
      const children = await File.find({ parent: fileId });
      for (let child of children) {
        await File.findByIdAndDelete(child._id);
        if (child.type === 'file') {
          fs.unlinkSync(child.path);
        }
      }
    } else if (file.type === 'file') {
      if (file.path) {
        fs.unlinkSync(file.path);
      }
    }

    await File.findByIdAndDelete(fileId);

    res.status(200).json({ message: 'File/Folder deleted successfully' });
  } catch (error) {
    console.error('Error while deleting file/folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/files/:id', async (req, res) => {
  try {
    const files = await File.find({ parent: req.params.id === 'root' ? null : req.params.id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching files' });
  }
});


app.post('/files', async (req, res) => {
  const { name, parent, type } = req.body;
  try {
    if (!name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const file = new File({
      name,
      parent: parent === 'root' ? null : parent,
      type,
    });
    await file.save();
    res.json(file);
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Error creating folder' });
  }
});


app.put('/files/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    file.name = name;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: 'Error renaming file/folder' });
  }
});


app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    let { parent, description, createdBy, updatedBy, tags } = req.body;
    if (parent === 'root' || parent === 'null') {
      parent = null;
    }

    if (tags) {
      tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    const newFile = new File({
      name: req.file.originalname,
      parent: parent,
      type: 'file',
      path: req.file.path || req.file.filename, 
      size: req.file.size,
      description: description || '',
      createdBy: createdBy ? mongoose.Types.ObjectId(createdBy) : null, 
      updatedBy: updatedBy ? mongoose.Types.ObjectId(updatedBy) : null, 
      mimeType: req.file.mimetype,
      tags: tags || [],
      permissions: {},
      version: 1,
      lastAccessed: new Date(),
      fileExtension: path.extname(req.file.originalname),
    });

    await newFile.save();

    res.status(201).json({
      id: newFile._id,
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      path: newFile.path,
      parent: newFile.parent,
      description: newFile.description,
      createdBy: newFile.createdBy,
      updatedBy: newFile.updatedBy,
      mimeType: newFile.mimeType,
      tags: newFile.tags,
      version: newFile.version,
      lastAccessed: newFile.lastAccessed,
      fileExtension: newFile.fileExtension,
    });
  } catch (error) {
    console.error('Error while uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// socket io

io.on("connection", socket => {
  socket.on("get-recent-documents", async ({ page = 0 } = {}) => {
    const limit = 20;
    const skip = page * limit;
    try {
      const recentDocuments = await Document.find().limit(limit).skip(skip).sort({ updatedAt: -1 });
      const totalDocuments = await Document.countDocuments();
      const more = totalDocuments > (page + 1) * limit;
      socket.emit("recent-documents", { docs: recentDocuments, more });
    } catch (err) {
      socket.emit("recent-documents", { docs: [], more: false });
    }
  });

  socket.on("create-new-document", async ({ docId, name }) => {
    const documentName = name || 'Untitled Document';
    try {
      await Document.create({ _id: docId, name: documentName, data: "" });
      const recentDocuments = await Document.find().limit(20).sort({ updatedAt: -1 });
      io.emit("recent-documents", { docs: recentDocuments, more: false });
    } catch (err) {
      console.error('Error creating new document:', err);
    }
  });

  socket.on("get-document", async documentId => {
    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      socket.emit("load-document", document);

      socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async data => {
        try {
          await Document.findByIdAndUpdate(documentId, { data });
          const recentDocuments = await Document.find().limit(20).sort({ updatedAt: -1 });
          io.emit("recent-documents", { docs: recentDocuments, more: false });
        } catch (err) {
          console.error('Error saving document:', err);
        }
      });
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  });

  socket.on("save-document-name", async ({ docId, name }) => {
    try {
      const document = await Document.findById(docId);
      if (document && (document.name === 'Untitled Document' || document.name !== name)) {
        await Document.findByIdAndUpdate(docId, { name });
      }
      const recentDocuments = await Document.find().limit(20).sort({ updatedAt: -1 });
      io.emit("recent-documents", { docs: recentDocuments, more: false });
    } catch (err) {
      console.error('Error saving document name:', err);
    }
  });
  
  socket.on("delete-document", async ({ docId }) => {
    try {
      await Document.findByIdAndDelete(docId);
      const recentDocuments = await Document.find().limit(20).sort({ updatedAt: -1 });
      io.emit("recent-documents", { docs: recentDocuments, more: false });
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  });

  socket.on("rename-document", async ({ docId, newName }) => {
    try {
      const document = await Document.findById(docId);
      if (document) {
        if (document.name !== newName) {
          document.name = newName;
          await document.save();
        }
      }
      
      const recentDocuments = await Document.find().limit(20).sort({ updatedAt: -1 });
      io.emit("recent-documents", { docs: recentDocuments, more: false });
    } catch (err) {
      console.error('Error renaming document:', err);
    }
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  let document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: "" });
}

app.post('/documents', async (req, res) => {
  try {
    const { name, data, folderId } = req.body;

    const documentsFolder = await File.findById(folderId);

    if (!documentsFolder) {
      return res.status(404).json({ message: 'Documents folder not found' });
    }

    const newDocument = new Document({
      name: name || 'Untitled Document',
      data,
      parent: documentsFolder._id,
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ message: 'Error saving document' });
  }
});



// Otp verification

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const client = twilio(accountSid, authToken);

app.post('/send-otp', async (req, res) => {
  const { phoneNumber, userId } = req.body;

  try {
      await client.verify.v2
          .services(serviceSid)
          .verifications.create({ to: phoneNumber, channel: 'sms' });

      await User.findByIdAndUpdate(userId, { phoneNumber, phoneVerified: false });
      res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { phoneNumber, code, userId } = req.body;

  try {
      const verificationCheck = await client.verify.v2
          .services(serviceSid)
          .verificationChecks.create({ to: phoneNumber, code });

      if (verificationCheck.status === 'approved') {
          await User.findByIdAndUpdate(userId, { phoneVerified: true });
          res.json({ success: true, message: 'Phone number verified!' });
      } else {
          res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
  } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
