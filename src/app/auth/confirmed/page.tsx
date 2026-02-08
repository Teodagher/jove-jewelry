'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center jove-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-md w-full text-center"
      >
        <div className="mx-auto h-12 w-auto text-center mb-8">
          <h1 className="text-3xl font-serif font-light text-zinc-900 tracking-wider">MAISON JOVE</h1>
          <div className="maison-gold-line mx-auto my-4" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-maison-gold/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <svg className="w-10 h-10 text-maison-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h2 className="font-serif text-2xl md:text-3xl font-light text-maison-charcoal tracking-wider mb-4">
          Account Confirmed
        </h2>
        <p className="text-maison-graphite font-light leading-relaxed mb-10">
          Your email has been verified and your account is now active. Welcome to Maison Jove.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-black hover:bg-zinc-800 text-white py-3 px-6 text-xs font-light tracking-[0.15em] uppercase transition-all duration-500 text-center"
          >
            Start Shopping
          </Link>
          <Link
            href="/account/profile"
            className="block w-full border border-maison-graphite/30 hover:border-maison-graphite/60 text-maison-graphite py-3 px-6 text-xs font-light tracking-[0.15em] uppercase transition-all duration-300 text-center"
          >
            Complete Your Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
