import { useEffect, useState, useCallback } from "react";
import { useAudio } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { FaMusic } from "react-icons/fa";
import { MainLayout } from "../../components/layout";
import { SearchBar } from "../../components/features/search";
import { Loading } from "../../components/common";
import useAxios from "../../hooks/useAxios";
import toast from "react-hot-toast";
import { SongCard } from "./SongCard";

export default function NewReleases() {
  const {
    playSong,
    currentSong,
    isPlaying,
    pauseSong,
  } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [likedSongIds, setLikedSongIds] = useState([]);
  const [likeEffectId, setLikeEffectId] = useState(null);
  const { get, put } = useAxios();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const res = await get("/api/songs/new-releases?limit=100");
        setSongs(res.data.songs || []);
      } catch (error) {
        console.error("Error fetching new releases:", error);
        toast.error("Failed to load new releases");
      } finally {
        setLoading(false);
      }
    };
    fetchNewReleases();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchLiked = async () => {
      try {
        const res = await get(`/api/playlists/user/${user.uid}`);
        const liked = (res.data || []).find((pl) => pl.name === "Liked Songs");
        if (liked && liked.songs) {
          setLikedSongIds(liked.songs.map((id) => id.toString()));
        }
      } catch {
        setLikedSongIds([]);
      }
    };
    fetchLiked();
  }, [user]);

  const getOrCreateLikedPlaylist = async () => {
    const res = await get(`/api/playlists/user/${user.uid}`);
    let liked = res.data.find((pl) => pl.name === "Liked Songs");
    if (!liked) {
      const createRes = await put("/api/playlists", {
        name: "Liked Songs",
        description: "Your liked songs",
        userId: user.uid,
      });
      liked = { _id: createRes.data.id };
    }
    return liked._id;
  };

  const handleLikeSong = useCallback(async (songId) => {
    if (!user?.uid) {
      toast.error("Please login to like songs");
      return;
    }
    setLikeEffectId(songId);
    try {
      const likedPlaylistId = await getOrCreateLikedPlaylist();
      if (likedSongIds.includes(songId)) {
        await put(`/api/playlists/${likedPlaylistId}/remove`, { songId });
        setLikedSongIds((prev) => prev.filter((id) => id !== songId));
        toast.success("Removed from Liked Songs");
      } else {
        await put(`/api/playlists/${likedPlaylistId}/add`, { songId });
        setLikedSongIds((prev) => [...prev, songId]);
        toast.success("Added to Liked Songs");
      }
    } catch {
      toast.error("Failed to update like");
    }
    setTimeout(() => setLikeEffectId(null), 300);
  }, [likedSongIds, user]);

  const filteredSongs = search
    ? songs.filter((song) => {
        return (
          song.title.toLowerCase().includes(search.toLowerCase()) ||
          song.artist.toLowerCase().includes(search.toLowerCase()) ||
          (song.genre &&
            song.genre.some((g) => g.toLowerCase().includes(search.toLowerCase())))
        );
      })
    : songs;

  return (
    <MainLayout>
      <div className="space-y-8 pb-42 md:pb-32">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search new releases..."
        />

        {loading ? (
          <Loading message="Loading new releases..." />
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  New Releases
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Latest songs added to the platform
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredSongs.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={filteredSongs}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
                  />
                ))}
              </div>
              {filteredSongs.length === 0 && (
                <div className="text-center py-12">
                  <FaMusic className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">
                    {search ? 'No songs found' : 'No new releases available'}
                  </p>
                </div>
              )}
            </motion.section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

