'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Gem, Heart } from 'lucide-react';

export default function TrustSection() {
  const trustPoints = [
    {
      icon: Shield,
      title: '35+ Years Heritage',
      description: 'Three generations of jewellery expertise passed down through our family.'
    },
    {
      icon: Award,
      title: 'Trusted Partners',
      description: 'Proud collaboration with Pierre Diamonds, Sydney\'s finest diamond specialists.'
    },
    {
      icon: Gem,
      title: 'Certified Quality',
      description: 'Every gemstone authenticated and every piece crafted to exacting standards.'
    },
    {
      icon: Heart,
      title: 'Bespoke Service',
      description: 'Personal consultation for every creation, ensuring your vision comes to life.'
    }
  ];

  return (
    <section className="relative py-24 md:py-32 lg:py-40 bg-maison-ivory overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #b8a06a 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-24"
        >
          <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Our Promise
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-maison-black mb-6 tracking-wide">
            Maison Jové — Trusted Craftsmanship
          </h2>
          <div className="w-20 h-px bg-maison-gold mx-auto mb-8" />
          <p className="text-maison-graphite text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto">
            Maison Jové is built on over 35 years of family jewellery expertise, ensuring exceptional quality, precision, and trust. We proudly collaborate with leading jewellers, including Pierre Diamonds in Sydney, delivering bespoke creations with uncompromising standards.
          </p>
        </motion.div>

        {/* Trust Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group text-center"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 border border-maison-warm rounded-full transition-all duration-500 group-hover:border-maison-gold group-hover:bg-maison-gold/5">
                <point.icon 
                  size={24} 
                  strokeWidth={1} 
                  className="text-maison-gold transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
              
              {/* Title */}
              <h3 className="font-serif text-lg md:text-xl font-light text-maison-black mb-3 tracking-wide">
                {point.title}
              </h3>
              
              {/* Description */}
              <p className="text-maison-graphite/80 text-sm font-light leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom accent */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 md:mt-28 flex items-center justify-center gap-4"
        >
          <div className="h-px w-12 bg-maison-gold/30" />
          <Gem size={16} strokeWidth={1} className="text-maison-gold/50" />
          <div className="h-px w-12 bg-maison-gold/30" />
        </motion.div>
      </div>
    </section>
  );
}
