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
        toast.error("Song already in this playlist");
      } else {
        toast.success("Song added to playlist!");
      }
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add song to playlist";
      toast.error(errorMessage);
    }
  }, [put, songId, onClose]);

  const handleCreateAndAdd = useCallback(async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    try {
      const res = await post("/api/playlists", {
        name: newPlaylistName,
        description: "",
        userId: user.uid,
      });
      toast.success("Playlist created!");
      await handleAddToPlaylist(res.data.id);
      setNewPlaylistName("");
      setShowCreateForm(false); // Close the form after success
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create playlist";
      toast.error(`${errorMessage}`);
    }
  }, [newPlaylistName, post, user?.uid, handleAddToPlaylist]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Drawer from Bottom - Spotify Style */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-[#121212] rounded-t-3xl shadow-2xl border-t border-gray-800 z-[10001] max-h-[85vh] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-gray-700" />
        </div>

        {/* Header - Spotify Style */}
        <div className="px-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Add to Playlist
            </h2>
            <button
              className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Spotify Style */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {playlistLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
              <span className="ml-3 text-gray-400 text-sm">
                Loading playlists...
              </span>
            </div>
          ) : Array.isArray(userPlaylists) && userPlaylists.length === 0 ? (
            <div className="py-8">
              <div className="text-gray-400 mb-6 text-center text-sm">
                No playlists yet. Create your first one!
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                  autoFocus
                />
                <button
                  className="w-full bg-white text-black rounded-full py-3 font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-1 mb-4">
                {(Array.isArray(userPlaylists) ? userPlaylists : []).map((pl) => (
                  <button
                    key={pl._id}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 text-white transition-colors text-left group"
                    onClick={() => handleAddToPlaylist(pl._id)}
                  >
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <BiSolidPlaylist className="text-white text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{pl.name}</div>
                      <div className="text-gray-400 text-sm">Playlist</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white text-black font-bold transition-all"
                  >
                    <BiPlus className="text-xl" />
                    <span>Create playlist</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-md bg-white/10 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-white text-black rounded-full py-3 font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        onClick={handleCreateAndAdd}
                        disabled={!newPlaylistName.trim()}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPlaylistName("");
                        }}
                        className="px-6 py-3 rounded-full bg-transparent border border-gray-700 text-white font-semibold hover:border-white transition-all"
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
