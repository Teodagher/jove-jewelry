'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setSaving(false);
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      setSaving(false);
      return;
    }

    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-serif font-light text-maison-charcoal tracking-wider mb-6">
        Settings
      </h2>

      <div className="max-w-lg">
        <h3 className="text-sm uppercase tracking-wider text-maison-graphite/60 mb-4">
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div
              className={`px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="maison-input"
            />
            <div className="mt-2 space-y-1">
              <p className={`text-xs ${password.length >= 8 ? 'text-green-600' : 'text-maison-graphite/40'}`}>
                {password.length >= 8 ? '\u2713' : '\u2022'} At least 8 characters
              </p>
              <p className={`text-xs ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-maison-graphite/40'}`}>
                {/[A-Z]/.test(password) ? '\u2713' : '\u2022'} At least one uppercase letter
              </p>
              <p className={`text-xs ${/[0-9]/.test(password) ? 'text-green-600' : 'text-maison-graphite/40'}`}>
                {/[0-9]/.test(password) ? '\u2713' : '\u2022'} At least one number
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="maison-input"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-black hover:bg-zinc-800 text-white py-3 px-8 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
