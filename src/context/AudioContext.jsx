// src/context/AudioContext.jsx
import { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export function useAudio() {
  return useContext(AudioContext);
}

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1); // volume = 0 to 1
  const [progress, setProgress] = useState(0); // percentage (0–100)
  const [duration, setDuration] = useState(0); // seconds
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [loopMode, setLoopMode] = useState(0); // 0: no loop, 1: loop one, 2: loop all
  const [shuffle, setShuffle] = useState(false); // 🆕 shuffle state

  const audio = audioRef.current;

  // Play a song and update queue/index if needed
  const playSong = (song, index, songs) => {
    if (songs && Array.isArray(songs)) {
      setQueue(songs);
      setCurrentIndex(index);
      setCurrentSong(song);
      audio.src = song.audio;
      audio.loop = loopMode === 1;
      audio.volume = volume;
      audio.play();
      setIsPlaying(true);
    } else {
      // Use existing queue
      setCurrentSong(song);
      setCurrentIndex(index);
      audio.src = song.audio;
      audio.loop = loopMode === 1;
      audio.volume = volume;
      audio.play();
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (!queue || queue.length === 0 || currentIndex == null) return;
    let nextIndex;
    if (shuffle) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
    }
    if (nextIndex < queue.length) {
      playSong(queue[nextIndex], nextIndex);
    } else if (loopMode === 2 && queue.length > 0) {
      // Loop all: go to first song
      playSong(queue[0], 0);
    } else {
      setIsPlaying(false);
      setCurrentSong(null);
      setCurrentIndex(null);
    }
  };

  const playPrev = () => {
    if (!queue || queue.length === 0 || currentIndex == null) return;
    let prevIndex;
    if (shuffle) {
      do {
        prevIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && prevIndex === currentIndex);
    } else {
      prevIndex = currentIndex - 1;
    }
    if (prevIndex >= 0) {
      playSong(queue[prevIndex], prevIndex);
    } else {
      setIsPlaying(false);
      setCurrentSong(null);
      setCurrentIndex(null);
    }
  };

  const pauseSong = () => {
    audio.pause();
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) pauseSong();
    else audio.play().then(() => setIsPlaying(true));
  };

  const changeVolume = (v) => {
    const vol = Math.max(0, Math.min(1, v)); // Clamp between 0-1
    audio.volume = vol;
    setVolume(vol);
  };

  const seekTo = (percent) => {
    const time = (percent / 100) * duration;
    audio.currentTime = time;
    setProgress(percent);
  };

  const toggleLoop = () => {
    // Cycle through: 0 (no loop) -> 1 (loop one) -> 2 (loop all) -> 0
    setLoopMode((prev) => (prev + 1) % 3);
  };

  const toggleShuffle = () => {
    setShuffle((prev) => !prev);
  };

  const playQueue = (songs) => {
    if (!songs || songs.length === 0) return;
    setQueue(songs);
    setCurrentIndex(0);
    setCurrentSong(songs[0]);
    audio.src = songs[0].audio;
    audio.loop = loopMode === 1;
    audio.volume = volume;
    audio.play();
    setIsPlaying(true);
  };

  // 🆕 Shuffle helpers
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playShuffledPlaylist = (songs) => {
    const shuffled = shuffleArray(songs);
    setQueue(shuffled);
    setCurrentIndex(0);
    setCurrentSong(shuffled[0]);
    audio.src = shuffled[0].audio;
    audio.loop = loopMode === 1;
    audio.volume = volume;
    audio.play();
    setIsPlaying(true);
  };

  useEffect(() => {
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleEnded = () => {
      if (loopMode === 1) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio, currentIndex, loopMode, shuffle, queue]);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        pauseSong,
        togglePlayPause,
        volume,
        changeVolume,
        currentTime,
        duration,
        progress,
        seekTo,
        playNext,
        playPrev,
        loopMode,
        setLoopMode,
        toggleLoop,
        shuffle,
        toggleShuffle,
        queue,
        setQueue,
        currentIndex,
        playQueue,
        playShuffledPlaylist,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
