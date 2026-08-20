const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Clerk & Admin accessible routes
router.get('/pending-students', protect, authorizeRoles('clerk', 'admin'), adminController.getPendingStudents);
router.put('/approve-student/:id', protect, authorizeRoles('clerk', 'admin'), adminController.approveStudent);
router.put('/reject-student/:id', protect, authorizeRoles('clerk', 'admin'), adminController.rejectStudent);
router.get('/registration-receipt/:id', protect, authorizeRoles('clerk', 'admin'), adminController.getRegistrationReceiptImage);

// Lock down the remaining routes to Admin role only
router.use(protect, authorizeRoles('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/logs', adminController.getLogs);
router.get('/analytics/grades', adminController.getGradeAnalytics);

// Payment methods CRUD routes
router.get('/payment-methods', adminController.getPaymentMethods);
router.post('/payment-methods', adminController.createPaymentMethod);
router.put('/payment-methods/:id', adminController.updatePaymentMethod);
router.delete('/payment-methods/:id', adminController.deletePaymentMethod);

module.exports = router;
