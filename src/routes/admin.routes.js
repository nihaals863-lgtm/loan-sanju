const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const userController = require('../controllers/user.controller');
const loanController = require('../controllers/loan.controller');
const paymentController = require('../controllers/payment.controller');
const auditController = require('../controllers/audit.controller');
const collateralController = require('../controllers/collateral.controller');
const analyticsController = require('../controllers/analytics.controller');
const commissionController = require('../controllers/commission.controller');
const notificationController = require('../controllers/notification.controller');
const settingsController = require('../controllers/settings.controller');

// Admin and Staff only
router.use(authenticate, authorizeRoles('ADMIN', 'STAFF'));

// Dashboard Stats
router.get('/stats', analyticsController.getDashboardStats);

// Manage Users
router.get('/users', userController.getAllUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.patch('/users/:id/verify', userController.verifyUser);
router.delete('/users/:id', userController.deleteUser);

// Approve Loans
router.get('/loans', loanController.getLoans);
router.post('/loans', loanController.applyLoan);
router.put('/loans/:id/approve', loanController.approveLoan);
router.put('/loans/:id/reject', loanController.rejectLoan);

// View all payments
router.get('/payments', paymentController.getPayments);
router.put('/payments/:id/verify', paymentController.verifyPayment);

// Audit Logs
router.get('/audit', auditController.getAuditLogs);

// Commissions
router.get('/commissions', commissionController.getCommissions);

// Notifications
router.get('/notifications', notificationController.getNotifications);

// Settings
router.get('/config', settingsController.getSettings);
router.put('/config', settingsController.updateSettings);

// Collateral Management
router.get('/collateral', collateralController.getAllCollateral);
router.patch('/collateral/:id/verify', collateralController.verifyCollateral);

module.exports = router;
