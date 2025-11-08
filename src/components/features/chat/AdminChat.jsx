import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";
import toast from "react-hot-toast";
import { FaPaperPlane, FaMusic, FaUser, FaTimes, FaComments, FaArrowLeft, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const AdminChat = ({ isFloating = false }) => {
  const { user } = useAuth();
  const { get, post, put } = useAxios();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users/staff for client-side filtering
  const messagesEndRef = useRef(null);

  // Load conversations function - memoized with useCallback
  // Use ref to store get function to avoid dependency issues
  const getRef = useRef(get);
  useEffect(() => {
    getRef.current = get;
  }, [get]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await getRef.current("/api/chat/admin/conversations");
      
      // Handle different response formats
      let newConversations = [];
      if (res.data) {
        if (Array.isArray(res.data)) {
          newConversations = res.data;
        } else if (res.data.conversations) {
          newConversations = res.data.conversations;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          newConversations = res.data.data;
        }
      }
      
      // Only update state if conversations actually changed
      setConversations((prev) => {
        // Compare by length and IDs to avoid unnecessary updates
        if (prev.length !== newConversations.length) {
          return newConversations;
        }
        
        // Check if any conversation changed (by ID or unreadCount)
        const hasChanged = prev.some((prevConv, index) => {
          const newConv = newConversations[index];
          if (!newConv) return true;
          return (
            prevConv._id?.toString() !== newConv._id?.toString() ||
            prevConv.unreadCount !== newConv.unreadCount ||
            prevConv.lastMessage !== newConv.lastMessage ||
            prevConv.lastMessageAt?.toString() !== newConv.lastMessageAt?.toString()
          );
        });
        
        return hasChanged ? newConversations : prev;
      });
      
    } catch (err) {
      console.error("Failed to load conversations:", err);
      // Don't clear conversations on error, keep existing ones
      setConversations((prev) => prev.length === 0 ? [] : prev);
    }
  }, []); // Empty dependency array - use ref instead

  // Initialize socket connection
  useEffect(() => {
    if (!user?.uid || user.type !== "admin") {
      return;
    }

    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      newSocket.emit("join:user", user.uid);
    });

    // Debounce conversation updates to prevent blinking
    // Use ref to persist timeout across renders
    const conversationUpdateTimeoutRef = { current: null };
    const debouncedLoadConversations = () => {
      if (conversationUpdateTimeoutRef.current) {
        clearTimeout(conversationUpdateTimeoutRef.current);
      }
      conversationUpdateTimeoutRef.current = setTimeout(() => {
        loadConversations();
      }, 500); // Wait 500ms before updating
    };

    newSocket.on("chat:message", (newMessage) => {
      // Check if message belongs to selected chat
      if (selectedChat && newMessage.chatId && selectedChat._id) {
        const messageChatId = typeof newMessage.chatId === 'string' ? newMessage.chatId : newMessage.chatId.toString();
        const selectedChatId = typeof selectedChat._id === 'string' ? selectedChat._id : selectedChat._id.toString();
        if (messageChatId === selectedChatId) {
          // Prevent duplicate messages and update only if needed
          setMessages((prev) => {
            const messageId = newMessage._id?.toString() || newMessage.id?.toString();
            const exists = prev.some(
              (msg) => (msg._id?.toString() || msg.id?.toString()) === messageId
            );
            if (exists) {
              // Message already exists, check if it needs update (e.g., isRead status)
              const existingIndex = prev.findIndex(
                (msg) => (msg._id?.toString() || msg.id?.toString()) === messageId
              );
              if (existingIndex >= 0) {
                const existingMsg = prev[existingIndex];
                // Only update if something changed
                if (
                  existingMsg.isRead !== newMessage.isRead ||
                  existingMsg.requestData?.status !== newMessage.requestData?.status
                ) {
                  const updated = [...prev];
                  updated[existingIndex] = newMessage;
                  return updated;
                }
              }
              return prev; // Don't add duplicate
            }
            return [...prev, newMessage];
          });
          scrollToBottom();
        }
      }
      // Debounced update to prevent blinking
      debouncedLoadConversations();
    });

    // Listen for admin-specific message events (broadcast to all admins)
    newSocket.on("chat:message:admin", (newMessage) => {
      // Debounced update to prevent blinking
      debouncedLoadConversations();
    });

    newSocket.on("chat:new", ({ chatId }) => {
      loadConversations();
    });

    // Listen for request status updates
    newSocket.on("chat:request:updated", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg._id?.toString() || msg.id?.toString();
          const updateMessageId = messageId?.toString();
          if (msgId === updateMessageId) {
            return {
              ...msg,
              requestData: { ...msg.requestData, status },
            };
          }
          return msg;
        })
      );
    });

    setSocket(newSocket);

    return () => {
      if (conversationUpdateTimeoutRef.current) {
        clearTimeout(conversationUpdateTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [user?.uid, user?.type, selectedChat?._id, loadConversations]); // More specific dependencies

  // Load conversations on mount and periodically
  useEffect(() => {
    if (user?.type === "admin") {
      loadConversations();
      // Refresh conversations every 10 seconds (reduced frequency to prevent blinking)
      const interval = setInterval(() => {
        loadConversations();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.type, loadConversations]); // Only depend on user.type, not entire user object

  // Load messages when chat is selected - use ref to prevent unnecessary reloads
  const selectedChatIdRef = useRef(null);
  
  useEffect(() => {
    if (selectedChat) {
      const chatId = typeof selectedChat._id === 'string' ? selectedChat._id : selectedChat._id.toString();
      
      // Only reload if chatId actually changed
      if (selectedChatIdRef.current !== chatId) {
        selectedChatIdRef.current = chatId;
        loadMessages(chatId);
        if (socket) {
          socket.emit("join:chat", chatId);
        }
        setShowChatWindow(true);
      }
    } else {
      selectedChatIdRef.current = null;
    }
  }, [selectedChat?._id, socket]);

  const loadMessages = async (chatId) => {
    try {
      setLoading(true);
      const chatIdStr = typeof chatId === 'string' ? chatId : chatId.toString();
      const res = await get(`/api/chat/${chatIdStr}/messages`);
      const newMessages = res.data.messages || [];
      
      // Only update if messages actually changed
      setMessages((prev) => {
        // Compare by length and IDs to avoid unnecessary updates
        if (prev.length !== newMessages.length) {
          return newMessages;
        }
        
        // Check if any message changed
        const hasChanged = prev.some((prevMsg, index) => {
          const newMsg = newMessages[index];
          if (!newMsg) return true;
          return (
            prevMsg._id?.toString() !== newMsg._id?.toString() ||
            prevMsg.message !== newMsg.message ||
            prevMsg.isRead !== newMsg.isRead ||
            prevMsg.requestData?.status !== newMsg.requestData?.status
          );
        });
        
        return hasChanged ? newMessages : prev;
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load all users/staff for client-side filtering (same logic as ManageUsers)
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await getRef.current("/api/users");
        const users = res.data?.users || [];
        // Filter only users and staff (exclude admins)
        const usersAndStaff = users.filter(u => (u.type || "user") === "user" || (u.type || "user") === "staff");
        setAllUsers(usersAndStaff);
      } catch (err) {
        console.error("Failed to load users:", err);
        setAllUsers([]);
      }
    };
    
    if (user?.type === "admin") {
      loadAllUsers();
    }
  }, [user?.type]);

  // Client-side filtering (same logic as ManageUsers.jsx)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter users/staff by name or email (same logic as ManageUsers)
    const filtered = allUsers.filter(u => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
    
    setSearchResults(filtered);
  }, [searchQuery, allUsers]);

  // Start chat with user
  const handleStartChatWithUser = async (user) => {
    try {
      // Check if chat already exists
      const existingConv = conversations.find(conv => conv.userId === user.uid);
      if (existingConv) {
        handleSelectConversation(existingConv);
        setSearchQuery("");
        setSearchResults([]);
        return;
      }

      // Create new chat or get existing one
      const res = await post("/api/chat/create", { userId: user.uid });
      if (res.data.chat) {
        // Add user info to chat object
        const newChat = {
          ...res.data.chat,
          user: {
            uid: user.uid,
            name: user.name,
            email: user.email,
            image: user.image,
            type: user.type,
          }
        };
        
        // Reload conversations to get the new chat in list
        loadConversations();
        
        // Select the new chat immediately
        handleSelectConversation(newChat);
        setSearchQuery("");
        setSearchResults([]);
        toast.success(`Started chat with ${user.name || user.email}`);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      toast.error("Failed to start chat");
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conv) => {
    setSelectedChat(conv);
    setShowChatWindow(true);
  };

  // Handle back to conversation list
  const handleBackToList = () => {
    setShowChatWindow(false);
    // Keep selectedChat for desktop view, but hide chat window on mobile
  };

  // Handle update request status
  const handleUpdateRequestStatus = async (messageId, status) => {
    try {
      await put(`/api/chat/request/${messageId}/status`, { status });
      toast.success(`Request status updated to ${status}`);
      
      // Update local message state
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg._id?.toString() || msg.id?.toString();
          if (msgId === messageId?.toString()) {
            return {
              ...msg,
              requestData: { ...msg.requestData, status },
            };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error("Failed to update request status:", err);
      toast.error("Failed to update request status");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChat || !message.trim() || sending) return;

    try {
      setSending(true);
      const chatId = typeof selectedChat._id === 'string' ? selectedChat._id : selectedChat._id.toString();
      await post("/api/chat/message", {
        chatId,
        message: message.trim(),
        isRequest: false,
      });
      // Don't add message to state here - let Socket.IO handle it
      // This prevents duplicate messages
      setMessage("");
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (!user || user.type !== "admin") {
    return null;
  }

  // If floating mode, render as floating chat box
  if (isFloating) {
    return (
      <>
      <div className="fixed bottom-16 sm:bottom-20 right-2 sm:right-4 z-[10000]">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#1db954] text-white p-3 sm:p-4 rounded-full shadow-2xl hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all relative"
            aria-label="Open admin chat"
          >
            <FaComments className="text-lg sm:text-xl" />
            {conversations.filter(c => c.unreadCount > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-white text-black text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                {conversations.filter(c => c.unreadCount > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 9 ? '9+' : conversations.filter(c => c.unreadCount > 0).reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
              </span>
            )}
          </button>
        ) : (
          <div className="bg-[#282828] rounded-lg shadow-2xl border border-gray-800 overflow-hidden w-[calc(100vw-1rem)] sm:w-[400px] h-[calc(100vh-8rem)] sm:h-[500px] max-h-[600px] flex flex-col">
            {/* Header - Spotify Style */}
            <div className="p-3 sm:p-4 border-b border-gray-700 bg-[#181818] flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                <FaComments className="text-gray-400 text-sm sm:text-base" />
                <span className="hidden sm:inline">Admin Chat</span>
                <span className="sm:hidden">Chat</span>
              </h3>
              {selectedChat && (
                <button
                  onClick={handleBackToList}
                  className="sm:hidden text-white hover:text-gray-300 transition-colors p-1"
                  aria-label="Back to conversations"
                >
                  <FaArrowLeft className="text-sm" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedChat(null);
                }}
                className="text-white hover:text-gray-300 transition-colors p-1 active:scale-95"
                aria-label="Close chat"
              >
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Conversations List */}
              {!selectedChat && (
                <div className="w-full flex flex-col">
                  {/* Search Bar - Spotify Style (Same as ManageUsers) */}
                  <div className="p-2 sm:p-3 border-b border-gray-700">
                    <div className="relative max-w-md">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-10 py-2 sm:py-3 rounded-full bg-white/10 border border-transparent text-white placeholder-gray-500 text-xs sm:text-sm focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          aria-label="Clear search"
                        >
                          <FaTimes className="text-xs sm:text-sm" />
                        </button>
                      )}
                    </div>
                    {searchQuery.trim() && (
                      <div className="mt-2 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                          <div className="space-y-1">
                            {searchResults.map((user) => (
                              <div
                                key={user.uid}
                                onClick={() => handleStartChatWithUser(user)}
                                className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 cursor-pointer transition-colors flex items-center gap-2 touch-manipulation"
                              >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#181818] flex items-center justify-center flex-shrink-0">
                                  {user.image ? (
                                    <img
                                      src={user.image}
                                      alt={user.name}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <FaUser className="text-white text-[10px] sm:text-xs" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs sm:text-sm font-semibold truncate">
                                    {user.name || user.email || "Unknown"}
                                  </p>
                                  <p className="text-gray-400 text-[10px] sm:text-xs truncate">{user.email}</p>
                                </div>
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-white/10 text-gray-400 hidden sm:inline">
                                  {user.type === "staff" ? "Staff" : "User"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-2 text-xs">No users found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-sm text-gray-400">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv._id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`p-3 cursor-pointer border-b border-gray-700 transition-colors ${
                            selectedChat?._id === conv._id
                              ? "bg-white/10"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center flex-shrink-0">
                              {conv.user?.image ? (
                                <img
                                  src={conv.user.image}
                                  alt={conv.user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <FaUser className="text-white text-xs" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white text-sm font-semibold truncate">
                                  {conv.user?.name || conv.user?.email || "Unknown"}
                                </h4>
                                {conv.unreadCount > 0 && (
                                  <span className="bg-[#1db954] text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {conv.lastMessage || "No messages"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Chat Window */}
              {selectedChat && (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header - Spotify Style */}
                  <div className="p-3 border-b border-gray-700 bg-[#181818] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="text-gray-400 hover:text-white transition-colors mr-2"
                      >
                        <FaArrowLeft />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center">
                        {selectedChat.user?.image ? (
                          <img
                            src={selectedChat.user.image}
                            alt={selectedChat.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FaUser className="text-white text-xs" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold">
                          {selectedChat.user?.name || selectedChat.user?.email || "Unknown User"}
                        </h4>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading ? (
                      <div className="text-center text-gray-400 py-4">Loading...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const messageId = msg._id?.toString() || msg.id?.toString() || `msg-${index}`;
                        return (
                          <div
                            key={messageId}
                            className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-2 text-sm ${
                                msg.senderType === "admin"
                                  ? "bg-[#1db954] text-white"
                                  : "bg-[#181818] text-gray-100"
                              }`}
                            >
                              {msg.isRequest ? (
                                <div className="space-y-1">
                                  <div className="font-semibold text-xs flex items-center gap-1">
                                    <FaMusic className="text-xs" />
                                    Music Request
                                  </div>
                                  <div className="text-xs space-y-0.5">
                                    <p><span className="font-semibold">Song:</span> {msg.requestData?.songName}</p>
                                    <p><span className="font-semibold">Artist:</span> {msg.requestData?.artistName}</p>
                                    {msg.requestData?.movieName && (
                                      <p><span className="font-semibold">Movie:</span> {msg.requestData.movieName}</p>
                                    )}
                                    {msg.requestData?.youtubeLink && (
                                      <p><span className="font-semibold">YouTube:</span> <a href={msg.requestData.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">Link</a></p>
                                    )}
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        msg.requestData?.status === "added" ? "bg-blue-500" :
                                        msg.requestData?.status === "approved" ? "bg-green-500" :
                                        msg.requestData?.status === "rejected" ? "bg-red-500" : "bg-yellow-500"
                                      }`}>
                                        {msg.requestData?.status || "pending"}
                                      </span>
                                      {msg.requestData?.status === "pending" && (
                                        <button
                                          onClick={() => handleUpdateRequestStatus(msg._id || msg.id, "added")}
                                          className="px-2 py-0.5 bg-[#1db954] hover:bg-[#1ed760] text-white text-xs rounded-full transition-colors"
                                        >
                                          Mark as Added
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p>{msg.message}</p>
                              )}
                              <p className="text-xs opacity-70 mt-1">{formatTime(msg.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input - Spotify Style */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-full bg-white/10 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="px-3 py-2 bg-[#1db954] text-white rounded-full hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
      </>
    );
  }

  // Full screen mode (for AdminPanel page) - Spotify Style
  return (
    <div className="min-h-screen bg-[#121212] p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
          <FaComments className="text-gray-400 text-lg sm:text-xl md:text-2xl" />
          <span className="hidden sm:inline">Admin Chat</span>
          <span className="sm:hidden">Chat</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 h-[calc(100vh-120px)] sm:h-[calc(100vh-150px)] md:h-[calc(100vh-200px)]">
          {/* Conversations List - Spotify Style */}
          <div
            className={`bg-[#181818] rounded-lg shadow-xl border border-gray-800 overflow-hidden flex flex-col ${
              showChatWindow ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Conversations</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {conversations.length} active chat{conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
            
            {/* Search Bar - Spotify Style (Same as ManageUsers) */}
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-12 pr-10 py-2 sm:py-3 rounded-full bg-white/10 border border-transparent text-white placeholder-gray-500 text-xs sm:text-sm focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <FaTimes className="text-xs sm:text-sm" />
                  </button>
                )}
              </div>
              {searchQuery.trim() && (
                <div className="mt-2 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar">
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <div
                          key={user.uid}
                          onClick={() => handleStartChatWithUser(user)}
                          className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 cursor-pointer transition-colors flex items-center gap-2 touch-manipulation"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#181818] flex items-center justify-center flex-shrink-0">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <FaUser className="text-white text-[10px] sm:text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs sm:text-sm font-semibold truncate">
                              {user.name || user.email || "Unknown"}
                            </p>
                            <p className="text-gray-400 text-[10px] sm:text-xs truncate">{user.email}</p>
                          </div>
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-white/10 text-gray-400 hidden sm:inline">
                            {user.type === "staff" ? "Staff" : "User"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-2 text-xs">No users found</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <motion.div
                    key={conv._id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 cursor-pointer border-b border-gray-700 transition-colors ${
                      selectedChat?._id === conv._id
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center flex-shrink-0">
                        {conv.user?.image ? (
                          <img
                            src={conv.user.image}
                            alt={conv.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FaUser className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold truncate">
                            {conv.user?.name || conv.user?.email || "Unknown User"}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span className="bg-[#1db954] text-white text-xs px-2 py-1 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate mt-1">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(conv.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window - Spotify Style */}
          <div
            className={`lg:col-span-2 bg-[#181818] rounded-lg shadow-xl border border-gray-800 overflow-hidden flex flex-col ${
              showChatWindow ? "flex" : "hidden lg:flex"
            }`}
          >
            {selectedChat ? (
              <>
                {/* Info Banner - All admins receive messages - Spotify Style */}
                <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/5 border-b border-gray-700">
                  <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 sm:gap-2">
                    <FaComments className="text-[10px] sm:text-xs" />
                    <span className="hidden sm:inline">All admins will receive messages from this user</span>
                    <span className="sm:hidden">All admins receive messages</span>
                  </p>
                </div>
                {/* Chat Header - Spotify Style */}
                <div className="p-3 sm:p-4 border-b border-gray-700 bg-[#181818]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Back Button (Mobile only) */}
                    <button
                      onClick={handleBackToList}
                      className="lg:hidden text-gray-400 hover:text-white active:scale-95 transition-all p-1"
                      aria-label="Back to conversations"
                    >
                      <FaArrowLeft className="text-sm sm:text-base" />
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#181818] flex items-center justify-center flex-shrink-0">
                      {selectedChat.user?.image ? (
                        <img
                          src={selectedChat.user.image}
                          alt={selectedChat.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-white text-xs sm:text-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate">
                        {selectedChat.user?.name || selectedChat.user?.email || "Unknown User"}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {selectedChat.user?.type || "user"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="text-center text-gray-400 py-8">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      // Use unique key - combine _id with index as fallback
                      const messageId = msg._id?.toString() || msg.id?.toString() || `msg-${index}`;
                      return (
                      <div
                        key={messageId}
                        className={`flex ${
                          msg.senderType === "admin" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.senderType === "admin"
                              ? "bg-[#1db954] text-white"
                              : "bg-[#181818] text-gray-100"
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
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                                  {msg.requestData?.status === "pending" && (
                                    <button
                                      onClick={() => handleUpdateRequestStatus(msg._id || msg.id, "added")}
                                      className="px-2 py-1 bg-[#1db954] hover:bg-[#1ed760] text-white text-xs rounded-full transition-colors"
                                    >
                                      Mark as Added
                                    </button>
                                  )}
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

                {/* Message Input - Spotify Style */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-700"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20"
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FaComments className="text-6xl mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Select a conversation to start chatting</p>
                  <p className="text-sm mt-2 text-gray-500">
                    Click on any conversation from the list to view messages and reply
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

