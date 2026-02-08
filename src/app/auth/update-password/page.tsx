'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center jove-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-auto text-center">
              <h1 className="text-3xl font-serif font-light text-zinc-900 tracking-wider">JOVE</h1>
              <p className="text-xs text-zinc-600 font-light tracking-[0.2em] mt-1">CUSTOM JEWELRY</p>
            </div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mt-8 mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-4">
              Password updated
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-black hover:bg-zinc-800 text-white py-3 px-6 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center jove-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-auto text-center">
            <h1 className="text-3xl font-serif font-light text-zinc-900 tracking-wider">JOVE</h1>
            <p className="text-xs text-zinc-600 font-light tracking-[0.2em] mt-1">CUSTOM JEWELRY</p>
          </div>
          <h2 className="mt-6 text-2xl font-light text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose a strong password for your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <div className="mt-2 space-y-1">
                <p className={`text-xs ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  {password.length >= 8 ? '\u2713' : '\u2022'} At least 8 characters
                </p>
                <p className={`text-xs ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                  {/[A-Z]/.test(password) ? '\u2713' : '\u2022'} At least one uppercase letter
                </p>
                <p className={`text-xs ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                  {/[0-9]/.test(password) ? '\u2713' : '\u2022'} At least one number
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-white py-3 px-6 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
            >
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="block text-sm text-zinc-600 hover:text-zinc-900 transition-colors duration-200"
            >
              &larr; Back to Jov&eacute;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
