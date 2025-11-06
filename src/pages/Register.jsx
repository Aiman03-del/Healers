// src/pages/Register.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUserCircle, FaMusic, FaUser, FaEnvelope, FaLock, FaCamera, FaCheckCircle, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { uploadToImageKit } from '../utils/upload';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/healers.png';

const Register = () => {
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file)); // Show preview only
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      // Navigation handled by googleLogin function
    } catch (err) {
      setError(err?.message || 'Google signup failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!image) {
      setError("Please select a profile image");
      return;
    }
    setLoading(true);
    setImageUploading(true);
    let uploadedImageUrl = '';
    try {
      uploadedImageUrl = await uploadToImageKit(image);
    } catch (err) {
      setError('Image upload failed');
      setLoading(false);
      setImageUploading(false);
      return;
    }
    setImageUploading(false);

    try {
      await register(formData.email, formData.password, {
        name: formData.name,
        image: uploadedImageUrl,
      });
      // Navigation handled by register function in AuthContext
    } catch (err) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-white relative overflow-hidden">

      <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Branding & Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-center items-center p-12 relative"
        >
          <div className="max-w-lg">
            {/* Logo Section */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="relative">
                <img
                  src={logo}
                  alt="Healers Logo"
                  className="w-20 h-20 object-cover rounded-full relative z-10"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Healers
                </h1>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <FaMusic className="text-xs" />
                  Music that heals your soul
                </p>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold mb-4 leading-tight text-white">
                  Start Your Journey
                  <span className="block text-white">
                    Towards Musical Healing
                  </span>
        </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Join thousands of music lovers and discover the healing power of melodies.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaCheckCircle className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">100% Free Forever</h3>
                    <p className="text-sm text-gray-400">No hidden charges, just pure music</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaShieldAlt className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Secure & Private</h3>
                    <p className="text-sm text-gray-400">Your data is safe with us</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaUsers className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Growing Community</h3>
                    <p className="text-sm text-gray-400">Connect with fellow music lovers</p>
                  </div>
                </motion.div>
              </div>

              {/* Stats - Spotify Style */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    10K+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Songs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    5K+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    24/7
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Access</div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right Side - Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-1/2 xl:w-3/5 flex items-center justify-center p-6 lg:p-12"
        >
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative mb-4"
              >
                <img
                  src={logo}
                  alt="Healers Logo"
                  className="w-20 h-20 object-cover rounded-full relative z-10"
                />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Join Healers
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <FaMusic className="text-xs" />
                Start your healing journey today
              </p>
            </div>

            <div className="bg-[#181818] rounded-lg shadow-2xl border border-gray-800 p-8 relative overflow-hidden">
              {/* Content */}
              <div className="relative z-10">
                {/* Desktop Title */}
                <div className="hidden lg:block mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                  <p className="text-gray-400">Sign up to start your musical journey</p>
                </div>

                {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-6">
                  <div className="relative group w-20 h-20 flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              disabled={loading || imageUploading}
              tabIndex={-1}
              aria-label="Upload profile image"
            />
                    <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile Preview"
                          className="w-20 h-20 rounded-full object-cover relative z-10"
              />
            ) : (
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center relative z-10">
                          <FaUserCircle className="w-14 h-14 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Camera icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <FaCamera className="text-white text-xl" />
            </div>
            {/* Loading spinner */}
            {imageUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full z-30">
                        <svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            )}
          </div>
                  <p className="text-xs text-gray-400 mt-2">Upload profile photo</p>
        </div>
                <form onSubmit={handleRegister} className="space-y-4">
          {/* Name Field - Spotify Style */}
          <div>
                    <label className="flex items-center gap-2 mb-2 text-sm text-white font-semibold">
                  <FaUser className="text-xs" />
                  Full Name
                </label>
            <input
              type="text"
              name="name"
                  placeholder="Enter your full name"
                  className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
              onChange={handleChange}
              value={formData.name}
              required
            />
          </div>

              {/* Email Field - Spotify Style */}
          <div>
                <label className="flex items-center gap-2 mb-2 text-sm text-white font-semibold">
                  <FaEnvelope className="text-xs" />
                  Email Address
                </label>
            <input
              type="email"
              name="email"
                  placeholder="your@email.com"
                  className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
              onChange={handleChange}
              required
            />
          </div>

              {/* Password Field - Spotify Style */}
          <div>
                <label className="flex items-center gap-2 mb-2 text-sm text-white font-semibold">
                  <FaLock className="text-xs" />
                  Password
                </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                    placeholder="Create a strong password"
                    className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 pr-12 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

              {/* Confirm Password Field - Spotify Style */}
          <div>
                <label className="flex items-center gap-2 mb-2 text-sm text-white font-semibold">
                  <FaLock className="text-xs" />
                  Confirm Password
                </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                    placeholder="Re-enter your password"
                    className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 pr-12 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Register Button - Spotify Style */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
                className="w-full bg-white text-black hover:scale-105 transition-all duration-300 px-4 py-3.5 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </motion.button>
        </form>
        
        {/* Divider - Spotify Style */}
        <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-400 text-sm font-semibold">OR</span>
              <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google Signup Button - Spotify Style */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignup}
          disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:scale-105 text-black font-bold px-4 py-3.5 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="text-2xl" />
          Sign up with Google
            </motion.button>

                {/* Login link - Spotify Style */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-white hover:underline font-semibold transition-colors"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
