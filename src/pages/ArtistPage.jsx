import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import useAxios from "../hooks/useAxios";
import { useAudio } from "../context/AudioContext";
import SongDetails from "./SongDetails";
import { Pause, Play } from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "../utils/slugify";

const PlayButton = ({ isActive }) => (
  <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-all group-hover:opacity-100 group-focus:opacity-100">
    {isActive ? (
      <Pause className="h-5 w-5" strokeWidth={2.2} />
    ) : (
      <Play className="h-5 w-5 ml-1" strokeWidth={2.2} />
    )}
  </span>
);

function ArtistSongCard({ song, isCurrent, isPlaying, onPlay, onPause, onOpenDetails }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#181818] p-4 transition hover:border-white/10 hover:bg-[#1f1f1f]">
      <button
        onClick={() => (isCurrent && isPlaying ? onPause() : onPlay())}
        className="group relative h-16 w-16 overflow-hidden rounded-2xl bg-[#1a1a1a] focus:outline-none"
        aria-label={isCurrent && isPlaying ? "Pause playback" : "Play track"}
      >
        <img
          src={song.cover || "/healers.webp"}
          alt={song.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src = "/healers.webp";
            e.target.onerror = null;
          }}
        />
        <PlayButton isActive={isCurrent && isPlaying} />
      </button>

      <button
        onClick={onOpenDetails}
        className="flex-1 min-w-0 text-left focus:outline-none"
      >
        <p className="text-sm font-semibold text-white truncate">
          {song.title}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {song.artist}
        </p>
      </button>

      {song.duration && (
        <span className="text-xs text-gray-500">
          {Math.floor(song.duration / 60)}:
          {`${song.duration % 60}`.padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

export default function ArtistPage() {
  const { name: slug } = useParams();
  const decodedFromSlug = useMemo(() => decodeURIComponent(slug || ""), [slug]);
  const { get } = useAxios();
  const { playSong, currentSong, isPlaying, pauseSong } = useAudio();
  const [songs, setSongs] = useState([]);
  const [displayArtist, setDisplayArtist] = useState(decodedFromSlug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [activeSong, setActiveSong] = useState(null);
  const [likedMap, setLikedMap] = useState({});

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const fetchSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await get(`/api/artists/${slug}/songs`);
        if (cancelled) return;
        const all = res?.data?.songs || [];
        setSongs(all);
        if (res?.data?.artist) {
          setDisplayArtist(res.data.artist);
        } else if (all.length > 0) {
          setDisplayArtist(all[0].artist);
        } else {
          setDisplayArtist(decodedFromSlug.replace(/-/g, " "));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load artist songs:", err);
          setError("Unable to load artist songs. Please try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSongs();
    return () => {
      cancelled = true;
    };
  }, [slug, decodedFromSlug, get]);

  const handlePlay = (song, index) => {
    if (!song) return;
    playSong(song, index, songs);
    setActiveSong(song);
    toast.success(`Playing ${song.title}`);
  };

  const isCurrentSong = (song) => {
    if (!currentSong) return false;
    return (
      (currentSong._id && currentSong._id === song._id) ||
      (currentSong.id && currentSong.id === song.id)
    );
  };

  const handleCloseDetails = () => {
    setActiveSong(null);
  };

  const handleToggleLike = (songId) => {
    setLikedMap((prev) => ({
      ...prev,
      [songId]: !prev[songId],
    }));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#121212] text-gray-200 pb-20">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1db9540d] via-[#121212] to-[#121212]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(circle_at_top,_#1db954_0,_transparent_60%)]" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80 transition hover:border-white/30 hover:text-emerald-100"
            >
              Go Back
            </button>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">
                  Artist Spotlight
                </p>
                <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {displayArtist}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-gray-300">
                  Discover every track by{" "}
                <span className="font-semibold text-white">{displayArtist}</span>{" "}
                  streaming inside Healers.
                </p>
              </div>
              {songs.length > 0 && (
                <button
                onClick={() => handlePlay(songs[0], 0)}
                  className="inline-flex items-center gap-2 self-start rounded-full bg-[#1db954] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#18a648]"
                >
                  <Play className="h-4 w-4" strokeWidth={2.4} />
                  Play First Track
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          {loading && songs.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#181818] p-4 animate-pulse"
                >
                  <div className="h-16 w-16 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-gray-300 mb-3">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Back to Home
              </Link>
            </div>
          ) : songs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-gray-300">No songs found for this artist yet.</p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
                loading ? "opacity-60 pointer-events-none" : "opacity-100"
              }`}
            >
              {songs.map((song, index) => (
                <ArtistSongCard
                  key={song._id}
                  song={song}
                  isCurrent={isCurrentSong(song)}
                  isPlaying={isPlaying}
                  onPlay={() => handlePlay(song, index)}
                  onPause={pauseSong}
                  onOpenDetails={() => {
                    setActiveSong(song);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <AnimatePresence>
        {activeSong && (
          <SongDetails
            song={activeSong}
            onClose={handleCloseDetails}
            isLiked={likedMap[activeSong._id] || false}
            onLike={handleToggleLike}
            onAddToPlaylist={() => {}}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

