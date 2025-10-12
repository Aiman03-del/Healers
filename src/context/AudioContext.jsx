// src/context/AudioContext.jsx
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

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

  // Set audio element attributes for better media session integration
  useEffect(() => {
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
  }, [audio]);

  // Handle notification click to bring app to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentSong && isPlaying) {
        // App came to foreground, ensure audio is playing
        audio.play().catch(() => {
          // Auto-play might be blocked, user needs to click play
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [audio, currentSong, isPlaying]);

  // Play a song and update queue/index if needed - Memoized
  const playSong = useCallback((song, index, songs) => {
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
  }, [audio, loopMode, volume]);

  const playNext = useCallback(() => {
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
  }, [queue, currentIndex, shuffle, loopMode, playSong]);

  const playPrev = useCallback(() => {
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
  }, [queue, currentIndex, shuffle, playSong]);

  const pauseSong = useCallback(() => {
    audio.pause();
    setIsPlaying(false);
  }, [audio]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  }, [audio, isPlaying]);

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

  // Update Media Session API when song changes
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;

    try {
      // Get absolute URL for cover image
      const coverUrl = currentSong.cover?.startsWith('http') 
        ? currentSong.cover 
        : `${window.location.origin}${currentSong.cover || '/healers.png'}`;

      // Set metadata with proper image URLs
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Unknown Title',
        artist: currentSong.artist || 'Unknown Artist',
        album: currentSong.album || 'Healers Music',
        artwork: [
          {
            src: coverUrl,
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: coverUrl,
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: coverUrl,
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: coverUrl,
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: coverUrl,
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: coverUrl,
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });

      // Update playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    } catch (error) {
      console.error('Error setting up media session:', error);
    }
  }, [currentSong, isPlaying]);

  // Setup Media Session action handlers (only once)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      // Play action
      navigator.mediaSession.setActionHandler('play', () => {
        audio.play().then(() => setIsPlaying(true));
      });

      // Pause action
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setIsPlaying(false);
      });

      // Previous track
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrev();
      });

      // Next track
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });

      // Seek backward (10 seconds)
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        audio.currentTime = Math.max(0, audio.currentTime - skipTime);
      });

      // Seek forward (10 seconds)
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + skipTime);
      });

      // Seek to specific position
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== null && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
        }
      });

      // Stop action (close app or stop playback)
      navigator.mediaSession.setActionHandler('stop', () => {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      });

    } catch (error) {
      console.error('Error setting up media session handlers:', error);
    }

    // Cleanup
    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
          navigator.mediaSession.setActionHandler('seekto', null);
          navigator.mediaSession.setActionHandler('stop', null);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [audio, playNext, playPrev]);

  // Update position state for progress bar (throttled for performance)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    if (!duration || duration === 0 || isNaN(duration)) return;
    if (isNaN(currentTime)) return;

    // Throttle position updates to every 1 second for better performance
    const updatePositionState = () => {
      try {
        // Clamp values to prevent errors
        const validDuration = Math.max(0.1, Math.floor(duration));
        const validPosition = Math.max(0, Math.min(Math.floor(currentTime), validDuration));
        
        // Only update if values are valid
        if (validDuration > 0 && validPosition >= 0) {
          navigator.mediaSession.setPositionState({
            duration: validDuration,
            playbackRate: 1.0,
            position: validPosition
          });
        }
      } catch (error) {
        // Position state might not be supported or values might be invalid
        console.debug('Position state error:', error);
      }
    };

    // Update immediately and then throttle
    updatePositionState();
    
    // Throttle to reduce updates
    const throttleTimer = setInterval(updatePositionState, 1000);
    
    return () => clearInterval(throttleTimer);
  }, [currentTime, duration, currentSong]);

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

    const handleLoadedMetadata = () => {
      // When metadata is loaded, update duration immediately
      setDuration(audio.duration || 0);
      
      // Update media session with correct duration
      if ('mediaSession' in navigator && audio.duration && !isNaN(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.floor(audio.duration),
            playbackRate: 1.0,
            position: 0
          });
        } catch (e) {
          console.debug('Error setting initial position state:', e);
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audio, currentIndex, loopMode, shuffle, queue, playNext]);

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
