import { Notification } from '../models/Notification.js';

export type NotificationView = {
  id: string;
  title: string;
  message: string;
  ready: boolean;
  companyId: string;
  createdAt: string;
};

export async function createNotification(input: {
  userId: string;
  companyId: string;
  title: string;
  message: string;
}) {
  return Notification.create({
    user_id: input.userId,
    company_id: input.companyId,
    title: input.title,
    message: input.message,
    ready: false
  });
}

export async function listNotifications(userId: string): Promise<NotificationView[]> {
  const notifications = await Notification.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return notifications.map((notification) => ({
    id: String(notification._id),
    title: notification.title,
    message: notification.message,
    ready: notification.ready,
    companyId: String(notification.company_id),
    createdAt: notification.createdAt.toISOString()
  }));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return Notification.countDocuments({ user_id: userId, ready: false });
}
