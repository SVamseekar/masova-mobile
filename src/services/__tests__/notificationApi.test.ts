import httpClient from '../http/client';
import { notificationApi } from '../api/notificationApi';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('notificationApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications & getAll', () => {
    it('fetches user notifications with optional recent flag', async () => {
      const mockNotifs = [{ id: 'notif_1', title: 'Order Update' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockNotifs });

      const res = await notificationApi.getUserNotifications('user_99', true);

      expect(httpClient.get).toHaveBeenCalledWith('/notifications?userId=user_99&recent=true');
      expect(res).toEqual(mockNotifs);
    });

    it('getAll delegates to getUserNotifications', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });
      await notificationApi.getAll('user_99');
      expect(httpClient.get).toHaveBeenCalledWith('/notifications?userId=user_99');
    });
  });

  describe('getUnreadNotifications', () => {
    it('fetches unread notifications for user', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [{ id: 'n1' }] });

      const res = await notificationApi.getUnreadNotifications('user_99');

      expect(httpClient.get).toHaveBeenCalledWith('/notifications?userId=user_99&unread=true');
      expect(res).toHaveLength(1);
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('markAsRead patches notification by ID', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'notif_1', isRead: true } });

      const res = await notificationApi.markAsRead('notif_1');

      expect(httpClient.patch).toHaveBeenCalledWith('/notifications/notif_1/read');
      expect(res.isRead).toBe(true);
    });

    it('markAllAsRead and markAllRead patch read-all endpoint', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: null });

      await notificationApi.markAllAsRead('user_99');
      expect(httpClient.patch).toHaveBeenCalledWith('/notifications/read-all?userId=user_99');

      await notificationApi.markAllRead('user_99');
      expect(httpClient.patch).toHaveBeenCalledWith('/notifications/read-all?userId=user_99');
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification by ID', async () => {
      (httpClient.delete as jest.Mock).mockResolvedValue({ data: null });

      await notificationApi.deleteNotification('notif_1');

      expect(httpClient.delete).toHaveBeenCalledWith('/notifications/notif_1');
    });
  });
});
