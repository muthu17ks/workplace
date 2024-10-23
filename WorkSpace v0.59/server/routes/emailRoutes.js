// routes/emailRoutes.js
const express = require('express');
const {
  getEmails,
  sendEmail,
  getSessionUser,
  markEmailAsRead,
  toggleStarEmail,
  toggleArchiveEmail,
  reportSpamEmail,
  markNotSpamEmail,
  moveToTrash,
  restoreEmail,
  deleteEmail,
  permanentDeleteEmail,
  getUnreadEmails,
} = require('../controllers/emailController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateJWT, getEmails);
router.get('/session-user', authenticateJWT, getSessionUser);
router.post('/send', authenticateJWT, sendEmail);
router.put('/:id/read', authenticateJWT, markEmailAsRead);
router.patch('/:id/star', authenticateJWT, toggleStarEmail);
router.patch('/:id/archive', authenticateJWT, toggleArchiveEmail);
router.patch('/:id/report-spam', authenticateJWT, reportSpamEmail);
router.patch('/:id/mark-not-spam', authenticateJWT, markNotSpamEmail);
router.patch('/:id/trash', authenticateJWT, moveToTrash);
router.patch('/:id/restore', authenticateJWT, restoreEmail);
router.delete('/:id', authenticateJWT, deleteEmail);
router.delete('/:emailId/permanent', permanentDeleteEmail);
router.get('/dashboard/unread-emails', authenticateJWT, getUnreadEmails);

module.exports = router;
