'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Images, 
  Palette, 
  Type, 
  Layout,
  Settings,
  ArrowRight
} from 'lucide-react';

const customizationSections = [
  {
    name: 'Pictures',
    description: 'Manage hero carousel images and website photography',
    href: '/admin/website-customization/pictures',
    icon: Images,
    color: 'bg-blue-500',
    features: ['Hero carousel images', 'Product photography', 'Gallery management']
  },
  {
    name: 'Colors & Themes',
    description: 'Customize website colors and visual themes',
    href: '/admin/website-customization/themes',
    icon: Palette,
    color: 'bg-purple-500',
    features: ['Color schemes', 'Brand colors', 'Theme variations']
  },
  {
    name: 'Typography',
    description: 'Manage fonts and text styling across the site',
    href: '/admin/website-customization/typography',
    icon: Type,
    color: 'bg-green-500',
    features: ['Font families', 'Text sizes', 'Heading styles']
  },
  {
    name: 'Layout Settings',
    description: 'Configure page layouts and component positioning',
    href: '/admin/website-customization/layout',
    icon: Layout,
    color: 'bg-orange-500',
    features: ['Section layouts', 'Component spacing', 'Page structure']
  },
];

export default function WebsiteCustomizationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              Website Customization
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Customize your website's appearance, content, and layout to match your brand.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Customization Tools</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Images className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Hero Images</dt>
                  <dd className="text-2xl font-semibold text-gray-900">-</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Palette className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Theme</dt>
                  <dd className="text-lg font-semibold text-gray-900">Default</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Layout className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Layout Version</dt>
                  <dd className="text-lg font-semibold text-gray-900">v1.0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Type className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Font Family</dt>
                  <dd className="text-lg font-semibold text-gray-900">Default</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Sections */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Customization Sections</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a section to customize</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {customizationSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.name}
                  href={section.href}
                  className="group relative jove-bg-card p-6 rounded-lg border border-gray-200 jove-bg-card-hover hover:shadow-md transition-all duration-200"
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
      </div>
    </div>
  );
}
