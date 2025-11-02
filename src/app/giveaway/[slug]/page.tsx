'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GiveawaySpinner from '../../../components/GiveawaySpinner';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  source: string;
}

interface Giveaway {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
}

export default function GiveawayPage() {
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [participants, setParticipants] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const fetchGiveawayData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch giveaway details
      const { data: giveawayData, error: giveawayError } = await supabase
        .from('giveaways')
        .select('*')
        .eq('slug', slug)
        .single();

      if (giveawayError || !giveawayData) {
        setError('Giveaway not found');
        setLoading(false);
        return;
      }

      const typedGiveaway = giveawayData as Giveaway;

      if (typedGiveaway.status !== 'active') {
        setError('This giveaway is no longer active');
        setLoading(false);
        return;
      }

      setGiveaway(typedGiveaway);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('giveaway_participants')
        .select('lead_id, leads(id, first_name, last_name, source)')
        .eq('giveaway_id', typedGiveaway.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        setError('Failed to load participants');
        return;
      }

      // Transform the data
      const leads = (participantsData as any[])
        .map((p: any) => p.leads)
        .filter((lead: any) => lead !== null) as Lead[];

      setParticipants(leads);
    } catch (error) {
      console.error('Error fetching giveaway data:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchGiveawayData();
    }
  }, [slug, fetchGiveawayData]);

  const handleWinner = (winnerName: string) => {
    setWinner(winnerName);
  };

  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 font-light">Loading giveaway...</p>
        </div>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-light text-zinc-900 mb-2">Error</h2>
          <p className="text-zinc-600 font-light mb-4">{error || 'Giveaway not found'}</p>
          <Button onClick={() => router.push('/')} className="bg-zinc-900 hover:bg-zinc-800">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="font-serif text-2xl font-light text-zinc-900 mb-2">{giveaway.name}</h2>
          <p className="text-zinc-600 font-light mb-4">No participants have been added to this giveaway yet.</p>
          <Button onClick={() => router.push('/')} className="bg-zinc-900 hover:bg-zinc-800">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen jove-bg-primary overflow-x-hidden">
      {/* Minimal Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-8">
        {/* Back Button */}
        <div className="mb-2 sm:mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-zinc-600 hover:text-zinc-900 font-light tracking-wide text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-2 sm:mb-12">
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light text-zinc-900 tracking-wider mb-2 sm:mb-4 px-2">
            {giveaway.name.toUpperCase()}
          </h1>
          {giveaway.description && (
            <p className="text-zinc-600 font-light text-base sm:text-lg mb-2 sm:mb-4 px-4">{giveaway.description}</p>
          )}
          <div className="w-24 sm:w-32 h-px jove-gradient-accent mx-auto"></div>
        </div>

        {/* Giveaway Spinner */}
        <GiveawaySpinner
          names={participants.map(lead => `${lead.first_name} ${lead.last_name}`)}
          onWinner={handleWinner}
          spinDuration={25000}
          extraTurns={80}
          tailSteps={0}
        />
      </div>
    </div>
  );
}
