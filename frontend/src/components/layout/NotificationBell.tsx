import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/notifications';
import type { Notification } from '../../types';

type NotificationBellProps = {
  onError: (message: string) => void;
};

export default function NotificationBell({ onError }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications()
      .then((result) => {
        setNotifications(result.notifications);
        setUnread(result.unread);
      })
      .catch((e: Error) => onError(e.message));
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  async function handleRead(notification: Notification) {
    setOpen(false);

    if (notification.ready) return;

    try {
      await markNotificationRead(notification.id);

      setNotifications((old) => old.map((item) => item.id === notification.id ? { ...item, ready: true } : item));
      setUnread((count) => Math.max(0, count - 1));
    } catch (e) {
      onError((e as Error).message);
    }
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead();

      setNotifications((old) => old.map((item) => ({ ...item, ready: true })));
      setUnread(0);
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        className="icon-button notification-trigger"
        title="Notificações"
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={17}/>
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-head">
            <strong>Notificações</strong>
            {unread > 0 && (
              <button className="link-button" onClick={handleReadAll}>
                <CheckCheck size={13}/> Marcar todas
              </button>
            )}
          </div>

          {notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-item ${notification.ready ? 'read' : 'unread'}`}
                  onClick={() => handleRead(notification)}
                >
                  <span className="notification-title">{notification.title}</span>
                  <span className="notification-message">{notification.message}</span>
                  <span className="notification-date">
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="notification-empty">Nenhuma notificação por aqui.</div>
          )}
        </div>
      )}
    </div>
  );
}
