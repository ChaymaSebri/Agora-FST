import { useEffect, useState, useCallback } from 'react';
import notificationService, { Notification } from '../services/notification.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications(50, 0);
      const notificationsList = Array.isArray((data as any)?.notifications) ? (data as any).notifications : [];
      console.log('Notifications reçues du service:', notificationsList);
      setNotifications(notificationsList);
      
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return { notifications: notificationsList, total: Number((data as any)?.total || 0) };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications';
      setError(message);
      console.error('Erreur dans loadNotifications:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les notifications au montage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    loadNotifications();

    // Connecter Socket.io
    notificationService.connect(token);

    return () => {
      notificationService.disconnect();
    };
  }, [loadNotifications]);

  // S'abonner aux nouvelles notifications
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((newNotification) => {
      setNotifications((prev) => [
        { ...newNotification, etat: newNotification.etat || 'ferme', lue: false },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, etat: 'ouvert', lue: true } : n))
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
      
      setNotifications((prev) => prev.map((n) => ({ ...n, etat: 'ouvert', lue: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la marque des notifications');
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const wasUnread = notifications.find((n) => n.id === notificationId)?.etat === 'ferme';
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
    loadNotifications,
  };
}
