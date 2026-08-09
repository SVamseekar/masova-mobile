import httpClient from '../http/client';
import { Notification } from '../../types';

export const notificationApi = {
  getUserNotifications: async (userId: string, recent?: boolean): Promise<Notification[]> => {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (recent) params.append('recent', 'true');

    const response = await httpClient.get<Notification[]>(`/notifications?${params.toString()}`);
    return response.data || [];
  },

  getAll: async (userId: string): Promise<Notification[]> => {
    return notificationApi.getUserNotifications(userId);
  },

  getUnreadNotifications: async (userId: string): Promise<Notification[]> => {
    const response = await httpClient.get<Notification[]>(`/notifications?userId=${encodeURIComponent(userId)}&unread=true`);
    return response.data || [];
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await httpClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await httpClient.patch(`/notifications/read-all?userId=${encodeURIComponent(userId)}`);
  },

  markAllRead: async (userId: string): Promise<void> => {
    return notificationApi.markAllAsRead(userId);
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await httpClient.delete(`/notifications/${notificationId}`);
  },
};

export default notificationApi;
