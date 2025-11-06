import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";
import toast from "react-hot-toast";
import { FaPaperPlane, FaMusic, FaUser, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const ChatBox = () => {
  const { user } = useAuth();
  const { get, post } = useAxios();
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

    newSocket.on("chat:message", (newMessage) => {
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
    });

    newSocket.on("chat:request:updated", ({ messageId, status }) => {
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
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Load chat when opened
  useEffect(() => {
    if (isOpen && user?.uid && !chat) {
      loadChat();
    }
  }, [isOpen, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = async () => {
    try {
      setLoading(true);
      const res = await get("/api/chat/user");
      setChat(res.data.chat);
      setMessages(res.data.messages || []);
      
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
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
            className="fixed bottom-24 right-6 w-96 h-[450px] bg-gradient-to-br from-gray-900 via-purple-900/90 to-fuchsia-900/80 rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden"
            style={{ zIndex: 10000 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaUser className="text-white" />
                <h3 className="text-white font-bold">Chat with Admin</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
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
                  // Use unique key - combine _id with index as fallback
                  const messageId = msg._id?.toString() || msg.id?.toString() || `msg-${index}`;
                  return (
                  <div
                    key={messageId}
                    className={`flex ${
                      msg.senderId === user.uid ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.senderId === user.uid
                          ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      {msg.isRequest ? (
                        <div className="space-y-2">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            <FaMusic className="text-xs" />
                            Music Request
                          </div>
                          <div className="text-xs space-y-1">
                            <p>
                              <span className="font-semibold">Song:</span>{" "}
                              {msg.requestData?.songName}
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
                            {msg.requestData?.youtubeLink && (
                              <p>
                                <span className="font-semibold">YouTube:</span>{" "}
                                <a
                                  href={msg.requestData.youtubeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-300 hover:underline"
                                >
                                  Link
                                </a>
                              </p>
                            )}
                            <div className="mt-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  msg.requestData?.status === "added"
                                    ? "bg-blue-500"
                                    : msg.requestData?.status === "approved"
                                    ? "bg-green-500"
                                    : msg.requestData?.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                              >
                                {msg.requestData?.status || "pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.message}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Request Toggle */}
            <div className="px-4 py-2 border-t border-purple-500/30">
              <button
                onClick={() => setIsRequest(!isRequest)}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                  isRequest
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {isRequest ? "Cancel Request" : "Send Music Request"}
              </button>
            </div>

            {/* Request Form */}
            {isRequest && (
              <div className="px-4 py-2 border-t border-purple-500/30 bg-gray-900/50 space-y-2">
                <input
                  type="text"
                  placeholder="Song Name *"
                  value={requestData.songName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, songName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Artist Name *"
                  value={requestData.artistName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, artistName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Movie Name (Optional)"
                  value={requestData.movieName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, movieName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-500/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isRequest ? "Add a message (optional)" : "Type a message..."}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isRequest}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

