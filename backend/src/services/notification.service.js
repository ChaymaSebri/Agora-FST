const { Notification } = require('../models');

class NotificationService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map de userId -> Set de socketIds
  }

  setIO(io) {
    this.io = io;
  }

  registerUserSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  removeUserSocket(userId, socketId) {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Crée une notification et l'envoie en temps réel via Socket.io
   * @param {string} utilisateurId - ID de l'utilisateur destinataire
   * @param {string} type - Type de notification (invitation_event, invitation_project, etc.)
   * @param {string} titre - Titre de la notification
   * @param {string} message - Message de la notification
   * @param {string} relatedId - ID de la ressource concernée
   * @param {string} relatedType - Type de la ressource (event, project, invitation)
   * @returns {Promise<Object>} La notification créée
   */
  async createNotification(utilisateurId, type, titre, message, relatedId, relatedType) {
    try {
      const notification = new Notification({
        utilisateurId,
        type,
        titre,
        message,
        relatedId,
        relatedType,
        etat: 'ferme',
        lue: false,
      });

      await notification.save();

      // Envoyer en temps réel via Socket.io si disponible
      if (this.io && this.userSockets.has(utilisateurId)) {
        const socketIds = this.userSockets.get(utilisateurId);
        socketIds.forEach(socketId => {
          this.io.to(socketId).emit('notification:new', {
            id: notification._id.toString(),
            type: notification.type,
            titre: notification.titre,
            message: notification.message,
            relatedId: notification.relatedId?.toString(),
            relatedType: notification.relatedType,
            etat: notification.etat,
            lue: notification.lue,
            dateNotification: notification.dateNotification,
          });
        });
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Crée des notifications pour plusieurs utilisateurs
   * @param {string[]} utilisateurIds - IDs des utilisateurs destinataires
   * @param {string} type - Type de notification
   * @param {string} titre - Titre de la notification
   * @param {string} message - Message de la notification
   * @param {string} relatedId - ID de la ressource concernée
   * @param {string} relatedType - Type de la ressource
   */
  async createNotificationBatch(utilisateurIds, type, titre, message, relatedId, relatedType) {
    const notifications = [];

    for (const utilisateurId of utilisateurIds) {
      try {
        const notification = await this.createNotification(
          utilisateurId,
          type,
          titre,
          message,
          relatedId,
          relatedType
        );
        notifications.push(notification);
      } catch (error) {
        console.error(`Erreur pour utilisateur ${utilisateurId}:`, error);
      }
    }

    return notifications;
  }

  /**
   * Récupère les notifications non lues d'un utilisateur
   */
  async getUnreadNotifications(utilisateurId) {
    try {
      const notifications = await Notification.find({
        utilisateurId,
        $or: [
          { etat: 'ferme' },
          { etat: { $exists: false }, lue: false },
        ],
      })
        .sort({ dateNotification: -1 })
        .limit(50)
        .exec();

      return notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les notifications d'un utilisateur
   */
  async getNotifications(utilisateurId, limit = 50, skip = 0) {
    try {
      const notifications = await Notification.find({ utilisateurId })
        .sort({ dateNotification: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      const total = await Notification.countDocuments({ utilisateurId });

      return { notifications, total };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme ouverte
   */
  async markAsRead(notificationId, utilisateurId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          utilisateurId,
          $or: [
            { etat: 'ferme' },
            { etat: { $exists: false }, lue: false },
          ],
        },
        {
          $set: {
            lue: true,
            etat: 'ouvert',
            dateOuverture: new Date(),
          },
        },
        { new: true }
      ) || await Notification.findOne({ _id: notificationId, utilisateurId });

      return notification;
    } catch (error) {
      console.error('Erreur lors de la marque de notification comme lue:', error);
      throw error;
    }
  }

  /**
   * Marque une notification comme ouverte (etat: 'ouvert') sans toucher au champ 'lue'
   */
  async markAsOpened(notificationId, utilisateurId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          utilisateurId,
          $or: [
            { etat: 'ferme' },
            { etat: { $exists: false } },
          ],
        },
        {
          $set: {
            etat: 'ouvert',
            dateOuverture: new Date(),
          },
        },
        { new: true }
      ) || await Notification.findOne({ _id: notificationId, utilisateurId });

      return notification;
    } catch (error) {
      console.error('Erreur lors du marquage de notification comme ouverte:', error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme ouvertes (etat: 'ouvert')
   */
  async markAllAsOpened(utilisateurId) {
    try {
      await Notification.updateMany(
        {
          utilisateurId,
          $or: [
            { etat: 'ferme' },
            { etat: { $exists: false } },
          ],
        },
        {
          $set: {
            etat: 'ouvert',
            dateOuverture: new Date(),
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme ouvertes:', error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme ouvertes
   */
  async markAllAsRead(utilisateurId) {
    try {
      await Notification.updateMany(
        {
          utilisateurId,
          $or: [
            { etat: 'ferme' },
            { etat: { $exists: false }, lue: false },
          ],
        },
        {
          $set: {
            lue: true,
            etat: 'ouvert',
            dateOuverture: new Date(),
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Erreur lors de la marque de toutes les notifications comme lues:', error);
      throw error;
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId, utilisateurId) {
    try {
      await Notification.deleteOne({
        _id: notificationId,
        utilisateurId,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }

  /**
   * Compte les notifications non ouvertes
   */
  async countUnread(utilisateurId) {
    try {
      const count = await Notification.countDocuments({
        utilisateurId,
        $or: [
          { etat: 'ferme' },
          { etat: { $exists: false }, lue: false },
        ],
      });

      return count;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
