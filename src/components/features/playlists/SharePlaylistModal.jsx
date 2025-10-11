import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";
import { FaTimes, FaGlobe, FaLock, FaUserPlus, FaLink, FaCheck, FaEnvelope, FaInfoCircle } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";

const SharePlaylistModal = ({ playlist, onClose, onUpdate }) => {
  const { user } = useAuth();
  const { put, post } = useAxios();
  const [isPublic, setIsPublic] = useState(playlist.isPublic || false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    setIsPublic(playlist.isPublic || false);
  }, [playlist]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Toggle public/private
  const handleTogglePublic = async () => {
    try {
      const res = await put(`/api/playlists/${playlist._id}/toggle-public`);
      const newIsPublic = res.data.isPublic;
      setIsPublic(newIsPublic);
      toast.success(
        newIsPublic 
          ? "Playlist is now public!" 
          : "Playlist is now private"
      );
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  // Send invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    setSending(true);
    try {
      await post(`/api/playlists/${playlist._id}/invite`, {
        toUserEmail: inviteEmail.trim(),
      });
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to send invitation";
      toast.error(errorMsg);
    }
    setSending(false);
  };

  // Copy public link
  const handleCopyLink = () => {
    const publicLink = `${window.location.origin}/public/playlist/${playlist._id}`;
    navigator.clipboard.writeText(publicLink);
    toast.success("Link copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="relative bg-gradient-to-br from-gray-900 via-purple-900/90 to-fuchsia-900/80 rounded-2xl shadow-2xl border border-purple-500/30 w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg">
              <BiSolidPlaylist className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Share Playlist</h2>
              <p className="text-xs sm:text-sm text-purple-200">{playlist.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Public/Private Toggle */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
              <FaGlobe className="text-blue-400" />
              Visibility
            </h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-500/20">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <FaGlobe className="text-green-400 text-xl" />
                ) : (
                  <FaLock className="text-gray-400 text-xl" />
                )}
                <div>
                  <p className="text-white font-semibold">
                    {isPublic ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-purple-200">
                    {isPublic 
                      ? "Anyone with the link can view" 
                      : "Only you and invited users can view"}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleTogglePublic}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isPublic 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                    : "bg-gray-600"
                }`}
              >
                <motion.span
                  className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                  animate={{ x: isPublic ? 30 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Public Link Section */}
            {isPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FaLink className="text-green-400" />
                  <p className="text-sm font-semibold text-white">Public Link</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/public/playlist/${playlist._id}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-green-500/30 text-green-200 text-xs sm:text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2"
                  >
                    {copied ? <FaCheck /> : <FaLink />}
                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Invite Users Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
              <FaUserPlus className="text-fuchsia-400" />
              Invite Users
            </h3>
            
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 text-sm" />
                  <input
                    type="email"
                    placeholder="Enter user's email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/40 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={sending || !inviteEmail.trim()}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaUserPlus />
                      <span className="hidden sm:inline">Invite</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
            
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-200 flex items-start gap-2">
                <FaInfoCircle className="flex-shrink-0 mt-0.5" />
                <span>Invited users will receive a real-time notification and can access this playlist</span>
              </p>
            </div>
          </div>

          {/* Shared With */}
          {playlist.sharedWith && playlist.sharedWith.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-purple-200">
                Shared with {playlist.sharedWith.length} {playlist.sharedWith.length === 1 ? 'user' : 'users'}
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {playlist.sharedWith.map((uid, idx) => (
                  <div 
                    key={uid || idx}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-purple-500/20 text-purple-200 text-sm"
                  >
                    User: {uid}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

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
    </motion.div>
  );
};

export default SharePlaylistModal;

