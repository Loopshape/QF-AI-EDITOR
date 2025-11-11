

import ReactDOM from 'react-dom/client';
import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'info' | 'warn' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Allow fade-out animation
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-600',
    info: 'bg-cyan-600',
    warn: 'bg-amber-400',
    error: 'bg-red-700',
  }[type];

  const textColor = type === 'warn' ? 'text-zinc-900' : 'text-white';

  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-3 rounded-md shadow-lg transition-opacity duration-500 ${bgColor} ${textColor}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{ fontFamily: 'var(--font-family)', fontSize: '12px' }}
    >
      {message}
    </div>
  );
};

export const quantumNotify = (message: string, type: 'success' | 'info' | 'warn' | 'error' = 'info') => {
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) {
    console.error('Portal root not found for notifications.');
    return;
  }

  const div = document.createElement('div');
  portalRoot.appendChild(div);

  const root = ReactDOM.createRoot(div);

  const handleClose = () => {
    root.unmount();
    portalRoot.removeChild(div);
  };

  // Render the Notification component with its props
  root.render(<Notification message={message} type={type} onClose={handleClose} />);
};
