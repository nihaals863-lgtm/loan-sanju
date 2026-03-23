const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const loanController = require('../controllers/loan.controller');
const paymentController = require('../controllers/payment.controller');
const commissionController = require('../controllers/commission.controller');
const notificationController = require('../controllers/notification.controller');
const collateralController = require('../controllers/collateral.controller');

// Borrower and Agent only
router.use(authenticate, authorizeRoles('BORROWER', 'AGENT'));

// Loan routes
router.post('/loans/apply', loanController.applyLoan);
router.get('/loans/my', loanController.getMyLoans); // Client can view own loans

// Payment routes
router.post('/payments', paymentController.createPayment);
router.get('/payments/my', paymentController.getPayments);

// Notification routes
router.get('/notifications/my', notificationController.getMyNotifications);

// Collateral routes
router.post('/collateral', collateralController.uploadCollateral);
router.get('/collateral/my', collateralController.getMyCollateral);

// Agent specific routes
router.get('/commissions', authorizeRoles('AGENT'), commissionController.getCommissions);

module.exports = router;
