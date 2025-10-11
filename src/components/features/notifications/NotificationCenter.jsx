import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaTimes, FaCheck, FaCheckDouble, FaEnvelope, FaMusic } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useAxios from "../../../hooks/useAxios";
import io from "socket.io-client";

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get, put } = useAxios();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef();
  const socketRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await get(`/api/notifications/${user.uid}`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
    setLoading(false);
  };

  // Setup Socket.io connection
  useEffect(() => {
    if (!user?.uid) return;

    // Connect to socket server
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      socket.emit("join:user", user.uid);
    });

    // Listen for new notifications
    socket.on("notification:new", (notification) => {
      console.log("New notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      toast.success(
        <div className="flex items-center gap-2">
          <FaBell className="text-yellow-400" />
          <span>{notification.title}</span>
        </div>,
        { duration: 4000 }
      );
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      socket.emit("leave:user", user.uid);
      socket.disconnect();
    };
  }, [user?.uid]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [user?.uid]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await put(`/api/notifications/user/${user.uid}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Handle different notification types
    if (notification.type === "playlist_invitation") {
      // Navigate to invitations or show accept/reject options
      const invitationId = notification.metadata?.invitationId;
      if (invitationId) {
        handleInvitationAction(invitationId, notification);
      }
    } else if (notification.metadata?.playlistId) {
      // Navigate to playlist
      navigate(`/playlist/${notification.metadata.playlistId}`);
      setIsOpen(false);
    }
  };

  // Handle invitation accept/reject
  const handleInvitationAction = (invitationId, notification) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">{notification.title}</p>
          <p className="text-sm text-gray-600">{notification.message}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await put(`/api/invitations/${invitationId}/accept`);
                  toast.success("✅ Invitation accepted!");
                  fetchNotifications();
                  navigate(`/playlist/${notification.metadata.playlistId}`);
                  setIsOpen(false);
                } catch {
                  toast.error("Failed to accept invitation");
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Accept
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await put(`/api/invitations/${invitationId}/reject`);
                  toast.success("Invitation rejected");
                  fetchNotifications();
                } catch {
                  toast.error("Failed to reject invitation");
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              Reject
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "playlist_invitation":
        return <BiSolidPlaylist className="text-purple-400" />;
      case "invitation_accepted":
        return <FaCheck className="text-green-400" />;
      default:
        return <FaMusic className="text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <FaBell className="text-xl text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-gradient-to-br from-gray-900 via-purple-900 to-fuchsia-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-xl z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaBell className="text-purple-400" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <FaCheckDouble />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <FaBell className="text-5xl text-purple-400/50 mx-auto mb-3" />
                  <p className="text-purple-200">No notifications</p>
                  <p className="text-purple-300/70 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-purple-500/20">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notif.isRead ? "bg-purple-500/10" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-semibold text-sm ${
                              !notif.isRead ? "text-white" : "text-purple-200"
                            }`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-purple-300 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-purple-400/70 mt-2">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;

