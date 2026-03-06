import React, { useState, useEffect } from 'react';
import { fetchNotifications } from '../../api/mockApi';
import { bindNotificationHandlers } from '../../utils/helpers';
import type { Notification } from '../../api/mockApi';

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchNotifications().then((data) => {
      setNotifications(data);
      setReadIds(new Set(data.filter(n => n.read).map(n => n.id)));
    });
  }, []);

  const handlers = bindNotificationHandlers(notifications, (id) => {
    setSelected(id);
    setReadIds(prev => new Set(prev).add(id));
  });

  return (
    <div className="notification-dropdown" style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      width: '320px',
      background: 'var(--surface, #ffffff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 99999,
      maxHeight: '400px',
      overflowY: 'auto',
    }}>
      <h3 style={{ padding: '12px 16px', margin: 0, borderBottom: '1px solid var(--border, #e2e8f0)', position: 'sticky', top: 0, background: 'var(--surface, #ffffff)', zIndex: 1 }}>
        Notifications
      </h3>
      {selected !== null && (
        <div style={{
          padding: '10px 16px',
          background: '#f0f0ff',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          fontSize: '13px',
          color: '#4f46e5',
          fontWeight: 500,
          position: 'sticky',
          top: '45px',
          zIndex: 1,
        }}>
          Viewing notification #{selected}
        </div>
      )}
      {notifications.map((n, idx) => {
        const isRead = readIds.has(n.id);
        return (
          <div
            key={n.id}
            onClick={handlers[idx]}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              background: isRead ? 'transparent' : '#f8f9ff',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{
              flexShrink: 0,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isRead ? 'transparent' : '#4f46e5',
              marginTop: '5px',
              transition: 'background 0.2s',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: '14px' }}>{n.title}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                {n.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
