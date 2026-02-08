'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-4">
              Check your email
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              If an account exists with that email, we've sent you a password reset link. Please check your inbox.
            </p>
            <Link
              href="/auth/login"
              className="w-full bg-black hover:bg-zinc-800 text-white py-3 px-6 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase inline-block text-center"
            >
              Back to Sign In
            </Link>
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
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-white py-3 px-6 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/login"
              className="block text-sm text-amber-600 hover:text-amber-500"
            >
              Back to Sign In
            </Link>
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
