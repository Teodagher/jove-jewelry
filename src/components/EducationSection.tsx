'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, CircleDot, Sparkles, Hammer } from 'lucide-react';

interface EducationTopic {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  content: {
    heading: string;
    paragraphs: string[];
  }[];
}

const educationTopics: EducationTopic[] = [
  {
    id: 'gold',
    icon: CircleDot,
    title: 'Gold & Metals',
    subtitle: 'Understanding precious metals',
    content: [
      {
        heading: '18 Karat Gold',
        paragraphs: [
          'At Maison Jové, we exclusively use 18 karat gold for all our creations. This means 75% pure gold alloyed with other precious metals for durability and colour.',
          '18kt gold offers the perfect balance between purity and strength, ensuring your jewellery maintains its beauty for generations.'
        ]
      },
      {
        heading: 'Gold Colours',
        paragraphs: [
          'Yellow Gold: The classic choice, achieved by alloying pure gold with silver and copper.',
          'White Gold: Created by alloying gold with palladium or nickel, finished with rhodium plating for a brilliant lustre.',
          'Rose Gold: A romantic hue achieved by increasing the copper content in the alloy.'
        ]
      }
    ]
  },
  {
    id: 'gemstones',
    icon: Gem,
    title: 'Gemstones',
    subtitle: 'The art of precious stones',
    content: [
      {
        heading: 'Natural vs Lab-Grown',
        paragraphs: [
          'Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds. The only difference is their origin.',
          'Both options offer exceptional brilliance and durability. Lab-grown diamonds often achieve greater clarity at a more accessible price point.'
        ]
      },
      {
        heading: 'The Four Cs',
        paragraphs: [
          'Cut: The most important factor affecting brilliance. Our stones are cut to exacting standards.',
          'Colour: Graded from D (colourless) to Z. We select only the finest grades for our creations.',
          'Clarity: Refers to inclusions. Our diamonds are carefully selected for exceptional clarity.',
          'Carat: The weight of the stone. We offer a range of sizes to suit every design.'
        ]
      }
    ]
  },
  {
    id: 'craftsmanship',
    icon: Hammer,
    title: 'Craftsmanship',
    subtitle: 'The making of fine jewellery',
    content: [
      {
        heading: 'Handcrafted Excellence',
        paragraphs: [
          'Every Maison Jové piece is crafted by master artisans with decades of experience. Each creation undergoes multiple stages of refinement.',
          'From initial design to final polish, we maintain the highest standards of craftsmanship that have defined our family for over 35 years.'
        ]
      },
      {
        heading: 'Quality Assurance',
        paragraphs: [
          'Each piece is individually inspected before leaving our atelier. We guarantee the quality of every stone setting, every clasp, and every finish.',
          'Our lifetime warranty reflects our confidence in the enduring quality of our work.'
        ]
      }
    ]
  },
  {
    id: 'customisation',
    icon: Sparkles,
    title: 'Customisation',
    subtitle: 'Creating your unique piece',
    content: [
      {
        heading: 'The Bespoke Process',
        paragraphs: [
          'Your journey begins with selecting your preferred design. From there, you choose your metal, gemstones, and any personal touches.',
          'Our online customisation tool allows you to visualise your creation in real-time, seeing exactly how your choices come together.'
        ]
      },
      {
        heading: 'Personal Consultation',
        paragraphs: [
          'For complex requests or special occasions, our team offers personal consultations to guide you through every decision.',
          'Whether you\'re creating an engagement ring or a family heirloom, we ensure your vision is perfectly realised.'
        ]
      }
    ]
  }
];

export default function EducationSection() {
  const [selectedTopic, setSelectedTopic] = useState<EducationTopic | null>(null);

  return (
    <>
      <section id="education" className="py-24 md:py-32 lg:py-40 bg-maison-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              Knowledge
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-maison-black mb-6 tracking-wide">
              Education
            </h2>
            <div className="w-20 h-px bg-maison-gold mx-auto mb-8" />
            <p className="text-maison-graphite text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
              Discover the artistry behind fine jewellery. Learn about precious metals, gemstones, and the craft that brings your vision to life.
            </p>
          </motion.div>

          {/* Topic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {educationTopics.map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedTopic(topic)}
                className="group text-left p-8 bg-maison-ivory border border-maison-warm hover:border-maison-gold transition-all duration-500"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6 border border-maison-warm rounded-full transition-all duration-500 group-hover:border-maison-gold group-hover:bg-maison-gold/5">
                  <topic.icon 
                    size={20} 
                    strokeWidth={1} 
                    className="text-maison-gold" 
                  />
                </div>
                
                {/* Title */}
                <h3 className="font-serif text-xl font-light text-maison-black mb-2 tracking-wide group-hover:text-maison-gold transition-colors duration-300">
                  {topic.title}
                </h3>
                
                {/* Subtitle */}
                <p className="text-maison-graphite/70 text-sm font-light">
                  {topic.subtitle}
                </p>

                {/* Learn more indicator */}
                <div className="mt-6 flex items-center gap-2 text-maison-gold text-sm font-light tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <span>→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Education Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-maison-black/70 backdrop-blur-sm"
              onClick={() => setSelectedTopic(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-maison-ivory overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedTopic(null)}
                className="absolute top-6 right-6 z-10 text-maison-graphite/60 hover:text-maison-black transition-colors duration-300"
              >
                <X size={24} strokeWidth={1} />
              </button>

              {/* Content */}
              <div className="overflow-y-auto max-h-[85vh] p-8 md:p-12">
                {/* Header */}
                <div className="mb-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-6 border border-maison-gold rounded-full bg-maison-gold/5">
                    <selectedTopic.icon 
                      size={24} 
                      strokeWidth={1} 
                      className="text-maison-gold" 
                    />
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-3 tracking-wide">
                    {selectedTopic.title}
                  </h2>
                  <p className="text-maison-graphite text-lg font-light">
                    {selectedTopic.subtitle}
                  </p>
                  <div className="w-16 h-px bg-maison-gold mt-6" />
                </div>

                {/* Content sections */}
                <div className="space-y-10">
                  {selectedTopic.content.map((section, index) => (
                    <div key={index}>
                      <h3 className="font-serif text-xl font-light text-maison-black mb-4 tracking-wide">
                        {section.heading}
                      </h3>
                      <div className="space-y-4">
                        {section.paragraphs.map((paragraph, pIndex) => (
                          <p 
                            key={pIndex}
                            className="text-maison-graphite font-light leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-maison-warm">
                  <p className="text-maison-graphite/60 text-sm font-light text-center">
                    Have questions? <a href="/#contact" className="text-maison-gold hover:underline">Contact our team</a> for personalised guidance.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
