import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Play, ArrowLeft } from "lucide-react";
import { MainLayout } from "../components/layout";
import useAxios from "../hooks/useAxios";
import { useAudio } from "../context/AudioContext";
import { slugify } from "../utils/slugify";

export default function SongDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get } = useAxios();
  const { playSong } = useAudio();
  const [song, setSong] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchSong = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await get(`/api/songs/${id}`);
        if (!mounted) return;
        setSong(res?.data?.song || null);
        setSimilar(res?.data?.similarSongs || []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load song details:", err);
        setError("Unable to load song details. Please try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSong();
    return () => {
      mounted = false;
    };
  }, [id, get]);

  const genres = useMemo(() => {
    if (!song?.genre) return [];
    return Array.isArray(song.genre) ? song.genre : [song.genre].filter(Boolean);
  }, [song]);

  const handlePlay = () => {
    if (!song) return;
    playSong(song, 0, [song]);
  };

  const showSkeleton = loading && !song;
  const isFetchingNew = loading && !!song;
  const hasError = (!!error && !song) || (!loading && !song);
  const hasContent = !!song;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#121212] text-gray-200 pb-20">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1db9540d] via-[#121212] to-[#121212]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.12] bg-[radial-gradient(circle_at_top,_#1db954_0,_transparent_55%)]" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 lg:flex-row lg:items-center lg:py-16">
            {showSkeleton ? (
              <>
                <div className="mx-auto w-60 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] shadow-2xl lg:mx-0 animate-pulse h-60" />
                <div className="flex-1 space-y-4">
                  <div className="h-4 w-24 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-9 w-2/3 rounded bg-white/10 animate-pulse" />
                  <div className="h-5 w-1/3 rounded bg-white/10 animate-pulse" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <span key={idx} className="h-6 w-20 rounded-full bg-white/10 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-10 w-36 rounded-full bg-[#1db954]/30 animate-pulse" />
                </div>
              </>
            ) : hasError ? (
              <div className="flex flex-col gap-4 text-center mx-auto">
                <p className="text-gray-300 text-sm">{error || "Song not found."}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
              </div>
            ) : (
              <>
                <div className="mx-auto w-60 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] shadow-2xl lg:mx-0">
                  <img
                    src={song.cover || "/healers.webp"}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      e.target.src = "/healers.webp";
                      e.target.onerror = null;
                    }}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80 transition hover:text-emerald-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                    {song.title}
                  </h1>
                  <button
                    onClick={() => song.artist && navigate(`/artists/${slugify(song.artist)}`)}
                    className="text-left text-base text-gray-300 sm:text-lg hover:text-white hover:underline transition"
                    disabled={!song.artist}
                  >
                    {song.artist}
                  </button>
                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button
                      onClick={handlePlay}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1db954] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#18a648]"
                    >
                      <Play className="h-4 w-4" strokeWidth={2.4} />
                      Play Now
                    </button>
                    <span className="text-xs text-gray-500">
                      Added {new Date(song.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          {hasError ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-gray-300 mb-4">
                {error || "Song not found. It may have been removed or is temporarily unavailable."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
            </div>
          ) : showSkeleton ? (
            <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                <div className="mt-3 space-y-3">
                  <div className="h-3 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 rounded bg-white/10 animate-pulse w-4/5" />
                  <div className="h-3 rounded bg-white/10 animate-pulse w-3/5" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                  <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="h-3 w-32 rounded bg-white/10 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                  <h2 className="text-lg font-semibold text-white">About this track</h2>
                  <p className="mt-3 text-sm text-gray-300">
                    Crafted within the Healers studio, this track is engineered to feel effortless—clean instrumentation, polished dynamics,
                    and a listening experience that balances depth with clarity.
                  </p>
                  <p className="mt-3 text-sm text-gray-300">
                    Every instrument layer, transition, and streamable detail is maintained so you can focus purely on feeling the music, whether
                    you're working, unwinding, or creating.
                  </p>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Track specs
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-300">
                    <li>
                      <span className="font-semibold text-white">Duration:</span>{" "}
                      {song.duration ? `${Math.floor(song.duration / 60)}:${`${song.duration % 60}`.padStart(2, "0")}` : "—"}
                    </li>
                    <li>
                      <span className="font-semibold text-white">Audio:</span>{" "}
                      {song.audio ? "High-quality stream" : "Unavailable"}
                    </li>
                    <li>
                      <span className="font-semibold text-white">Play Count:</span>{" "}
                      {song.playCount || 0}
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Prefer a different vibe?
                  </h3>
                  <p className="mt-3 text-sm text-gray-300">
                    Choose another track to explore its story and instrumentation.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </section>

        {hasContent && similar.length > 0 && (
          <section className="bg-[#101010] py-16">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Similar Tracks</h2>
                <p className="text-sm text-gray-400">
                  Inspired by genre and artist proximity
                </p>
              </div>
              <div
                className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
                  isFetchingNew ? "opacity-60 pointer-events-none" : "opacity-100"
                }`}
              >
                {(similar.length > 0 ? similar : Array.from({ length: 6 })).map((item, idx) =>
                  item ? (
                    <button
                      key={item._id || idx}
                      onClick={() => navigate(`/songs/${item._id}`)}
                      className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#181818] p-4 text-left transition hover:border-white/10 hover:bg-[#1f1f1f]"
                    >
                      <img
                        src={item.cover || "/healers.webp"}
                        alt={item.title}
                        className="h-16 w-16 rounded-2xl object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "/healers.webp";
                          e.target.onerror = null;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                      </div>
                    </button>
                  ) : (
                    <div
                      key={`skeleton-${idx}`}
                      className="flex items-center gap-4 rounded-3xl border border-white/5 bg-[#181818] p-4"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-white/10 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-3 rounded bg-white/10 animate-pulse w-3/4" />
                        <div className="h-3 rounded bg-white/10 animate-pulse w-1/2" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-4 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>
                Built end-to-end by{" "}
                <a
                  href="https://ausiaam.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-100"
                >
                  Aiman Uddin Siam
                </a>
                .
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

