import { api } from './api';
import type { Notification } from '../types';

export type NotificationsResult = {
  notifications: Notification[];
  unread: number;
};

export function fetchNotifications() {
  return api<NotificationsResult>('/notifications');
}

export function markNotificationRead(id: string) {
  return api<{ notification: { id: string; ready: boolean } }>(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
}

export function markAllNotificationsRead() {
  return api<{ updated: number }>('/notifications/read-all', { method: 'PATCH' });
}
