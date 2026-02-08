'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PhoneInput from '@/components/PhoneInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setAccountExists(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Password must be at least 8 characters with 1 uppercase letter and 1 number');
        setLoading(false);
        return;
      }
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }
      if (!phone.trim()) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      if (error) {
        if (error.message === 'ACCOUNT_EXISTS') {
          setAccountExists(true);
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        handleClose();
      }
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(false);
  };

  if (accountExists && mode === 'signup') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-maison-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-md bg-maison-ivory p-8 md:p-12 shadow-2xl"
            >
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-maison-graphite/60 hover:text-maison-black transition-colors duration-300"
              >
                <X size={20} strokeWidth={1} />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-maison-black mb-4">
                  Account Already Exists
                </h2>
                <p className="text-maison-graphite font-light leading-relaxed mb-8">
                  An account with this email already exists. Please sign in instead, or reset your password if you've forgotten it.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => { setAccountExists(false); setMode('login'); }}
                    className="maison-btn-primary w-full"
                  >
                    Sign In
                  </button>
                  <a
                    href="/auth/forgot-password"
                    className="block w-full border border-maison-graphite/30 hover:border-maison-graphite/60 text-maison-graphite py-3 px-6 text-xs font-light tracking-[0.15em] uppercase transition-all duration-300 text-center"
                  >
                    Reset Password
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (success && mode === 'signup') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-maison-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-md bg-maison-ivory p-8 md:p-12 shadow-2xl"
            >
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-maison-graphite/60 hover:text-maison-black transition-colors duration-300"
              >
                <X size={20} strokeWidth={1} />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-maison-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-maison-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-maison-black mb-4">
                  Check Your Email
                </h2>
                <p className="text-maison-graphite font-light leading-relaxed mb-8">
                  We've sent you a confirmation link. Please click the link in your email to activate your account.
                </p>
                <button
                  onClick={handleClose}
                  className="maison-btn-primary w-full"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-maison-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-md bg-maison-ivory p-8 md:p-12 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-maison-graphite/60 hover:text-maison-black transition-colors duration-300"
            >
              <X size={20} strokeWidth={1} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-2xl font-light tracking-wider text-maison-black mb-1">
                MAISON JOVÉ
              </h1>
              <div className="maison-gold-line mx-auto my-4" />
              <h2 className="font-serif text-xl md:text-2xl font-light text-maison-charcoal">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light"
                >
                  {error}
                </motion.div>
              )}

              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-first-name" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                      First Name
                    </label>
                    <input
                      id="auth-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="maison-input"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-last-name" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                      Last Name
                    </label>
                    <input
                      id="auth-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="maison-input"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="maison-input"
                  placeholder="your@email.com"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-phone" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                    Phone Number
                  </label>
                  <PhoneInput
                    id="auth-phone"
                    value={phone}
                    onChange={setPhone}
                    required
                    variant="maison"
                    placeholder="71 123 456"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-password" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="maison-input"
                  placeholder="••••••••"
                />
                {mode === 'signup' && (
                  <p className="text-xs text-maison-graphite/60 mt-1 font-light">
                    Min 8 characters, 1 uppercase, 1 number
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-confirm-password" className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                    Confirm Password
                  </label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="maison-input"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="maison-btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-8 text-center">
              <p className="text-sm text-maison-graphite font-light">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-2 text-maison-gold hover:text-maison-gold-muted transition-colors duration-300 font-medium"
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
