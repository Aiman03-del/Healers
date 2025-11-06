import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAudio } from "../../context/AudioContext";
import { FaFire, FaMusic } from "react-icons/fa";
import { Loading } from "../../components/common";
import useAxios from "../../hooks/useAxios";
import toast from "react-hot-toast";
import { SongCard } from "./SongCard";

export default function TrendingSongsNested() {
  const { search } = useOutletContext();
  const {
    playSong,
    currentSong,
    isPlaying,
    pauseSong,
  } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useAxios();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await get("/api/songs/trending?limit=100");
        setSongs(res.data.songs || []);
      } catch (error) {
        console.error("Error fetching trending songs:", error);
        toast.error("Failed to load trending songs");
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);


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
    return <Loading message="Loading trending songs..." />;
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Trending Now
        </h1>
        <span className="text-xs px-3 py-1 rounded-full bg-[#1db954] text-white font-semibold flex items-center gap-1">
          <FaFire className="text-xs" />
          Hot
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Most played songs right now
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
            {search ? 'No songs found' : 'No trending songs available'}
          </p>
        </div>
      )}
    </>
  );
}

