import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAudio } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";
import { FaStar, FaMusic } from "react-icons/fa";
import { Loading } from "../../components/common";
import useAxios from "../../hooks/useAxios";
import toast from "react-hot-toast";
import { SongCard } from "./SongCard";

export default function ForYouNested() {
  const { search } = useOutletContext();
  const {
    playSong,
    currentSong,
    isPlaying,
    pauseSong,
  } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isPersonalized, setIsPersonalized] = useState(false);
  const { get } = useAxios();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (user?.uid) {
          const res = await get(`/api/recommendations/${user.uid}?limit=100`);
          setSongs(res.data.songs || []);
          setIsPersonalized(res.data.personalized || false);
        } else {
          // For non-logged users, show trending songs
          const res = await get("/api/songs/trending?limit=100");
          setSongs(res.data.songs || []);
          setIsPersonalized(false);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        toast.error("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [user]);


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

  if (loading) {
    return <Loading message="Loading recommendations..." />;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isPersonalized ? "Made For You" : "Popular Picks"}
          </h1>
          {isPersonalized && (
            <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold">
              Personalized
            </span>
          )}
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {isPersonalized 
          ? "Songs curated based on your preferences" 
          : "Popular songs for everyone"}
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
            {search ? 'No songs found' : 'No recommendations available'}
          </p>
        </div>
      )}
    </>
  );
}

