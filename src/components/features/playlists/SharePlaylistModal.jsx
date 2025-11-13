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

  // Share or copy public link with metadata
  const handleCopyLink = async () => {
    const publicLink = `${window.location.origin}/public/playlist/${playlist._id}`;
    const shareData = {
      title: `${playlist.name} • Healers Playlist`,
      text: `Listen to the "${playlist.name}" playlist on Healers. Curated by ${playlist.createdBy?.name || 'Healers'}.`,
      url: publicLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Thanks for sharing!");
        return;
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Web Share failed", error);
      } else {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success("Link copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (clipboardError) {
      console.error("Clipboard write failed", clipboardError);
      toast.error("Unable to share right now");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#181818] shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1db954]/10 text-[#1db954]">
              <BiSolidPlaylist className="text-xl sm:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Share playlist</h2>
              <p className="text-xs text-gray-400 sm:text-sm">{playlist.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition hover:text-white hover:bg-white/10 rounded-full"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-5 py-5 sm:px-6">
          {/* Public/Private Toggle */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <FaGlobe className="text-[#1db954]" />
              Visibility
            </h3>
            
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#121212] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3 sm:gap-4">
                {isPublic ? (
                  <FaGlobe className="text-emerald-400 text-xl" />
                ) : (
                  <FaLock className="text-gray-400 text-xl" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white sm:text-base">
                    {isPublic ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-gray-400">
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
                  isPublic ? "bg-[#1db954]" : "bg-gray-700"
                }`}
              >
                <motion.span
                  className="inline-block h-6 w-6 transform rounded-full bg-white shadow"
                  animate={{ x: isPublic ? 30 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                />
              </motion.button>
            </div>

            {/* Public Link Section */}
            {isPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FaLink className="text-emerald-300" />
                  <p className="text-sm font-semibold text-white">Public link</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/public/playlist/${playlist._id}`}
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-emerald-100 sm:text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1db954] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
                  >
                    {copied ? <FaCheck /> : <FaLink />}
                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy link"}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Invite Users Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <FaUserPlus className="text-[#1db954]" />
              Invite listeners
            </h3>
            
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    type="email"
                    placeholder="Enter user's email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121212] px-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#1db954]/60 focus:outline-none focus:ring-2 focus:ring-[#1db954]/40"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={sending || !inviteEmail.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:pointer-events-none disabled:opacity-60"
                >
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                  ) : (
                    <>
                      <FaUserPlus />
                      <span className="hidden sm:inline">Send invite</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
            
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
              <p className="flex items-start gap-3 text-xs text-gray-400">
                <FaInfoCircle className="mt-0.5 flex-shrink-0 text-[#1db954]" />
                <span>
                  Invited listeners get a notification instantly and can jump straight into this playlist.
                </span>
              </p>
            </div>
          </div>

          {/* Shared With */}
          {playlist.sharedWith && playlist.sharedWith.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Shared with {playlist.sharedWith.length}{" "}
                {playlist.sharedWith.length === 1 ? "listener" : "listeners"}
              </h3>
              <div className="custom-scrollbar max-h-32 space-y-2 overflow-y-auto pr-1">
                {playlist.sharedWith.map((uid, idx) => (
                  <div 
                    key={uid || idx}
                    className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-sm text-gray-300"
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
          background: linear-gradient(to bottom, #1db954, #178a3d);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
};

export default SharePlaylistModal;

