// src/pages/Register.jsx
import { useState } from 'react';
import { FaEye, FaEyeSlash, FaUserCircle } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { uploadToImageKit } from '../utils/upload';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '', // 🆕
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-fuchsia-900 to-black text-white">
      <div className="w-full max-w-md p-10 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-700/30">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-lg">
          Create Account
        </h2>
        {/* Profile Image Upload - Centered and Top */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group w-24 h-24 flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              disabled={loading || imageUploading}
              tabIndex={-1}
              aria-label="Upload profile image"
            />
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-400 bg-white/20 shadow-lg"
              />
            ) : (
              <FaUserCircle className="w-24 h-24 text-purple-300 bg-white/20 rounded-full border-4 border-purple-400 shadow-lg" />
            )}
            {/* Overlay for Upload text */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <span className="text-white font-semibold text-lg">Upload</span>
            </div>
            {/* Loading spinner */}
            {imageUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-30">
                <svg className="animate-spin h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-2">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              onChange={handleChange}
              value={formData.name}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white pr-12 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-purple-300"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white pr-12 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-purple-300"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-600 hover:to-purple-700 transition px-4 py-3 rounded-lg text-white font-bold shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-purple-500/30" />
          <span className="text-purple-300 text-sm">OR</span>
          <div className="flex-1 h-px bg-purple-500/30" />
        </div>

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-4 py-3 rounded-lg hover:bg-purple-100 transition border-2 border-purple-400 shadow"
        >
          <FcGoogle className="text-2xl" />
          Sign up with Google
        </button>

        <p className="mt-6 text-center text-sm text-purple-200">
          Already have an account?{' '}
          <a href="/login" className="underline text-pink-300 hover:text-pink-400 font-semibold">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
