'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      let redirect = searchParams.get('redirect') || '/';
      // Validate redirect is a safe relative path (prevent open redirect)
      if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('://')) {
        redirect = '/';
      }
      // Use hard navigation for admin routes to ensure cookies propagate
      if (redirect.startsWith('/admin')) {
        window.location.href = redirect;
      } else {
        router.push(redirect);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center jove-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-auto text-center">
            <h1 className="text-3xl font-serif font-light text-zinc-900 tracking-wider">JOVÉ</h1>
            <p className="text-xs text-zinc-600 font-light tracking-[0.2em] mt-1">CUSTOM JEWELRY</p>
          </div>
          <h2 className="mt-6 text-2xl font-light text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="block text-sm text-amber-600 hover:text-amber-500"
            >
              Forgot your password?
            </Link>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-amber-600 hover:text-amber-500">
                Sign up
              </Link>
            </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center jove-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}