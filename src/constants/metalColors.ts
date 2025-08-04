// Reusable metal color gradients for all jewelry types
export const METAL_GRADIENTS = {
  yellow_gold: 'linear-gradient(135deg, #F4E4BC 0%, #E6D690 50%, #D4AF37 100%)',
  white_gold: 'linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 50%, #D3D3D3 100%)',
} as const;

// Metal option configurations for reuse across jewelry types
export const METAL_OPTIONS = [
  {
    id: 'white_gold',
    name: '18kt/18 White Gold',
    gradient: METAL_GRADIENTS.white_gold,
    price: 0.00
  },
  {
    id: 'yellow_gold', 
    name: '18kt Yellow Gold',
    gradient: METAL_GRADIENTS.yellow_gold,
    price: 0.00
  }
] as const;

export type MetalType = keyof typeof METAL_GRADIENTS;
