import React, { useEffect, useState, useRef } from "react";
import { BiSolidPlaylist } from "react-icons/bi";
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

  const handleAddToPlaylist = async (playlistId) => {
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
  };

  const handleCreateAndAdd = async () => {
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
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create playlist";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  return (
    <motion.div
      className="relative bg-gradient-to-br from-gray-50 via-purple-100 to-gray-100 dark:from-gray-900/90 dark:via-purple-900/80 dark:to-gray-800/90 rounded-2xl p-6 w-[92vw] max-w-xs sm:max-w-sm shadow-2xl border border-purple-200 dark:border-purple-700/50 backdrop-blur-xl"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      ref={modalRef}
    >
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl focus:outline-none"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className="flex flex-col items-center mb-4">
        <div className="bg-purple-200 dark:bg-purple-700/80 p-3 rounded-full shadow mb-2">
          <BiSolidPlaylist className="text-purple-700 dark:text-white text-2xl" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 tracking-wide">
          Add to Playlist
        </h2>
        <p className="text-xs text-purple-700 dark:text-purple-200 mb-2 text-center">
          Choose a playlist or create a new one
        </p>
      </div>
      {playlistLoading ? (
        <div className="flex justify-center items-center py-8">
          <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-400 border-opacity-70"></span>
          <span className="ml-3 text-purple-700 dark:text-purple-300">
            Loading...
          </span>
        </div>
      ) : Array.isArray(userPlaylists) && userPlaylists.length === 0 ? (
        <div>
          <div className="text-purple-700 dark:text-purple-200 mb-3 text-center">
            No playlist found.
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400">
              <BiSolidPlaylist />
            </span>
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
              placeholder="New playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
            />
          </div>
          <button
            className="w-full bg-gradient-to-r from-purple-400 to-purple-300 dark:from-purple-700 dark:to-purple-500 hover:from-purple-500 hover:to-purple-400 dark:hover:from-purple-800 dark:hover:to-purple-600 text-white rounded-lg py-2 font-semibold shadow transition"
            onClick={handleCreateAndAdd}
            disabled={!newPlaylistName.trim()}
          >
            <span className="inline-flex items-center gap-1">
              <BiSolidPlaylist className="text-lg" /> Create & Add
            </span>
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-purple-700 dark:text-purple-200 text-center">
            Select a playlist:
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {(Array.isArray(userPlaylists) ? userPlaylists : []).map((pl) => (
              <button
                key={pl._id}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/80 text-gray-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-purple-700"
                onClick={() => handleAddToPlaylist(pl._id)}
              >
                <BiSolidPlaylist className="text-purple-400" />
                <span className="truncate">{pl.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-purple-200 dark:border-purple-800 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">
                <BiSolidPlaylist />
              </span>
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 outline-none"
                placeholder="New playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
              />
            </div>
            <button
              className="w-full bg-gradient-to-r from-purple-400 to-purple-300 dark:from-purple-700 dark:to-purple-500 hover:from-purple-500 hover:to-purple-400 dark:hover:from-purple-800 dark:hover:to-purple-600 text-white rounded-lg py-2 font-semibold shadow transition"
              onClick={handleCreateAndAdd}
              disabled={!newPlaylistName.trim()}
            >
              <span className="inline-flex items-center gap-1">
                <BiSolidPlaylist className="text-lg" /> Create & Add
              </span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AddToPlaylistModal;
