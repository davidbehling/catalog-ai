import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { Participant } from '../models/Participant.js';
import { countUnreadNotifications, listNotifications } from '../services/notifications.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const notifications = await listNotifications(req.auth!.userId);
    const unread = await countUnreadNotifications(req.auth!.userId);

    res.json({ notifications, unread });
  } catch (error) {
    next(error);
  }
});

/**
 * Marca a notificação como lida.
 *
 * Ler um convite ativa a participação pendente do usuário na empresa,
 * concluindo o aceite do convite.
 */
notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.auth!.userId
    }).lean();

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    if (!notification.ready) {
      await Notification.updateOne({ _id: notification._id }, { $set: { ready: true } });

      await Participant.updateMany(
        { user_id: req.auth!.userId, company_id: notification.company_id, status: 'pending' },
        { $set: { status: 'activated' } }
      );
    }

    res.json({ notification: { id: String(notification._id), ready: true } });
  } catch (error) {
    next(error);
  }
});

/** Marca todas as notificações do usuário como lidas. */
notificationsRouter.patch('/read-all', async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.auth!.userId, ready: false },
      { $set: { ready: true } }
    );

    res.json({ updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
});
