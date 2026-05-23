import { useEffect, useState, useCallback } from 'react';
import notificationService, { Notification } from '../services/notification.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications au montage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const data = await notificationService.getNotifications(50, 0);
        setNotifications(data.notifications);
        
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);

        // Connecter Socket.io
        notificationService.connect(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    return () => {
      notificationService.disconnect();
    };
  }, []);

  // S'abonner aux nouvelles notifications
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, lue: true } : n))
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la marque de notification');
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la marque des notifications');
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const wasUnread = !notifications.find((n) => n.id === notificationId)?.lue;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la notification');
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
