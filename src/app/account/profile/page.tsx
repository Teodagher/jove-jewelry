'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import PhoneInput from '@/components/PhoneInput';

const countries = [
  'Lebanon', 'Australia', 'United States', 'Canada', 'United Kingdom', 'France',
  'Germany', 'Italy', 'Spain', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
  'Oman', 'Jordan', 'Egypt', 'Turkey', 'Switzerland', 'Netherlands', 'Belgium',
  'Sweden', 'Norway', 'Denmark', 'Austria', 'Portugal', 'Greece', 'Brazil',
  'Japan', 'South Korea', 'India', 'China', 'South Africa', 'New Zealand',
  'Mexico', 'Argentina', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia',
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const sb = createClient();
      const { data, error } = await sb
        .from('users')
        .select('first_name, last_name, phone, country, full_name')
        .eq('auth_user_id', user.id)
        .single() as { data: { first_name: string | null; last_name: string | null; phone: string | null; country: string | null; full_name: string | null } | null; error: unknown };

      if (!error && data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setCountry(data.country || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required.' });
      return;
    }
    if (!phone.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const sb = createClient();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Update users table
    const { error: dbError } = await sb
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        phone: phone.trim(),
        country: country || null,
      } as never)
      .eq('auth_user_id', user.id);

    if (dbError) {
      setMessage({ type: 'error', text: dbError.message });
      setSaving(false);
      return;
    }

    // Update auth metadata
    const { error: authError } = await sb.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: fullName, phone: phone.trim(), country: country || null },
    });

    if (authError) {
      setMessage({ type: 'error', text: authError.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maison-gold"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif font-light text-maison-charcoal tracking-wider mb-6">
        Profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First name"
              className="maison-input"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last name"
              className="maison-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="maison-input bg-maison-cream/50 cursor-not-allowed text-maison-graphite/70"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={setPhone}
            required
            variant="maison"
            placeholder="71 123 456"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-xs uppercase tracking-wider text-maison-graphite/60 mb-2">
            Country of Residence <span className="text-maison-graphite/40 text-[10px] normal-case tracking-normal">(optional)</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="maison-input bg-white"
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-black hover:bg-zinc-800 text-white py-3 px-8 text-sm font-light tracking-[0.15em] transition-all duration-500 rounded-none border-0 uppercase"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
