import React from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function Toast() {
  const { notification, setNotification } = useHoneyChain();

  if (!notification) return null;

  return (
    <div className={`toast-container toast-${notification.type || 'success'}`}>
      <div className="toast-icon">
        {notification.type === 'info' ? 'ℹ️' : '✨'}
      </div>
      <div className="toast-content">
        <div className="toast-title">
          {notification.type === 'info' ? 'Ledger Notification' : 'Blockchain Event'}
        </div>
        <div className="toast-message">{notification.message}</div>
      </div>
      <button
        className="toast-close"
        onClick={() => setNotification(null)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
