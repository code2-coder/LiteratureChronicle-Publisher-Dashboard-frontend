import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotificationBar = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  // For a MERN stack without Socket.io, we use polling as a replacement for PocketBase subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const fetchLatestNotifications = async () => {
      try {
        if (currentUser.role === 'admin') {
          const res = await apiClient.get('/withdrawals');
          const pending = res.data.filter(w => w.status === 'pending');
          if (pending.length > 0) {
            setNotifications([{
              id: 'pending-withdrawals',
              message: `There are ${pending.length} pending withdrawal requests to review.`,
              type: 'withdrawal'
            }]);
          }
        } else {
          // Authors could poll for new sales or royalty updates
          const res = await apiClient.get('/sales');
          // This is just a placeholder logic for notifications in a real app
          // In a real app, you'd have a dedicated notifications collection
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchLatestNotifications();
    const interval = setInterval(fetchLatestNotifications, 60000); // Polling every 60s

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!isVisible || notifications.length === 0) return null;

  return (
    <div className="bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        <span>{notifications[0].message}</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setIsVisible(false)} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBar;