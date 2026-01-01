import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import loginHero from '../assets/login-bg.png';
import logo from '../assets/logo.png';
import { API_BASE_URL } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      if (mfaCode) {
        params.append('mfa_code', mfaCode);
      }

      const response = await axios.post(`${API_BASE_URL}/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Connection timeout. Please check if the server is running.');
      } else if (err.response && err.response.data && err.response.data.detail === 'MFA_REQUIRED') {
        setShowMfa(true);
        setError('Please enter your MFA code');
      } else if (err.response && err.response.status === 401) {
        setError('Invalid username or password');
      } else {
        const detail = err.response?.data?.detail || err.message;
        setError(`Login failed: ${detail} (Status: ${err.response?.status || 'N/A'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FC] font-sans text-[#0F172A]">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative">

        <div className="w-full max-w-[420px] bg-white p-10 rounded-[18px] shadow-[0px_20px_60px_rgba(0,0,0,0.12)] animate-fade-in-up">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                <img src={logo} alt="GT SyncDeck Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0B1C2D] mb-2">Welcome back</h1>
            <p className="text-[#64748B]">Sign in to continue to your workspace</p>
          </div>

          {error && (
            <div className="bg-red-50 text-[#DC2626] p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2 mb-6 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {!showMfa ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-[#0F172A]">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#64748B]">
                      <User size={20} />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F25C05]/20 focus:border-[#F25C05] transition-all placeholder:text-gray-400 text-[#0F172A]"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your corporate username or Email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-[#0F172A]">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#64748B]">
                      <Lock size={20} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-11 pr-12 py-3.5 border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F25C05]/20 focus:border-[#F25C05] transition-all placeholder:text-gray-400 text-[#0F172A]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#0F172A] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label htmlFor="mfaCode" className="block text-sm font-medium text-[#0F172A]">MFA Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  className="w-full px-4 py-3.5 border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F25C05]/20 focus:border-[#F25C05] transition-all text-center tracking-[0.5em] font-mono text-lg text-[#0F172A]"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  autoFocus
                  maxLength={6}
                />
                <p className="text-xs text-[#64748B] text-center mt-2">Enter the 6-digit code from your authenticator app.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F25C05] hover:bg-[#D94F04] text-white py-[14px] rounded-xl font-semibold shadow-lg shadow-[#F25C05]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {showMfa ? 'Verify Identity' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <a href="#" className="block text-sm font-medium text-[#F25C05] hover:text-[#D94F04] transition-colors">
              Forgot password?
            </a>
            <div className="text-sm text-[#64748B]">
              <span className="cursor-pointer hover:text-[#0F172A] transition-colors">Contact administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={loginHero}
          alt="Login Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
