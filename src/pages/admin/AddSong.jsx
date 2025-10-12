// src/pages/admin/AddSong.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadToImageKit } from '../../utils/upload';
import { toast } from 'react-hot-toast';
import useAxios from "../../hooks/useAxios";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMusic, 
  FaImage, 
  FaUpload, 
  FaCheckCircle, 
  FaTimesCircle,
  FaMicrophone,
  FaGuitar,
  FaCompactDisc,
  FaCloudUploadAlt
} from 'react-icons/fa';

const AddSong = () => {
  const { user } = useAuth();
  const { post } = useAxios();
  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    artist: '',
    genre: '',
    cover: '',
    audio: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');
  const [audioName, setAudioName] = useState('');
  const [dragActive, setDragActive] = useState({ cover: false, audio: false });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle cover image upload
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploadingCover(true);
    toast.loading('Uploading cover image...', { id: 'cover-upload' });
    
    try {
      const url = await uploadToImageKit(file);
      setForm((prev) => ({ ...prev, cover: url }));
      setCoverPreview(url);
      toast.success('Cover uploaded successfully!', { id: 'cover-upload' });
    } catch {
      toast.error('Cover upload failed', { id: 'cover-upload' });
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle audio upload
  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    // Extract song name from file name
    const fileName = file.name;
    const songNameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Try to extract artist and title if format is "Artist - Title"
    let extractedTitle = songNameWithoutExt;
    let extractedArtist = form.artist; // Keep existing artist if any
    
    if (songNameWithoutExt.includes(' - ')) {
      const parts = songNameWithoutExt.split(' - ');
      if (parts.length >= 2) {
        extractedArtist = parts[0].trim();
        extractedTitle = parts.slice(1).join(' - ').trim();
      }
    }
    
    // Auto-fill title (and artist if extracted)
    setForm((prev) => ({ 
      ...prev, 
      title: extractedTitle,
      artist: extractedArtist || prev.artist
    }));
    
    setUploadingAudio(true);
    toast.loading('Uploading audio file...', { id: 'audio-upload' });
    
    try {
      const url = await uploadToImageKit(file);
      setForm((prev) => ({ ...prev, audio: url }));
      setAudioName(file.name);
      toast.success('Audio uploaded! Fields auto-filled.', { id: 'audio-upload' });
    } catch {
      toast.error('Audio upload failed', { id: 'audio-upload' });
    } finally {
      setUploadingAudio(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === 'cover') {
        handleCoverChange({ target: { files: [file] } });
      } else {
        handleAudioChange({ target: { files: [file] } });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure genre is always a non-empty array
    const genreArr = form.genre
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g);

    const song = {
      title: form.title,
      artist: form.artist,
      genre: genreArr.length > 0 ? genreArr : ["Unknown"],
      cover: form.cover,
      audio: form.audio,
    };

    try {
      const res = await post('/api/songs', song);
      toast.success('🎉 Song added successfully!');
      
      // Reset form
      setForm({
        title: '',
        artist: '',
        genre: '',
        cover: '',
        audio: '',
      });
      setCoverPreview('');
      setAudioName('');
      
      console.log('Song upload response:', res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload song!');
      if (err.response) {
        console.log('Song upload error response:', err.response.data);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-fuchsia-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background gradient overlay */}
      <div
        className="fixed inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-2xl opacity-60" />
              <div className="relative bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full p-4 sm:p-5 md:p-6">
                <FaMusic className="text-3xl sm:text-4xl md:text-5xl text-white" />
              </div>
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
              Add New Song
            </span>
          </h1>
          <p className="text-purple-300 text-sm sm:text-base md:text-lg">
            Upload your music and let the magic begin ✨
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-fuchsia-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-purple-500/30 p-4 sm:p-6 md:p-8 relative overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 relative z-10">
            {/* Upload Section - Grid Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Cover Image Upload */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-purple-200">
                  <FaImage className="text-fuchsia-400" />
                  Cover Image
                </label>
                
                <div
                  onDragEnter={(e) => handleDrag(e, 'cover')}
                  onDragLeave={(e) => handleDrag(e, 'cover')}
                  onDragOver={(e) => handleDrag(e, 'cover')}
                  onDrop={(e) => handleDrop(e, 'cover')}
                  onClick={() => coverInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 cursor-pointer transition-all duration-300 ${
                    dragActive.cover
                      ? 'border-fuchsia-400 bg-fuchsia-500/20'
                      : 'border-purple-500/50 hover:border-purple-400 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                  
                  {coverPreview ? (
                    <div className="relative group">
                      <img
                        src={coverPreview}
                        alt="cover preview"
                        className="w-full aspect-square object-cover rounded-lg sm:rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg sm:rounded-xl flex items-center justify-center">
                        <FaImage className="text-3xl sm:text-4xl text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {uploadingCover ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-500 border-t-fuchsia-500" />
                          <p className="text-xs sm:text-sm text-purple-300">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <FaCloudUploadAlt className="mx-auto text-4xl sm:text-5xl md:text-6xl text-purple-400 mb-3 sm:mb-4" />
                          <p className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                            Drop cover image here
                          </p>
                          <p className="text-xs sm:text-sm text-purple-300">
                            or click to browse
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Audio File Upload */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-purple-200">
                  <FaCompactDisc className="text-fuchsia-400" />
                  Audio File
                </label>
                <p className="text-xs text-purple-300/70">
                  💡 Tip: Name as "Artist - Title.mp3" for auto-fill
                </p>
                
                <div
                  onDragEnter={(e) => handleDrag(e, 'audio')}
                  onDragLeave={(e) => handleDrag(e, 'audio')}
                  onDragOver={(e) => handleDrag(e, 'audio')}
                  onDrop={(e) => handleDrop(e, 'audio')}
                  onClick={() => audioInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 cursor-pointer transition-all duration-300 ${
                    dragActive.audio
                      ? 'border-fuchsia-400 bg-fuchsia-500/20'
                      : 'border-purple-500/50 hover:border-purple-400 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                    disabled={uploadingAudio}
                  />
                  
                  <div className="text-center">
                    {uploadingAudio ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-500 border-t-fuchsia-500" />
                        <p className="text-xs sm:text-sm text-purple-300">Uploading audio...</p>
                      </div>
                    ) : audioName ? (
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <FaCheckCircle className="text-4xl sm:text-5xl md:text-6xl text-green-400" />
                        </motion.div>
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-white mb-1">
                            Audio uploaded!
                          </p>
                          <p className="text-xs sm:text-sm text-purple-300 truncate max-w-[200px]">
                            {audioName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <FaCloudUploadAlt className="mx-auto text-4xl sm:text-5xl md:text-6xl text-purple-400 mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                          Drop audio file here
                        </p>
                        <p className="text-xs sm:text-sm text-purple-300">
                          or click to browse
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Song Details Section */}
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2 border-b border-purple-500/30 pb-2">
                <FaGuitar className="text-fuchsia-400 text-lg sm:text-xl" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Song Details</h3>
              </div>

              {/* Title & Artist - Grid for larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-200">
                    <FaMusic className="text-xs" />
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Song Title"
                    className="w-full p-3 sm:p-3.5 rounded-xl bg-white/10 border-2 border-purple-400/50 text-white placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-200">
                    <FaMicrophone className="text-xs" />
                    Artist
                  </label>
                  <input
                    type="text"
                    name="artist"
                    value={form.artist}
                    onChange={handleChange}
                    placeholder="Artist Name"
                    className="w-full p-3 sm:p-3.5 rounded-xl bg-white/10 border-2 border-purple-400/50 text-white placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-200">
                  <FaCompactDisc className="text-xs" />
                  Genres
                </label>
                <input
                  type="text"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g. Pop, Rock, Jazz"
                  className="w-full p-3 sm:p-3.5 rounded-xl bg-white/10 border-2 border-purple-400/50 text-white placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  required
                />
                <p className="text-xs text-purple-300/70 mt-2">
                  Separate multiple genres with commas
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={
                loading ||
                uploadingCover ||
                uploadingAudio ||
                !form.cover ||
                !form.audio ||
                !form.title ||
                !form.artist ||
                !form.genre
              }
              className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300 px-4 py-3.5 sm:py-4 rounded-xl text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-fuchsia-500/50 border-2 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Adding Song...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaUpload />
                  Add Song to Library
                </span>
              )}
            </motion.button>
          </form>
        </div>

        {/* Floating music notes decoration */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="fixed top-20 right-10 text-purple-400/20 text-6xl pointer-events-none hidden lg:block"
        >
          ♪
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="fixed bottom-20 left-10 text-fuchsia-400/20 text-7xl pointer-events-none hidden lg:block"
        >
          ♫
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AddSong;
