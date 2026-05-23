import { io, Socket } from 'socket.io-client';
import api from './api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  lue: boolean;
  dateNotification: string;
}

class NotificationService {
  private socket: Socket | null = null;
  private isConnected = false;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];
  private token: string | null = null;

  /**
   * Initialiser la connexion Socket.io
   */
  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      // Événement de connexion
      this.socket.on('connect', () => {
        console.log('Connecté au serveur de notifications');
        this.isConnected = true;

        // Rejoindre la room utilisateur
        if (this.socket) {
          this.socket.emit('join:user-room');
        }
      });

      // Événement de réception de nouvelle notification
      this.socket.on('notification:new', (notification: Notification) => {
        console.log('Nouvelle notification reçue:', notification);
        this.notifyCallbacks(notification);
      });

      // Événement de déconnexion
      this.socket.on('disconnect', () => {
        console.log('Déconnecté du serveur de notifications');
        this.isConnected = false;
      });

      // Gestion des erreurs
      this.socket.on('error', (error) => {
        console.error('Erreur Socket.io:', error);
      });
    } catch (error) {
      console.error('Erreur lors de la connexion Socket.io:', error);
    }
  }

  /**
   * Déconnecter de Socket.io
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * S'abonner aux nouvelles notifications
   */
  onNewNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);

    // Retourner une fonction pour se désabonner
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifier tous les callbacks
   */
  private notifyCallbacks(notification: Notification) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erreur dans le callback de notification:', error);
      }
    });
  }

  /**
   * Récupérer toutes les notifications (paginé)
   */
  async getNotifications(limit = 50, skip = 0): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const response = await api.get('/notifications', {
        params: { limit, skip },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications/unread');
      return response.data.notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications non lues:', error);
      throw error;
    }
  }

  /**
   * Récupérer le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erreur lors de la marque de notification comme lue:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/read/all');
    } catch (error) {
      console.error('Erreur lors de la marque de toutes les notifications comme lues:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }

  /**
   * Vérifier si connecté à Socket.io
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default new NotificationService();
