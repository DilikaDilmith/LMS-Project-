import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const [allRes, unreadRes] = await Promise.allSettled([
        notificationAPI.getUserNotifications(userId),
        notificationAPI.getUnreadCount(userId)
      ]);

      if (allRes.status === 'fulfilled') {
        setNotifications(Array.isArray(allRes.value.data) ? allRes.value.data : []);
      } else {
        setNotifications([]);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(typeof unreadRes.value.data === 'number' ? unreadRes.value.data : 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };


  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId, userId);
      toast.success('Marked as read');
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await notificationAPI.delete(notificationId, userId);
      toast.success('Notification deleted');
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'ALL') return notifications;
    if (filter === 'UNREAD') return notifications.filter(n => !n.read);
    if (filter === 'READ') return notifications.filter(n => n.read);
    return notifications;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'bg-green-100 text-green-700 border-green-300';
      case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b p-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-xl font-bold text-blue-600">🔔 Notifications</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
            {unreadCount} Unread
          </span>
          <span className="text-sm text-gray-500">{notifications.length} Total</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('READ')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'READ' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Read
          </button>
          {filteredNotifications.length > 0 && (
            <span className="ml-auto text-sm text-gray-400 self-center">
              {filteredNotifications.length} notifications
            </span>
          )}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">🔕</div>
            <h3 className="text-lg font-semibold text-gray-700">No Notifications</h3>
            <p className="text-gray-500 text-sm mt-1">
              {filter === 'ALL' ? "You don't have any notifications yet." :
               filter === 'UNREAD' ? "You don't have any unread notifications." :
               "You don't have any read notifications."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 p-5 transition hover:shadow-md ${
                  notification.read ? 'border-gray-300' : 'border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h4 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {notification.message}
                    </p>
                    {notification.linkUrl && (
                      <Link
                        to={notification.linkUrl}
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;