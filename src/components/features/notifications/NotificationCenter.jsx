import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaTimes, FaCheck, FaCheckDouble, FaMusic, FaStar } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useAxios from "../../../hooks/useAxios";
import io from "socket.io-client";
import { avatarFromEmail } from "../../../utils/avatarFromEmail";

const containsBengaliCharacters = (text = "") => /[ঀ-৿]/.test(text);

const DEFAULT_COPY_BY_TYPE = {
  review: {
    title: "New review received",
    message: "A listener just left a new review.",
  },
  review_new: {
    title: "New review received",
    message: "A listener just left a new review.",
  },
  "review:new": {
    title: "New review received",
    message: "A listener just left a new review.",
  },
  feedback: {
    title: "New feedback received",
    message: "Someone just shared fresh feedback.",
  },
};

const PATTERN_MAPPINGS = [
  {
    keywords: ["নতুন রিভিউ এসেছে"],
    title: "New review received",
    message: "A listener just left a new review.",
  },
];

const getDefaultCopy = (notification = {}) => {
  const copy = DEFAULT_COPY_BY_TYPE[notification.type];
  if (copy) return copy;
  return {
    title: "New notification",
    message: "You have a new update on Healers.",
  };
};

const normalizeNotification = (notification = {}) => {
  const normalized = { ...notification };
  const { title = "", message = "" } = notification;

  for (const { keywords, title: mappedTitle, message: mappedMessage } of PATTERN_MAPPINGS) {
    const matched = keywords.some((keyword) =>
      (title && title.includes(keyword)) || (message && message.includes(keyword))
    );

    if (matched) {
      if (mappedTitle) normalized.title = mappedTitle;
      if (mappedMessage) normalized.message = mappedMessage;
      return normalized;
    }
  }

  const shouldReplaceTitle = containsBengaliCharacters(title);
  const shouldReplaceMessage = containsBengaliCharacters(message);

  if (shouldReplaceTitle || shouldReplaceMessage) {
    const defaults = getDefaultCopy(notification);
    if (shouldReplaceTitle) {
      normalized.title = defaults.title;
    }
    if (shouldReplaceMessage) {
      normalized.message = defaults.message;
    }
  }

  return normalized;
};

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get, put } = useAxios();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState({});
  const panelRef = useRef();
  const socketRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await get(`/api/notifications/${user.uid}`);
      setNotifications((res.data.notifications || []).map(normalizeNotification));
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
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:user", user.uid);
    });

    // Listen for new notifications
    socket.on("notification:new", (notification) => {
      console.log("New notification received:", notification);
      const normalized = normalizeNotification(notification);
      setNotifications(prev => [normalized, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      toast.success(
        <div className="flex items-center gap-2">
          <FaBell className="text-yellow-400" />
          <span>{normalized.title}</span>
        </div>,
        { duration: 4000 }
      );
    });

    socket.on("disconnect", () => {
      console.log(" Socket disconnected");
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

  const renderRatingStars = (value) => {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
    return Array.from({ length: 5 }, (_, idx) => (
      <FaStar
        key={idx}
        className={`text-[10px] ${idx < rating ? "text-yellow-400" : "text-gray-600"}`}
      />
    ));
  };

  const handleReviewDecision = async (notification, nextStatus) => {
    const reviewId = notification?.metadata?.reviewId;
    if (!reviewId) {
      toast.error("Missing review reference");
      return;
    }

    setReviewActionLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await put(`/api/reviews/${reviewId}/status`, { status: nextStatus });
      toast.success(
        nextStatus === "approved" ? "Review approved" : "Review declined"
      );

      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id
            ? {
                ...n,
                isRead: true,
                metadata: { ...(n.metadata || {}), reviewStatus: nextStatus },
              }
            : n
        )
      );
    } catch (error) {
      console.error("Failed to update review status:", error);
      toast.error("Failed to update review status");
    } finally {
      setReviewActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[reviewId];
        return updated;
      });
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
    } else if (notification.type === "song_added") {
      // For song added notifications, we can just close the panel
      // The user can check their chat or songs list
      setIsOpen(false);
      // Optionally, you could navigate to chat or songs page here
      // navigate('/chat'); // if you have a chat route
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
                  toast.success("Invitation accepted!");
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

  // Get icon based on notification type - Spotify Style
  const getNotificationIcon = (type) => {
    switch (type) {
      case "playlist_invitation":
        return <BiSolidPlaylist className="text-[#1db954]" />;
      case "invitation_accepted":
        return <FaCheck className="text-[#1db954]" />;
      case "song_added":
        return <FaMusic className="text-[#1db954]" />;
      case "review_submitted":
        return <FaStar className="text-yellow-400" />;
      default:
        return <FaMusic className="text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button - Spotify Style */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <FaBell className="text-xl text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-[#1db954] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
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
            className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-3 sm:w-80 md:w-96 bg-[#282828] border border-gray-800 rounded-lg shadow-2xl z-[9999] overflow-hidden max-w-[calc(100vw-1rem)]"
          >
            {/* Header - Spotify Style */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaBell className="text-gray-400" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1db954] text-white">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
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
                  <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <FaBell className="text-5xl text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications</p>
                  <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notif) => {
                    const isReviewNotification = notif.type === "review_submitted";
                    const reviewId = notif?.metadata?.reviewId;
                    const reviewStatus = notif?.metadata?.reviewStatus;
                    const isReviewHandled = isReviewNotification && Boolean(reviewStatus);
                    const isActionLoading = Boolean(reviewId && reviewActionLoading[reviewId]);
                      const reviewRating = isReviewNotification ? notif?.metadata?.rating : null;
                      const reviewerName = isReviewNotification
                        ? notif?.metadata?.userName ||
                          notif?.metadata?.userEmail ||
                          "Anonymous listener"
                        : "";
                      const reviewerEmail = isReviewNotification ? notif?.metadata?.userEmail || "" : "";
                      const reviewerImage = isReviewNotification ? notif?.metadata?.userImage || "" : "";
                      const reviewComment = isReviewNotification ? notif?.metadata?.comment || "" : "";
      const avatarUrl =
        reviewerImage || (reviewerEmail ? avatarFromEmail(reviewerEmail) : "/healers.png");

                    return (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-white/10 transition-colors cursor-pointer ${
                          !notif.isRead ? "bg-white/5" : ""
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
                                !notif.isRead ? "text-white" : "text-gray-300"
                              }`}>
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#1db954] flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                            {isReviewNotification && (
                              <div className="mt-3 flex gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1f1f1f] border border-gray-700 flex-shrink-0">
                    <img
                      src={avatarUrl || "/healers.png"}
                                    alt={reviewerName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                        e.target.src = "/healers.png";
                                      e.target.onerror = null;
                                    }}
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {reviewerName}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                    <div className="flex items-center gap-1">
                                      {renderRatingStars(reviewRating)}
                                    </div>
                                    {reviewRating ? (
                                      <span className="font-semibold text-gray-300">
                                        {Math.round(Number(reviewRating) || 0)}/5
                                      </span>
                                    ) : (
                                      <span>No rating</span>
                                    )}
                                  </div>
                                  {reviewComment && (
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-3">
                                      {reviewComment}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {isReviewNotification && isReviewHandled && (
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2 py-1 rounded-full ${
                                  reviewStatus === "approved"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {reviewStatus === "approved" ? "Approved" : "Declined"}
                              </span>
                            )}
                            {isReviewNotification && !isReviewHandled && (
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewDecision(notif, "approved");
                                  }}
                                  disabled={!reviewId || isActionLoading}
                                  className="px-3 py-1.5 rounded-full bg-[#1db954] text-black text-xs font-semibold hover:bg-[#1ed760] transition disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewDecision(notif, "rejected");
                                  }}
                                  disabled={!reviewId || isActionLoading}
                                  className="px-3 py-1.5 rounded-full bg-gray-700 text-white text-xs font-semibold hover:bg-gray-600 transition disabled:opacity-60"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar - Spotify Style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #535353;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #727272;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;

