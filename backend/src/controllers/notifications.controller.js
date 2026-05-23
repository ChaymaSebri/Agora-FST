const notificationService = require('../services/notification.service');
const ApiError = require('../utils/apiError');

// ============================================================================
// GET NOTIFICATIONS
// ============================================================================

async function getNotifications(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const { limit = 50, skip = 0 } = req.query;

    const { notifications, total } = await notificationService.getNotifications(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n._id.toString(),
          type: n.type,
          titre: n.titre,
          message: n.message,
          relatedId: n.relatedId?.toString(),
          relatedType: n.relatedType,
          lue: n.lue,
          dateNotification: n.dateNotification,
        })),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUnreadNotifications(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const notifications = await notificationService.getUnreadNotifications(userId);

    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n._id.toString(),
          type: n.type,
          titre: n.titre,
          message: n.message,
          relatedId: n.relatedId?.toString(),
          relatedType: n.relatedType,
          lue: n.lue,
          dateNotification: n.dateNotification,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const count = await notificationService.countUnread(userId);

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// MARK NOTIFICATIONS AS READ
// ============================================================================

async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id.toString();

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return next(new ApiError(404, 'Notification non trouvée'));
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
      data: {
        id: notification._id.toString(),
        lue: notification.lue,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user._id.toString();

    await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// DELETE NOTIFICATIONS
// ============================================================================

async function deleteNotification(req, res, next) {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id.toString();

    await notificationService.deleteNotification(notificationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification supprimée',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
