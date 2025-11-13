import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";
import toast from "react-hot-toast";
import { FaPaperPlane, FaMusic, FaUser, FaTimes, FaTrash, FaEllipsisV } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ChatBox = () => {
  const { user } = useAuth();
  const { get, post, del } = useAxios();
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isRequest, setIsRequest] = useState(false);
  const [requestData, setRequestData] = useState({
    songName: "",
    artistName: "",
    movieName: "",
    youtubeLink: "",
  });
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.uid) return;

    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("join:user", user.uid);
    });

    const handleNewMessage = (newMessage) => {
      // Prevent duplicate messages
      setMessages((prev) => {
        const messageId = newMessage._id?.toString() || newMessage.id?.toString();
        const exists = prev.some(
          (msg) => (msg._id?.toString() || msg.id?.toString()) === messageId
        );
        if (exists) {
          return prev; // Don't add duplicate
        }
        return [...prev, newMessage];
      });
      scrollToBottom();
    };

    const handleRequestUpdated = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg._id?.toString() || msg.id?.toString();
          const updateMessageId = messageId?.toString();
          if (msgId === updateMessageId) {
            return { ...msg, requestData: { ...msg.requestData, status } };
          }
          return msg;
        })
      );
    };

    const handleChatDeleted = ({ chatId }) => {
      const targetId = chatId?.toString();
      if (!targetId) return;
      setMenuOpenId(null);
      setChat((prevChat) => {
        if (prevChat?._id?.toString() === targetId) {
          setMessages([]);
          setIsOpen(false);
          toast.success("Chat deleted");
          return null;
        }
        return prevChat;
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      const targetId = messageId?.toString();
      if (!targetId) return;
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            (msg._id?.toString() || msg.id?.toString()) !== targetId
        )
      );
      setMenuOpenId((prev) => (prev === targetId ? null : prev));
      setExpandedMessageId((prev) => (prev === targetId ? null : prev));
    };

    newSocket.on("chat:message", handleNewMessage);
    newSocket.on("chat:request:updated", handleRequestUpdated);
    newSocket.on("chat:deleted", handleChatDeleted);
    newSocket.on("chat:message:deleted", handleMessageDeleted);

    setSocket(newSocket);

    return () => {
      newSocket.off("chat:message", handleNewMessage);
      newSocket.off("chat:request:updated", handleRequestUpdated);
      newSocket.off("chat:deleted", handleChatDeleted);
      newSocket.off("chat:message:deleted", handleMessageDeleted);
      newSocket.disconnect();
    };
  }, [user]);

  // Load chat when opened
  useEffect(() => {
    if (isOpen && user?.uid && !chat) {
      loadChat();
    }
  }, [isOpen, user, chat]);

  useEffect(() => {
    if (!isOpen) {
      setMenuOpenId(null);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAdminProfile = async (adminId) => {
    if (!adminId) {
      setAdminProfile(null);
      return;
    }
    try {
      const res = await get("/api/admins");
      const admins = res?.data?.admins || [];
      const found = admins.find((admin) => admin.uid === adminId);
      setAdminProfile(found || null);
    } catch (error) {
      console.error("Failed to fetch admin profile:", error);
      setAdminProfile(null);
    }
  };

  const loadChat = async () => {
    try {
      setLoading(true);
      const res = await get("/api/chat/user");
      setChat(res.data.chat);
      setMessages(res.data.messages || []);
      setExpandedMessageId(null);
      await fetchAdminProfile(res.data.chat?.adminId);
      
      if (socket && res.data.chat) {
        socket.emit("join:chat", res.data.chat._id);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      toast.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chat || (!message.trim() && !isRequest) || sending) return;

    if (isRequest) {
      if (!requestData.songName.trim() || !requestData.artistName.trim()) {
        toast.error("Song name and artist name are required");
        return;
      }
    }

    try {
      setSending(true);
      const payload = {
        chatId: chat._id,
        message: message.trim(),
        isRequest,
        requestData: isRequest ? requestData : undefined,
      };

      await post("/api/chat/message", payload);
      // Don't add message to state here - let Socket.IO handle it
      // This prevents duplicate messages
      setMessage("");
      if (isRequest) {
        setRequestData({
          songName: "",
          artistName: "",
          movieName: "",
          youtubeLink: "",
        });
        setIsRequest(false);
        toast.success("Music request sent!");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || deleting) return;
    try {
      setDeleting(true);
      const targetId = messageId.toString();
      await del(`/api/chat/message/${targetId}`);
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            (msg._id?.toString() || msg.id?.toString()) !== targetId
        )
      );
      setMenuOpenId(null);
      setExpandedMessageId((prev) => (prev === targetId ? null : prev));
      toast.success("Message deleted");
    } catch (err) {
      console.error("Failed to delete message:", err);
      toast.error("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClasses = (status) => {
    const normalized = (status || "").toLowerCase();
    const base = "px-2 py-1 rounded text-xs font-semibold";
    switch (normalized) {
      case "approved":
        return `${base} border border-green-400 text-green-300`;
      case "rejected":
        return `${base} border border-red-400 text-red-300`;
      case "added":
        return `${base} bg-white text-black border border-white`;
      case "pending":
        return `${base} border border-yellow-400 text-yellow-300`;
      default:
        return `${base} border border-blue-400 text-blue-300`;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button - Spotify Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#1db954] text-white shadow-lg hover:bg-[#1ed760] hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open chat"
        style={{ zIndex: 10000 }}
      >
        <FaMusic className="text-xl" />
      </button>

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[450px] bg-[#282828] rounded-lg shadow-2xl border border-gray-800 flex flex-col overflow-hidden"
            style={{ zIndex: 10000 }}
          >
            {/* Header - Spotify Style */}
            <div className="bg-[#181818] p-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2">
                <FaUser className="text-gray-400" />
                <h3 className="text-white font-semibold">Chat with Admin</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3"
              onClick={() => setMenuOpenId(null)}
            >
              {loading ? (
                <div className="text-center text-gray-400 py-8">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <FaMusic className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Send a music request!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const messageId =
                    msg._id?.toString() || msg.id?.toString() || `msg-${index}`;
                  const isOwnMessage = msg.senderId === user.uid;
                  const isExpanded = expandedMessageId === messageId;
                  return (
                    <div
                      key={messageId}
                      className={`flex flex-col ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          isOwnMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedMessageId((prev) =>
                              prev === messageId ? null : messageId
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedMessageId((prev) =>
                                prev === messageId ? null : messageId
                              );
                            }
                          }}
                          className={`relative max-w-[80%] rounded-lg p-3 overflow-hidden break-words cursor-pointer focus:outline-none ${
                            isOwnMessage
                              ? "bg-[#1db954] text-white"
                              : "bg-[#181818] text-gray-100"
                          }`}
                        >
                          {msg.isRequest ? (
                            <div className="space-y-2 break-words">
                              <div className="font-semibold text-sm break-words">
                                Music Request
                              </div>
                              <div className="text-xs space-y-1 break-words">
                                <p>
                                  <span className="font-semibold">Song:</span>{" "}
                                  {msg.requestData?.youtubeLink ? (
                                    <a
                                      href={msg.requestData.youtubeLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-300 hover:underline"
                                    >
                                      {msg.requestData?.songName || "View"}
                                    </a>
                                  ) : (
                                    msg.requestData?.songName
                                  )}
                                </p>
                                <p>
                                  <span className="font-semibold">Artist:</span>{" "}
                                  {msg.requestData?.artistName}
                                </p>
                                {msg.requestData?.movieName && (
                                  <p>
                                    <span className="font-semibold">Movie:</span>{" "}
                                    {msg.requestData.movieName}
                                  </p>
                                )}
                                <div className="mt-2">
                                  <span className={getStatusBadgeClasses(msg.requestData?.status)}>
                                    {msg.requestData?.status || "pending"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          )}
                        </div>
                        {isOwnMessage && (
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId((prev) => (prev === messageId ? null : messageId));
                              }}
                              aria-label="Open message menu"
                            >
                              <FaEllipsisV className="text-sm" />
                            </button>
                            {menuOpenId === messageId && (
                              <div
                                className={`absolute top-full mt-2 left-0 origin-top-right bg-[#121212] border border-gray-700 rounded-md shadow-lg overflow-hidden z-20 min-w-[140px]`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(messageId);
                                  }}
                                  disabled={deleting}
                                >
                                  <FaTrash />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-2 mt-1 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isExpanded && (
                          <span className="text-[10px] text-gray-400">
                            {formatTime(msg.createdAt)}
                          </span>
                        )}
                        {isOwnMessage && msg.isRead && (
                          adminProfile?.image ? (
                            <img
                              src={adminProfile.image}
                              alt={adminProfile.name || "Seen"}
                              className="w-4 h-4 rounded-full border border-[#1f1f1f] object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-600 text-white flex items-center justify-center text-[8px]">
                              <FaUser className="text-[10px]" />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Request Toggle - Spotify Style */}
            <div className="px-4 py-2 border-t border-gray-700">
              <button
                onClick={() => setIsRequest(!isRequest)}
                className={`w-full py-2 rounded-full text-sm font-semibold transition-all ${
                  isRequest
                    ? "bg-[#1db954] text-white hover:bg-[#1ed760]"
                    : "bg-[#181818] text-gray-300 hover:bg-white/10 border border-gray-700"
                }`}
              >
                {isRequest ? "Cancel Request" : "Send Music Request"}
              </button>
            </div>

            {/* Request Form - Spotify Style */}
            {isRequest && (
              <div className="px-4 py-2 border-t border-gray-700 bg-[#181818] space-y-2">
                <input
                  type="text"
                  placeholder="Song Name *"
                  value={requestData.songName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, songName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                />
                <input
                  type="text"
                  placeholder="Artist Name *"
                  value={requestData.artistName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, artistName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                />
                <input
                  type="text"
                  placeholder="Movie Name (Optional)"
                  value={requestData.movieName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, movieName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                />
                <input
                  type="url"
                  placeholder="YouTube Link (Optional)"
                  value={requestData.youtubeLink}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      youtubeLink: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                />
              </div>
            )}

            {/* Message Input - Spotify Style */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isRequest ? "Add a message (optional)" : "Type a message..."}
                  className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                  disabled={isRequest}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-[#1db954] text-white rounded-full hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

