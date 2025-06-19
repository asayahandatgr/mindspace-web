import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/all');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Gagal ambil notifikasi:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleNotifClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Gagal tandai semua dibaca:', e);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Gagal tandai dibaca:', e);
    }
  };

  const getLink = (n) => {
    switch (n.type) {
      case 'like':
      case 'comment':
      case 'reply':
        return `/articles/${n.article?._id}`;
      case 'forum_comment':
      case 'forum_reply':
        return `/forum/${n.forum?._id}`;
      case 'consultation_message':
        return `/consultations/${n.consultation?._id}`;
      default:
        return '#';
    }
  };

  const getContent = (n) => {
    const sender = n.sender?.username || 'Seseorang';
    switch (n.type) {
      case 'like':
        return `${sender} menyukai artikelmu "${n.article?.title}"`;
      case 'comment':
        return `${sender} mengomentari artikelmu "${n.article?.title}"`;
      case 'reply':
        return `${sender} membalas komentarmu di "${n.article?.title}"`;
      case 'forum_comment':
        return `${sender} mengomentari forum "${n.forum?.title}"`;
      case 'forum_reply':
        return `${sender} membalas forum "${n.forum?.title}"`;
      case 'consultation_message':
        return `${sender} mengirim pesan di konsultasi`;
      default:
        return 'Notifikasi baru';
    }
  };

  if (isMobile && isOpen) {
    return (
      <div className="fixed inset-0 bg-white z-50 p-4 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 pb-2 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Notifikasi</h2>
          <button onClick={() => setIsOpen(false)} className="text-sm text-red-500">Tutup</button>
        </div>

        {notifications.length === 0 ? (
          <p className="mt-4 text-gray-600 text-sm">Belum ada notifikasi.</p>
        ) : (
          <>
            <button onClick={handleMarkAllAsRead} className="text-indigo-600 text-sm mt-4 mb-2">Tandai semua sudah dibaca</button>
            {notifications.map(n => (
              <Link to={getLink(n)} key={n._id} onClick={() => handleMarkAsRead(n._id)}>
                <div className={`p-4 mb-2 rounded-lg border ${!n.isRead ? 'bg-indigo-50' : 'bg-white'}`}>
                  <p className="text-sm font-medium text-gray-800">{getContent(n)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(n.createdAt).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleNotifClick}
        className="relative p-2"
        aria-label="Notifikasi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 10-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 006 19h12a1 1 0 00.71-1.71L18 16z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white z-10">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && !isMobile && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100">
          <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifikasi
              </h3>
              {notifications.length > 0 && (
                <button onClick={handleMarkAllAsRead} className="text-sm text-white hover:text-indigo-100 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Tandai semua
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500">Belum ada notifikasi.</div>
            ) : (
              notifications.map(n => (
                <Link to={getLink(n)} key={n._id} onClick={() => handleMarkAsRead(n._id)} className={`block p-4 border-b hover:bg-gray-50 transition-colors duration-200 ${!n.isRead ? 'bg-indigo-50' : ''}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${!n.isRead ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{getContent(n)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;