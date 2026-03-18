'use client';

import React from 'react';
import {
  VariantConfig,
  ProductCategory,
  StoneType,
  StoneShape,
  MetalType,
  BandType,
  StrapColor,
  CordColor,
  BackgroundType,
  OutputFormat,
  STONE_TYPE_LABELS,
  STONE_SHAPE_LABELS,
  METAL_TYPE_LABELS,
  BAND_TYPE_LABELS,
  STRAP_COLOR_LABELS,
  CORD_COLOR_LABELS,
  BACKGROUND_LABELS,
  OUTPUT_FORMAT_LABELS,
  CATEGORY_LABELS,
} from '@/lib/ai-studio/types';
import { Gem, Palette, CircleDot, Square, Image } from 'lucide-react';

interface VariantControlsProps {
  category: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  config: VariantConfig;
  onChange: (config: VariantConfig) => void;
}

const stoneTypes = Object.keys(STONE_TYPE_LABELS) as StoneType[];
const stoneShapes = Object.keys(STONE_SHAPE_LABELS) as StoneShape[];
const metalTypes = Object.keys(METAL_TYPE_LABELS) as MetalType[];
const bandTypes = Object.keys(BAND_TYPE_LABELS) as BandType[];
const strapColors = Object.keys(STRAP_COLOR_LABELS) as StrapColor[];
const cordColors = Object.keys(CORD_COLOR_LABELS) as CordColor[];
const backgroundTypes = Object.keys(BACKGROUND_LABELS) as BackgroundType[];
const outputFormats = Object.keys(OUTPUT_FORMAT_LABELS) as OutputFormat[];
const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export default function VariantControls({
  category,
  onCategoryChange,
  config,
  onChange,
}: VariantControlsProps) {
  
  const showBandOptions = category === 'bracelet' || category === 'necklace';
  const showSecondStone = category !== 'pendant';

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-600" />
          Product Category
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`
                px-3 py-2 text-sm rounded-lg font-medium transition-all
                ${category === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }
              `}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Stone A */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-600" />
          Primary Stone
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Stone Type</label>
            <select
              value={config.stoneA.type}
              onChange={(e) => onChange({
                ...config,
                stoneA: { ...config.stoneA, type: e.target.value as StoneType }
              })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {stoneTypes.map((type) => (
                <option key={type} value={type}>{STONE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          {config.stoneA.type !== 'none' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Stone Shape</label>
              <select
                value={config.stoneA.shape}
                onChange={(e) => onChange({
                  ...config,
                  stoneA: { ...config.stoneA, shape: e.target.value as StoneShape }
                })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {stoneShapes.map((shape) => (
                  <option key={shape} value={shape}>{STONE_SHAPE_LABELS[shape]}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stone B (conditional) */}
      {showSecondStone && (
        <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Gem className="w-4 h-4 text-purple-600" />
            Secondary Stone
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Stone Type</label>
              <select
                value={config.stoneB?.type || 'none'}
                onChange={(e) => {
                  const type = e.target.value as StoneType;
                  if (type === 'none') {
                    onChange({ ...config, stoneB: undefined });
                  } else {
                    onChange({
                      ...config,
                      stoneB: { type, shape: config.stoneB?.shape || 'round' }
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {stoneTypes.map((type) => (
                  <option key={type} value={type}>{STONE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            {config.stoneB && config.stoneB.type !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Stone Shape</label>
                <select
                  value={config.stoneB.shape}
                  onChange={(e) => onChange({
                    ...config,
                    stoneB: config.stoneB ? { ...config.stoneB, shape: e.target.value as StoneShape } : undefined
                  })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {stoneShapes.map((shape) => (
                    <option key={shape} value={shape}>{STONE_SHAPE_LABELS[shape]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metal */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-amber-600" />
          Metal
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {metalTypes.map((metal) => (
            <button
              key={metal}
              onClick={() => onChange({ ...config, metal })}
              className={`
                px-3 py-2.5 text-sm rounded-lg font-medium transition-all text-left
                ${config.metal === metal
                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }
              `}
            >
              {METAL_TYPE_LABELS[metal]}
            </button>
          ))}
        </div>
      </div>

      {/* Band/Strap (conditional) */}
      {showBandOptions && (
        <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-600" />
            Band / Strap
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Band Type</label>
              <div className="grid grid-cols-3 gap-2">
                {bandTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const defaultColor = type === 'leather' ? 'black' : type === 'cord' ? 'black' : 'black';
                      onChange({
                        ...config,
                        band: type === 'chain' 
                          ? { type, color: 'black' as StrapColor }
                          : { type, color: config.band?.color || defaultColor }
                      });
                    }}
                    className={`
                      px-3 py-2 text-sm rounded-lg font-medium transition-all
                      ${config.band?.type === type
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }
                    `}
                  >
                    {BAND_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
            
            {config.band && config.band.type === 'leather' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Leather Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {strapColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onChange({
                        ...config,
                        band: { type: 'leather', color }
                      })}
                      className={`
                        px-3 py-2 text-sm rounded-lg font-medium transition-all
                        ${config.band?.color === color
                          ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        }
                      `}
                    >
                      {STRAP_COLOR_LABELS[color]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {config.band && config.band.type === 'cord' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Cord Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {cordColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onChange({
                        ...config,
                        band: { type: 'cord', color }
                      })}
                      className={`
                        px-3 py-2 text-sm rounded-lg font-medium transition-all
                        ${config.band?.color === color
                          ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        }
                      `}
                    >
                      {CORD_COLOR_LABELS[color]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Square className="w-4 h-4 text-amber-600" />
          Background
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {backgroundTypes.map((bg) => (
            <button
              key={bg}
              onClick={() => onChange({ ...config, background: bg })}
              className={`
                px-4 py-3 text-sm rounded-lg font-medium transition-all text-left
                ${config.background === bg
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }
              `}
            >
              {BACKGROUND_LABELS[bg]}
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Image className="w-4 h-4 text-amber-600" />
          Output Format
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {outputFormats.map((format) => (
            <button
              key={format}
              onClick={() => onChange({ ...config, outputFormat: format })}
              className={`
                px-3 py-2 text-sm rounded-lg font-medium transition-all
                ${config.outputFormat === format
                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }
              `}
            >
              {OUTPUT_FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
