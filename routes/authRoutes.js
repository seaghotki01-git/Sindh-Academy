const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const billingController = require('../controllers/billingController');

router.post('/register', billingController.upload.single('receipt'), authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/contact', authController.submitContactMessage);
router.put('/update-password', protect, authController.updatePassword);
router.get('/verify-email', authController.verifyEmail);
router.get('/students', protect, authorizeRoles('clerk', 'admin'), authController.getStudents);

module.exports = router;
