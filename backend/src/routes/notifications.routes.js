const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

const router = express.Router();

// Tous les endpoints de notifications requirent une authentification
router.use(authenticate);

// ============================================================================
// GET NOTIFICATIONS
// ============================================================================

// Récupérer toutes les notifications (paginé)
router.get('/', notificationsController.getNotifications);

// Récupérer les notifications non lues
router.get('/unread', notificationsController.getUnreadNotifications);

// Récupérer le nombre de notifications non lues
router.get('/unread/count', notificationsController.getUnreadCount);

// ============================================================================
// MARK AS READ
// ============================================================================

// Marquer une notification comme lue
router.patch('/:notificationId/read', notificationsController.markAsRead);

// Marquer toutes les notifications comme lues
router.patch('/read/all', notificationsController.markAllAsRead);

// ============================================================================
// DELETE
// ============================================================================

// Supprimer une notification
router.delete('/:notificationId', notificationsController.deleteNotification);

module.exports = router;
