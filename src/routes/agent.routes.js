const express = require('express');
const { getCommissions } = require('../controllers/commission.controller');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const userController = require('../controllers/user.controller');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.get('/stats', authenticate, authorizeRoles('AGENT'), analyticsController.getDashboardStats);
router.get('/commissions', authenticate, authorizeRoles('AGENT', 'ADMIN'), getCommissions);
router.get('/clients', authenticate, authorizeRoles('AGENT'), userController.getAgentClients);
router.get('/notifications', authenticate, authorizeRoles('AGENT'), notificationController.getMyNotifications);

module.exports = router;
