// AI Studio Prompt Templates

import {
  VariantConfig,
  ProductCategory,
  StoneConfig,
  BandConfig,
  STONE_TYPE_LABELS,
  STONE_SHAPE_LABELS,
  METAL_TYPE_LABELS,
  STRAP_COLOR_LABELS,
  CORD_COLOR_LABELS,
  BAND_TYPE_LABELS,
  BACKGROUND_LABELS,
  CATEGORY_LABELS,
} from './types';

// Base style for all generations
const BASE_STYLE = `Ultra-realistic luxury jewelry product photography, soft studio lighting, premium e-commerce aesthetic, photorealistic, commercially usable, high-end jewelry catalog quality`;

// Category-specific context
const CATEGORY_CONTEXT: Record<ProductCategory, string> = {
  bracelet: 'luxury bracelet, elegant wrist jewelry, premium craftsmanship visible',
  ring: 'luxury ring, fine jewelry, exquisite detailing, premium band',
  necklace: 'luxury necklace, elegant pendant and chain, refined jewelry piece',
  earring: 'luxury earrings, fine jewelry craftsmanship, elegant ear adornment',
  pendant: 'luxury pendant, elegant centerpiece, refined chain and setting',
};

// Build stone description
function buildStoneDescription(stone: StoneConfig, label: string): string {
  if (stone.type === 'none') {
    return '';
  }
  
  const stoneTypeName = STONE_TYPE_LABELS[stone.type];
  const stoneShapeName = STONE_SHAPE_LABELS[stone.shape];
  
  return `Change ${label} to a ${stoneShapeName.toLowerCase()}-cut ${stoneTypeName.toLowerCase()} with realistic reflections, light dispersion, and natural brilliance.`;
}

// Build metal description
function buildMetalDescription(metal: VariantConfig['metal']): string {
  const metalName = METAL_TYPE_LABELS[metal];
  
  const metalDescriptions: Record<VariantConfig['metal'], string> = {
    '18k-yellow-gold': 'warm 18 karat yellow gold with polished finish and subtle warm reflections',
    '18k-white-gold': 'bright 18 karat white gold with polished rhodium-plated finish',
    '18k-rose-gold': 'elegant 18 karat rose gold with soft pink-copper tones and polished finish',
    'platinum': 'premium platinum with cool silver-white lustrous finish',
  };
  
  return `Change all metal components to ${metalDescriptions[metal]}.`;
}

// Build band/strap description
function buildBandDescription(band?: BandConfig): string {
  if (!band) return '';
  
  const bandTypeName = BAND_TYPE_LABELS[band.type];
  
  if (band.type === 'leather') {
    const colorName = STRAP_COLOR_LABELS[band.color as keyof typeof STRAP_COLOR_LABELS] || band.color;
    return `Change the strap to a ${colorName.toLowerCase()} premium leather ${bandTypeName.toLowerCase()} with fine grain texture and quality stitching.`;
  }
  
  if (band.type === 'cord') {
    const colorName = CORD_COLOR_LABELS[band.color as keyof typeof CORD_COLOR_LABELS] || band.color;
    return `Change the band to a ${colorName.toLowerCase()} satin cord with elegant knot details.`;
  }
  
  if (band.type === 'chain') {
    return `Replace with an elegant fine chain that matches the metal finish.`;
  }
  
  return '';
}

// Build background description
function buildBackgroundDescription(background: VariantConfig['background']): string {
  const backgrounds: Record<VariantConfig['background'], string> = {
    'white-seamless': 'Place on a pure white seamless background, clean e-commerce style.',
    'transparent': 'Remove background for transparent PNG output.',
    'soft-neutral': 'Place on a soft, warm neutral background with subtle gradient, luxury aesthetic.',
  };
  
  return backgrounds[background];
}

// Build aspect ratio instruction
function buildFormatInstruction(format: VariantConfig['outputFormat']): string {
  const formats: Record<VariantConfig['outputFormat'], string> = {
    '1:1': 'Output as a square 1:1 aspect ratio image.',
    '4:5': 'Output as a portrait 4:5 aspect ratio image.',
    '16:9': 'Output as a landscape 16:9 aspect ratio image.',
  };
  
  return formats[format];
}

/**
 * Build a complete prompt from variant configuration
 */
export function buildPrompt(
  category: ProductCategory,
  config: VariantConfig
): string {
  const parts: string[] = [];
  
  // Start with edit instruction and category context
  const categoryName = CATEGORY_LABELS[category].toLowerCase();
  parts.push(`Edit this luxury ${categoryName} photograph:`);
  
  // Add stone modifications
  const stoneADesc = buildStoneDescription(config.stoneA, 'the primary gemstone');
  if (stoneADesc) parts.push(stoneADesc);
  
  if (config.stoneB) {
    const stoneBDesc = buildStoneDescription(config.stoneB, 'the secondary gemstone');
    if (stoneBDesc) parts.push(stoneBDesc);
  }
  
  // Add metal modification
  parts.push(buildMetalDescription(config.metal));
  
  // Add band modification if applicable
  const bandDesc = buildBandDescription(config.band);
  if (bandDesc) parts.push(bandDesc);
  
  // Add preservation instruction
  parts.push(`Maintain the exact same angle, proportions, lighting direction, and shadows as the original.`);
  
  // Add background
  parts.push(buildBackgroundDescription(config.background));
  
  // Add format
  parts.push(buildFormatInstruction(config.outputFormat));
  
  // Add category-specific context
  parts.push(CATEGORY_CONTEXT[category]);
  
  // Add base style
  parts.push(BASE_STYLE);
  
  return parts.join(' ');
}

/**
 * Generate a human-readable summary of the variant
 */
export function getVariantSummary(config: VariantConfig): string {
  const parts: string[] = [];
  
  if (config.stoneA.type !== 'none') {
    parts.push(`${STONE_SHAPE_LABELS[config.stoneA.shape]} ${STONE_TYPE_LABELS[config.stoneA.type]}`);
  }
  
  if (config.stoneB && config.stoneB.type !== 'none') {
    parts.push(`${STONE_SHAPE_LABELS[config.stoneB.shape]} ${STONE_TYPE_LABELS[config.stoneB.type]}`);
  }
  
  parts.push(METAL_TYPE_LABELS[config.metal]);
  
  if (config.band) {
    if (config.band.type === 'leather') {
      const colorLabel = STRAP_COLOR_LABELS[config.band.color as keyof typeof STRAP_COLOR_LABELS];
      parts.push(`${colorLabel} Leather`);
    } else if (config.band.type === 'cord') {
      const colorLabel = CORD_COLOR_LABELS[config.band.color as keyof typeof CORD_COLOR_LABELS];
      parts.push(`${colorLabel} Cord`);
    } else {
      parts.push('Chain');
    }
  }
  
  return parts.join(' • ');
}

/**
 * Generate a filename-safe variant identifier
 */
export function getVariantFilename(config: VariantConfig): string {
  const parts: string[] = [];
  
  if (config.stoneA.type !== 'none') {
    parts.push(`${config.stoneA.shape}-${config.stoneA.type}`);
  }
  
  if (config.stoneB && config.stoneB.type !== 'none') {
    parts.push(`${config.stoneB.shape}-${config.stoneB.type}`);
  }
  
  parts.push(config.metal);
  
  if (config.band) {
    parts.push(`${config.band.type}-${config.band.color}`);
  }
  
  return parts.join('_');
}
