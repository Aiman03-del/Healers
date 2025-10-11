// src/pages/Onboarding.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaMusic, FaGuitar, FaHeart, FaCheckCircle, FaChevronRight, FaChevronLeft, FaHeadphones } from "react-icons/fa";
import useAxios from "../hooks/useAxios";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [allArtists, setAllArtists] = useState([]);
  const { get, put } = useAxios();
  
  const [preferences, setPreferences] = useState({
    favoriteGenres: [],
    favoriteArtists: [],
    moods: [],
    listeningHabits: "",
  });

  const genresList = [
    "Pop", "Rock", "Jazz", "Hip-Hop", "Classical", "EDM", 
    "R&B", "Country", "Reggae", "Blues", "Metal", "Folk",
    "Indie", "Soul", "Funk", "Disco", "Latin", "K-Pop"
  ];

  const moodsList = [
    { id: "energetic", label: "Energetic", icon: "⚡", color: "from-yellow-500 to-orange-500" },
    { id: "chill", label: "Chill & Relaxed", icon: "🌙", color: "from-blue-500 to-purple-500" },
    { id: "happy", label: "Happy & Upbeat", icon: "😊", color: "from-pink-500 to-rose-500" },
    { id: "sad", label: "Melancholic", icon: "🌧️", color: "from-gray-500 to-blue-600" },
    { id: "focused", label: "Focus & Study", icon: "📚", color: "from-green-500 to-teal-500" },
    { id: "workout", label: "Workout", icon: "💪", color: "from-red-500 to-orange-600" },
    { id: "party", label: "Party Time", icon: "🎉", color: "from-purple-500 to-fuchsia-600" },
    { id: "romantic", label: "Romantic", icon: "💕", color: "from-pink-400 to-red-400" },
  ];

  const listeningHabitsList = [
    { id: "morning", label: "Morning Person 🌅", desc: "Love starting the day with music" },
    { id: "night", label: "Night Owl 🌙", desc: "Late night listening sessions" },
    { id: "commute", label: "Commuter 🚗", desc: "Music on the go" },
    { id: "allday", label: "All Day Long 🎧", desc: "Music is life!" },
  ];

  // Fetch all unique artists from songs
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await get("/api/songs");
        const songs = res.data.songs || [];
        const uniqueArtists = [...new Set(songs.map(s => s.artist))].filter(Boolean);
        setAllArtists(uniqueArtists.sort());
      } catch {
        setAllArtists([]);
      }
    };
    fetchArtists();
  }, []);

  const toggleGenre = (genre) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter((g) => g !== genre)
        : [...prev.favoriteGenres, genre],
    }));
  };

  const toggleArtist = (artist) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteArtists: prev.favoriteArtists.includes(artist)
        ? prev.favoriteArtists.filter((a) => a !== artist)
        : [...prev.favoriteArtists, artist],
    }));
  };

  const toggleMood = (mood) => {
    setPreferences((prev) => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter((m) => m !== mood)
        : [...prev.moods, mood],
    }));
  };

  const handleNext = () => {
    if (currentStep === 0 && preferences.favoriteGenres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }
    if (currentStep === 1 && preferences.favoriteArtists.length === 0 && allArtists.length > 0) {
      toast.error("Please select at least one artist");
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (preferences.moods.length === 0) {
      toast.error("Please select at least one mood");
      return;
    }
    if (!preferences.listeningHabits) {
      toast.error("Please select your listening habit");
      return;
    }

    try {
      await put(`/api/users/${user.uid}/preferences`, preferences);
      toast.success("🎉 Profile setup complete!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to save preferences");
    }
  };

  const steps = [
    {
      id: 0,
      title: "Choose Your Favorite Genres",
      subtitle: "Select all genres you enjoy listening to",
      icon: <FaMusic className="text-5xl" />,
    },
    {
      id: 1,
      title: "Pick Your Favorite Artists",
      subtitle: "Who do you love to listen to?",
      icon: <FaGuitar className="text-5xl" />,
    },
    {
      id: 2,
      title: "What's Your Vibe?",
      subtitle: "Select moods that match your taste",
      icon: <FaHeart className="text-5xl" />,
    },
    {
      id: 3,
      title: "When Do You Listen?",
      subtitle: "Tell us about your listening habits",
      icon: <FaHeadphones className="text-5xl" />,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-fuchsia-950 to-black p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: currentStep === index ? 1.1 : 1,
                  backgroundColor: currentStep >= index ? "#a855f7" : "#4c1d95",
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-4 ${
                  currentStep >= index ? "border-purple-400" : "border-purple-800"
                }`}
              >
                {currentStep > index ? <FaCheckCircle /> : index + 1}
              </motion.div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 w-full h-1 bg-purple-900 -z-10" style={{ left: '50%', width: 'calc(100% - 48px)' }}>
                  <motion.div
                    initial={false}
                    animate={{ width: currentStep > index ? "100%" : "0%" }}
                    className="h-full bg-purple-500"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900/90 via-purple-900/80 to-fuchsia-900/70 backdrop-blur-2xl p-8 md:p-12 rounded-3xl shadow-2xl border border-purple-500/30"
        >
          {/* Step Icon & Title */}
          <div className="text-center mb-8">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-yellow-400 flex justify-center mb-4"
            >
              {steps[currentStep].icon}
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-purple-200 text-lg">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[300px]"
            >
              {/* Step 0: Genres */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <p className="text-purple-300 text-sm mb-4">
                    Selected: {preferences.favoriteGenres.length} genre{preferences.favoriteGenres.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {genresList.map((genre) => (
                      <motion.button
                        key={genre}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleGenre(genre)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          preferences.favoriteGenres.includes(genre)
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border-2 border-purple-400"
                            : "bg-white/10 text-purple-200 border-2 border-purple-500/30 hover:border-purple-400"
                        }`}
                      >
                        {genre}
                        {preferences.favoriteGenres.includes(genre) && (
                          <FaCheckCircle className="inline ml-2" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Artists */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <p className="text-purple-300 text-sm mb-4">
                    Selected: {preferences.favoriteArtists.length} artist{preferences.favoriteArtists.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {allArtists.map((artist) => (
                      <motion.button
                        key={artist}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleArtist(artist)}
                        className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                          preferences.favoriteArtists.includes(artist)
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border-2 border-purple-400"
                            : "bg-white/10 text-purple-200 border-2 border-purple-500/30 hover:border-purple-400"
                        }`}
                      >
                        {artist}
                        {preferences.favoriteArtists.includes(artist) && (
                          <FaCheckCircle className="inline ml-2" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {allArtists.length === 0 && (
                    <div className="text-center text-purple-300 py-12">
                      <FaMusic className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No artists available yet. Skip this step.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Moods */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <p className="text-purple-300 text-sm mb-4">
                    Selected: {preferences.moods.length} mood{preferences.moods.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {moodsList.map((mood) => (
                      <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleMood(mood.id)}
                        className={`p-4 rounded-2xl font-semibold transition-all duration-200 relative overflow-hidden ${
                          preferences.moods.includes(mood.id)
                            ? "border-2 border-purple-400 shadow-xl"
                            : "bg-white/10 border-2 border-purple-500/30 hover:border-purple-400"
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-${preferences.moods.includes(mood.id) ? '80' : '0'} transition-opacity`} />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-3xl">{mood.icon}</span>
                          <span className="text-white font-bold">{mood.label}</span>
                          {preferences.moods.includes(mood.id) && (
                            <FaCheckCircle className="text-white text-xl" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Listening Habits */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {listeningHabitsList.map((habit) => (
                      <motion.button
                        key={habit.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPreferences({ ...preferences, listeningHabits: habit.id })}
                        className={`p-5 rounded-2xl text-left transition-all duration-200 ${
                          preferences.listeningHabits === habit.id
                            ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 border-2 border-purple-400 shadow-xl"
                            : "bg-white/10 border-2 border-purple-500/30 hover:border-purple-400"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-full ${
                            preferences.listeningHabits === habit.id
                              ? "bg-white/20"
                              : "bg-purple-500/30"
                          }`}>
                            <FaMusic />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-lg mb-1">{habit.label}</h4>
                            <p className="text-purple-200 text-sm">{habit.desc}</p>
                          </div>
                          {preferences.listeningHabits === habit.id && (
                            <FaCheckCircle className="text-white text-2xl flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-200 flex items-center gap-2 border border-purple-500/30"
              >
                <FaChevronLeft /> Back
              </motion.button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                Next <FaChevronRight />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                Complete Setup <FaCheckCircle />
              </motion.button>
            )}
          </div>

          {/* Skip Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="w-full mt-4 text-purple-300 hover:text-white transition-colors text-sm"
          >
            Skip for now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}