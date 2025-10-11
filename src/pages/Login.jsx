// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

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
      setError('Login failed');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-fuchsia-900 to-black text-white">
      <div className="w-full max-w-md p-10 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-700/30">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-lg">
          Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6 text-purple-600">
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-purple-200 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white pr-12 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-600 hover:to-purple-700 transition px-4 py-3 rounded-lg text-white font-bold shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-purple-500/30" />
          <span className="text-purple-300 text-sm">OR</span>
          <div className="flex-1 h-px bg-purple-500/30" />
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-4 py-3 rounded-lg hover:bg-purple-100 transition border-2 border-purple-400 shadow"
        >
          <FcGoogle className="text-2xl" />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-purple-200">
          Don't have an account?{' '}
          <a href="/register" className="underline text-pink-300 hover:text-pink-400 font-semibold">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
export { Login };
