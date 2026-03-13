import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* Fleur-de-lis SVG for password visibility toggle */
const FleurDeLis = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 9.5 5.5 9.5 8C9.5 9.8 10.5 11 12 11.5C13.5 11 14.5 9.8 14.5 8C14.5 5.5 12 2 12 2Z" opacity="0.9"/>
    <path d="M5 10C5 10 3 12.5 4 14.5C4.8 16 6.5 16.5 8 16C8 16 7 14.5 7.5 13C8 11.5 9.5 11 9.5 11C7.5 11 5 10 5 10Z" opacity="0.7"/>
    <path d="M19 10C19 10 21 12.5 20 14.5C19.2 16 17.5 16.5 16 16C16 16 17 14.5 16.5 13C16 11.5 14.5 11 14.5 11C16.5 11 19 10 19 10Z" opacity="0.7"/>
    <path d="M12 12V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M9 18H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

/* Classic Heritage Vine Flourish SVG */
const VineFlourish = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 190 Q 30 170, 50 180 T 90 160 T 130 170 T 170 140 T 190 100 Q 180 80, 160 90 T 120 70 T 80 80 T 40 50 T 10 10"
      stroke="var(--vine-green, #2E5A2E)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Leaves */}
    <ellipse cx="50" cy="175" rx="8" ry="12" fill="var(--vine-green, #2E5A2E)" opacity="0.6" transform="rotate(-30, 50, 175)"/>
    <ellipse cx="90" cy="155" rx="7" ry="10" fill="var(--vine-green, #2E5A2E)" opacity="0.5" transform="rotate(-45, 90, 155)"/>
    <ellipse cx="130" cy="165" rx="8" ry="11" fill="var(--vine-green, #2E5A2E)" opacity="0.6" transform="rotate(-20, 130, 165)"/>
    <ellipse cx="170" cy="135" rx="6" ry="9" fill="var(--vine-green, #2E5A2E)" opacity="0.5" transform="rotate(-60, 170, 135)"/>
    <ellipse cx="160" cy="85" rx="7" ry="10" fill="var(--vine-green, #2E5A2E)" opacity="0.6" transform="rotate(30, 160, 85)"/>
    <ellipse cx="120" cy="65" rx="8" ry="11" fill="var(--vine-green, #2E5A2E)" opacity="0.5" transform="rotate(45, 120, 65)"/>
    <ellipse cx="80" cy="75" rx="6" ry="9" fill="var(--vine-green, #2E5A2E)" opacity="0.6" transform="rotate(20, 80, 75)"/>
    <ellipse cx="40" cy="45" rx="7" ry="10" fill="var(--vine-green, #2E5A2E)" opacity="0.5" transform="rotate(60, 40, 45)"/>
    {/* Curling tendrils */}
    <path d="M55 185 Q 60 195, 70 190" stroke="var(--vine-green, #2E5A2E)" strokeWidth="1" fill="none" opacity="0.4"/>
    <path d="M95 150 Q 100 140, 110 145" stroke="var(--vine-green, #2E5A2E)" strokeWidth="1" fill="none" opacity="0.4"/>
    <path d="M175 130 Q 185 125, 190 135" stroke="var(--vine-green, #2E5A2E)" strokeWidth="1" fill="none" opacity="0.4"/>
    <path d="M115 60 Q 105 50, 100 60" stroke="var(--vine-green, #2E5A2E)" strokeWidth="1" fill="none" opacity="0.4"/>
  </svg>
);

const LEGACY_QUOTES = [
  "Family is the vine that holds us all together.",
  "Every branch tells a story worth preserving.",
  "In our roots, we find our strength.",
  "The best heritage is a loving family.",
  "We carry the stories of those who came before us.",
  "A family tree is a garden of memories.",
  "Our ancestors live on through the stories we tell.",
  "Every generation adds a new chapter to our legacy.",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Check if session expired
  const sessionExpired = searchParams.get('session') === 'expired';

  // Redirect already-authenticated users to homepage
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Rotating legacy quote
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * LEGACY_QUOTES.length)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % LEGACY_QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = useMemo(() => LEGACY_QUOTES[quoteIndex], [quoteIndex]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setLoading(false);
      return;
    }

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid username or password');
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }

    setLoading(false);
  };

  return (
    <div className="login-stage">
      {/* Vignette overlay */}
      <div className="login-vignette" />

      {/* Corner Vine Flourishes */}
      <img src="/homepage-vines.png" alt="" className="login-vine-corner login-vine-tl" aria-hidden="true" />
      <img src="/homepage-vines.png" alt="" className="login-vine-corner login-vine-tr" aria-hidden="true" />
      <img src="/homepage-vines.png" alt="" className="login-vine-corner login-vine-bl" aria-hidden="true" />
      <img src="/homepage-vines.png" alt="" className="login-vine-corner login-vine-br" aria-hidden="true" />

      {/* Main content container */}
      <div className="login-content">
        {/* Brand logo */}
        <div className="login-brand">
          <img
            src="/logo.png"
            alt="FamilyVine"
            className="login-brand-logo h-16 w-auto object-contain"
          />
        </div>

        {/* Login form card */}
        <div className="max-w-[400px] w-full">
          <div className={`login-card-vellum ${shaking ? 'login-card-shake' : ''}`}>
            <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)', fontSize: '1.2rem', fontWeight: 600, textAlign: 'center', marginBottom: '14px' }}>
              Sign In
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Session expired message */}
              {sessionExpired && !error && (
                <div className="mb-4 p-3 rounded-lg text-center" role="status" style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: 'var(--vine-dark)'
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', margin: 0 }}>
                    Your session has expired. Please sign in again.
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="login-error mb-4" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Username */}
                <div>
                  <label htmlFor="login-username" style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--vine-dark)', display: 'block', marginBottom: '6px' }}>
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="login-username"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="login-input"
                      placeholder="Enter username"
                      disabled={loading}
                      autoComplete="username"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--vine-sage)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" style={{ fontFamily: 'var(--font-header)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--vine-dark)', display: 'block', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="login-input"
                      style={{ paddingRight: '40px' }}
                      placeholder="Enter password"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`login-fleur-toggle ${showPassword ? 'active' : ''}`}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <FleurDeLis className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="login-leaf-check"
                    />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--vine-sage)', marginLeft: '8px' }}>
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--vine-green)' }}
                    className="hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn-vine"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Register link */}
                <div className="text-center">
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--vine-sage)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--vine-green)', fontWeight: 600 }} className="hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Legacy wisdom quote */}
          <div className="login-wisdom-footer" key={quoteIndex}>
            <p className="login-wisdom-quote">
              "{currentQuote}"
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-3 mb-4 login-footer">
            <p>
              &copy; {new Date().getFullYear()} FamilyVine &mdash; Connecting Generations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
