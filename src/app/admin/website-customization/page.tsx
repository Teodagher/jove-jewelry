'use client';

import React from 'react';
import Link from 'next/link';
import {
  Images,
  ArrowRight,
  FileText,
  Palette,
  Layout
} from 'lucide-react';

const customizationSections = [
  {
    name: 'Colors',
    description: 'Customize the color scheme of your website',
    href: '/admin/website-customization/colors',
    icon: Palette,
    color: 'bg-purple-500',
    features: ['Brand colors', 'Color presets', 'Live preview']
  },
  {
    name: 'Layout',
    description: 'Edit page structure, sections, and sizing',
    href: '/admin/website-customization/layout',
    icon: Layout,
    color: 'bg-orange-500',
    features: ['Section order', 'Image sizes', 'Spacing & grid']
  },
  {
    name: 'Pictures',
    description: 'Manage hero carousel images and website photography',
    href: '/admin/website-customization/pictures',
    icon: Images,
    color: 'bg-blue-500',
    features: ['Hero carousel images', 'Product photography', 'Gallery management']
  },
  {
    name: 'About Us',
    description: 'Edit the About page text, founder details, and quote',
    href: '/admin/website-customization/about',
    icon: FileText,
    color: 'bg-emerald-500',
    features: ['Founder story', 'Quote & legacy badge', 'Mobile & desktop text']
  },
];

export default function WebsiteCustomizationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
          Website Customization
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your website's images and visual content.
        </p>
      </div>

      {/* Customization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {customizationSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.name}
              href={section.href}
              className="group block jove-bg-card p-6 rounded-lg border border-gray-200 jove-bg-card-hover hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`inline-flex p-3 rounded-lg ${section.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                      {section.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {section.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
