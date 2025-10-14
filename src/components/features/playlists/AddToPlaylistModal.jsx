import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { BiSolidPlaylist, BiPlus } from "react-icons/bi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";

const AddToPlaylistModal = ({ songId, onClose }) => {
  const { user } = useAuth();
  const { get, post, put } = useAxios();
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    if (user?.uid) {
      setPlaylistLoading(true);
      get(`/api/playlists/user/${user.uid}`)
        .then((res) => {
          // Ensure playlists is always an array
          let playlists = res.data;
          if (!Array.isArray(playlists)) {
            playlists = [];
          }
          setUserPlaylists(playlists);
        })
        .catch(() => setUserPlaylists([]))
        .finally(() => setPlaylistLoading(false));
    }
  }, [user]);

  const handleAddToPlaylist = useCallback(async (playlistId) => {
    try {
      const res = await put(`/api/playlists/${playlistId}/add`, { songId });
      if (res.data.message === "Already added" || res.data.message === "Song already in playlist") {
        toast.error("⚠️ Song already in this playlist");
      } else {
        toast.success("✅ Song added to playlist!");
      }
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add song to playlist";
      toast.error(`❌ ${errorMessage}`);
    }
  }, [put, songId, onClose]);

  const handleCreateAndAdd = useCallback(async () => {
    if (!newPlaylistName.trim()) {
      toast.error("⚠️ Please enter a playlist name");
      return;
    }
    try {
      const res = await post("/api/playlists", {
        name: newPlaylistName,
        description: "",
        userId: user.uid,
      });
      toast.success("✅ Playlist created!");
      await handleAddToPlaylist(res.data.id);
      setNewPlaylistName("");
      setShowCreateForm(false); // Close the form after success
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create playlist";
      toast.error(`❌ ${errorMessage}`);
    }
  }, [newPlaylistName, post, user?.uid, handleAddToPlaylist]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Drawer from Bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 via-purple-900/95 to-fuchsia-900/90 rounded-t-3xl shadow-2xl border-t-2 border-purple-500/40 backdrop-blur-xl z-[9999] max-h-[85vh] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        ref={modalRef}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-purple-400/50" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg">
                <BiSolidPlaylist className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Add to Playlist
                </h2>
                <p className="text-sm text-purple-200">
                  Choose a playlist or create one
                </p>
              </div>
            </div>
            <button
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {playlistLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></span>
              <span className="ml-3 text-purple-200 text-base">
                Loading playlists...
              </span>
            </div>
          ) : Array.isArray(userPlaylists) && userPlaylists.length === 0 ? (
            <div>
              <div className="text-purple-200 mb-4 text-center text-sm">
                No playlists yet. Create your first one!
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">
                    <BiSolidPlaylist />
                  </span>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/40 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="New playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                    autoFocus
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white rounded-lg py-2.5 font-bold shadow-lg transition-all"
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim()}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <BiSolidPlaylist className="text-lg" /> Create & Add
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 text-purple-200 text-sm font-semibold">
                Select a playlist:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {(Array.isArray(userPlaylists) ? userPlaylists : []).map((pl) => (
                  <button
                    key={pl._id}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-purple-500/20 hover:border-purple-400/40 text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onClick={() => handleAddToPlaylist(pl._id)}
                  >
                    <BiSolidPlaylist className="text-purple-400" />
                    <span className="truncate">{pl.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 border-t border-purple-500/30 pt-4">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <BiSolidPlaylist className="text-lg" />
                    <span>Create New Playlist</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">
                        <BiSolidPlaylist />
                      </span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/40 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="New playlist name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white rounded-lg py-2.5 font-bold shadow-lg transition-all"
                        onClick={handleCreateAndAdd}
                        disabled={!newPlaylistName.trim()}
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          <BiSolidPlaylist className="text-lg" /> Create & Add
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPlaylistName("");
                        }}
                        className="px-4 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Memoize the entire modal to prevent re-renders from parent
export default memo(AddToPlaylistModal, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.onClose === nextProps.onClose
  );
});
