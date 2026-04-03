const express = require('express');
const router = express.Router();
const uploadUser = require('../middleware/uploadUser');
const {
  requestOtp,
  verifyAndCreateInvitation,
  getInvitationBySlug,
  getAllInvitations,
  getInvitationHtml,
  previewTemplate,
  handleRSVP
} = require('../controllers/webInvitationController');

// Define routes
router.post('/request-otp', requestOtp);
router.post('/verify-and-create', uploadUser.array('media', 10), verifyAndCreateInvitation);
router.post('/:slug/rsvp', handleRSVP);
router.get('/', getAllInvitations);
router.get('/preview/:templateId', previewTemplate);
router.get('/html/:slug', getInvitationHtml);
router.get('/:slug', getInvitationBySlug);

module.exports = router;
