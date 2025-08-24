'use client';

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { motion, useMotionValueEvent, useMotionValue, useVelocity, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

interface GiveawaySpinnerProps {
  names?: string[];
  onWinner?: (winner: string) => void;
  /** base spin time (before suspense) */
  spinDuration?: number; // ms
  /** full rotations before landing */
  extraTurns?: number;
  /** number of dramatic end "ticks" */
  tailSteps?: number;
  className?: string;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function GiveawaySpinner({
  names = [],
  onWinner,
  spinDuration = 4500,
  extraTurns = 16,
  tailSteps = 6,
  className = "",
}: GiveawaySpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [spinVelocity, setSpinVelocity] = useState(0);

  // Continuous progress in "rows" (0..∞)
  const progress = useMotionValue(0);
  
  // Use Framer Motion's built-in velocity tracking
  const velocity = useVelocity(progress);
  
  // Transform velocity to blur amount
  const motionBlur = useTransform(velocity, [-50, 0, 50], ['blur(3px)', 'blur(0px)', 'blur(3px)']);
  
  // Transform velocity to text shadow for directional blur
  const textShadowBlur = useTransform(
    velocity,
    [-30, 0, 30],
    [
      '0 -2px 4px rgba(0,0,0,0.2), 0 -4px 8px rgba(0,0,0,0.1)',
      'none',
      '0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)'
    ]
  );

  // Force render on progress change so y/opacity/scale recompute
  const [, setTick] = useState(0);
  useMotionValueEvent(progress, "change", () =>
    setTick((t) => (t + 1) & 1023)
  );

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const startProgRef = useRef<number>(0);
  const timeoutsRef = useRef<number[]>([]);

  const ROW_H = 64; // px per row - bigger spacing for larger font

  const startSpin = () => {
    if (isSpinning || names.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    // clear any pending timers from a previous spin
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    const current = progress.get();
    startProgRef.current = current;

    // pick winner & compute how far to go
    const randomWinnerIndex = Math.floor(Math.random() * names.length);
    const baseIndex = Math.floor(current % names.length);
    const forward = (randomWinnerIndex - baseIndex + names.length) % names.length;

    const totalSteps = extraTurns * names.length + forward;

    // Single continuous animation with natural slowdown
    startRef.current = performance.now();
    const totalDuration = spinDuration + 2000; // Extra 2 seconds for final slowdown

    const from = current;
    const to = current + totalSteps;

    let lastProgress = from;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / totalDuration, 1);
      
      // Single smooth ease-out curve for the entire duration
      const eased = easeOutCubic(t);
      const currentProgress = from + eased * (to - from);
      
      // Calculate velocity for motion blur
      const deltaTime = now - lastTime;
      const deltaProgress = currentProgress - lastProgress;
      const velocity = deltaTime > 0 ? Math.abs(deltaProgress / deltaTime) * 1000 : 0;
      setSpinVelocity(velocity);
      
      progress.set(currentProgress);
      
      lastProgress = currentProgress;
      lastTime = now;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Finished spinning
        progress.set(to);
        setSpinVelocity(0);
        const finalIndex = Math.round(progress.get()) % names.length;
        const finalWinner = names[(finalIndex + names.length) % names.length];
        setWinner(finalWinner);
        setIsSpinning(false);
        onWinner?.(finalWinner);
        
        // Trigger confetti animation
        triggerConfetti();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };



  const triggerConfetti = () => {
    // Extended confetti celebration - much longer!
    const duration = 8000; // 8 seconds of confetti!
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#F4E4BC', '#E6D690', '#B8860B', '#DAA520', '#FFD700']
      });
      
      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#F4E4BC', '#E6D690', '#B8860B', '#DAA520', '#FFD700']
      });
      
      // Center burst for extra celebration
      if (timeLeft > duration * 0.7) { // First 30% of time
        confetti({
          ...defaults,
          particleCount: particleCount * 0.5,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#D4AF37', '#F4E4BC', '#E6D690', '#B8860B', '#DAA520', '#FFD700']
        });
      }
    }, 200); // Slightly faster bursts for more intensity
  };

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    setIsSpinning(false);
    setWinner(null);
    setSpinVelocity(0);
    progress.set(Math.floor(progress.get()));
  };

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach((id) => clearTimeout(id));
    },
    []
  );

  // Show empty state if no names
  if (names.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-6 p-8 ${className}`}>
        <div className="relative h-[36rem] w-[28rem] max-w-full mx-auto overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <h3 className="font-serif text-2xl font-light text-zinc-900 mb-4">No Participants</h3>
            <p className="text-zinc-600 font-light">
              Participants will appear here once they register through the launch event form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Derived render values
  const frac = progress.get() - Math.floor(progress.get()); // 0..1 in current cell
  const baseIndex =
    ((Math.floor(progress.get()) % names.length) + names.length) % names.length;

  const positions = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const;
  const opacityFor = (p: number) => Math.max(1 - Math.abs(p - frac) * 0.25, 0.3);
  const scaleFor = (p: number) => {
    const d = Math.abs(p - frac);
    const base = Math.max(1 - d * 0.08, 0.75);
    return winner && d < 0.25 ? base * 1.06 : base;
  };

  return (
    <div className={`flex flex-col items-center gap-8 p-8 ${className}`}>
      {/* Spinner Container */}
      <div className="relative h-[36rem] w-[32rem] max-w-full mx-auto overflow-hidden">
        {/* Jové styled gradient bounds */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-stone-50 z-10" />

        <div className="relative h-full flex items-center justify-center">
          {positions.map((slot) => {
            const idx = (baseIndex + slot + names.length) % names.length;
            const name = names[idx];
            const y = (slot - frac) * ROW_H;
            
            return (
              <motion.div
                key={slot}
                className="absolute w-full text-center will-change-transform"
                animate={{ 
                  y, 
                  opacity: opacityFor(slot), 
                  scale: scaleFor(slot)
                }}
                style={{
                  // True motion blur using Framer Motion's velocity-based blur
                  filter: motionBlur,
                }}
                transition={{ 
                  type: "tween", 
                  duration: 0.02, 
                  ease: "linear" 
                }}
              >
                <motion.span
                  className={`${
                    slot === 0 
                      ? winner 
                        ? "text-amber-700 font-medium" 
                        : "text-zinc-900 font-light"
                      : "text-zinc-400 font-light"
                  } font-serif text-4xl md:text-5xl tracking-wider whitespace-nowrap select-none`}
                  style={{
                    // Add directional motion blur effect
                    textShadow: textShadowBlur,
                  }}
                >
                  {name}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-4 justify-center">
          <Button
            onClick={startSpin}
            disabled={isSpinning || names.length === 0}
            variant="outline"
            className="font-serif font-light tracking-wider px-12 py-4 text-base border-2 border-zinc-900 bg-transparent text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-300 min-h-[56px] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-900"
          >
            {isSpinning ? 'SPINNING...' : 'START GIVEAWAY'}
          </Button>
          
          {(winner || isSpinning) && (
            <Button 
              onClick={reset} 
              variant="outline" 
              disabled={isSpinning}
              className="font-serif font-light tracking-wider px-8 py-4 text-base border-2 border-zinc-900 bg-transparent text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-300 min-h-[56px] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-900"
            >
              RESET
            </Button>
          )}
        </div>
        
        <div className="text-zinc-500 font-light text-sm">
          {names.length} participant{names.length !== 1 ? 's' : ''} in the giveaway
        </div>
      </div>
    </div>
  );
}
