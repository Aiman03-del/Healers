// src/pages/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaMusic, FaEnvelope, FaLock, FaHeadphones, FaHeart, FaGuitar } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import logo from '../assets/healers.png';

function Login() {
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Navigation handled by login function in AuthContext
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      // Navigation handled by googleLogin function in AuthContext
    } catch (err) {
      setError(err?.message || 'Google login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-white relative overflow-hidden">

      <div className="w-full flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Branding & Content */}
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
                  Welcome Back to Your
                  <span className="block text-white">
                    Musical Journey
                  </span>
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Continue exploring thousands of healing melodies crafted just for you.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaHeadphones className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Unlimited Music</h3>
                    <p className="text-sm text-gray-400">Stream your favorite songs anytime</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaHeart className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Personalized Playlists</h3>
                    <p className="text-sm text-gray-400">Create and share your collections</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#181818] hover:bg-[#282828] border border-gray-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center">
                    <FaGuitar className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">High Quality Audio</h3>
                    <p className="text-sm text-gray-400">Experience music like never before</p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right Side - Login Form */}
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
                Welcome Back
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <FaMusic className="text-xs" />
                Continue your healing journey
              </p>
            </div>

            <div className="bg-[#181818] rounded-lg shadow-2xl border border-gray-800 p-8 relative overflow-hidden">
              {/* Content */}
              <div className="relative z-10">
                {/* Desktop Title */}
                <div className="hidden lg:block mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Login to Healers</h2>
                  <p className="text-gray-400">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field - Spotify Style */}
                  <div>
                    <label className="flex items-center gap-2 mb-2 text-sm text-white font-semibold">
                      <FaEnvelope className="text-xs" />
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
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
                        placeholder="Enter your password"
                        className="w-full p-3.5 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 pr-12 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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

                    {/* Login Button - Spotify Style */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black hover:scale-105 transition-all duration-300 px-4 py-3.5 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Logging in...
                      </span>
                    ) : (
                      'Login to Healers'
                    )}
                  </motion.button>
                </form>
                
                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-gray-400 text-sm font-semibold">OR</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Google Login Button - Spotify Style */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:scale-105 text-black font-bold px-4 py-3.5 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FcGoogle className="text-2xl" />
                  Continue with Google
                </motion.button>

                {/* Sign up link - Spotify Style */}
                <p className="mt-6 text-center text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-white hover:underline font-semibold transition-colors"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
export { Login };
