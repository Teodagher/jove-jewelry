// AI Studio Types

export type StoneType = 
  | 'diamond' 
  | 'ruby' 
  | 'emerald' 
  | 'sapphire' 
  | 'amethyst' 
  | 'topaz' 
  | 'opal' 
  | 'pearl'
  | 'morganite'
  | 'aquamarine'
  | 'tanzanite'
  | 'citrine'
  | 'garnet'
  | 'peridot'
  | 'none';

export type StoneShape = 
  | 'pear' 
  | 'oval' 
  | 'round' 
  | 'heart' 
  | 'cushion' 
  | 'marquise'
  | 'princess'
  | 'emerald-cut'
  | 'radiant'
  | 'asscher';

export type MetalType = 
  | '18k-yellow-gold' 
  | '18k-white-gold' 
  | '18k-rose-gold' 
  | 'platinum';

export type StrapColor = 
  | 'red' 
  | 'black' 
  | 'beige' 
  | 'brown' 
  | 'navy'
  | 'burgundy'
  | 'forest-green'
  | 'white'
  | 'tan';

export type CordColor = 
  | 'black' 
  | 'red' 
  | 'white' 
  | 'navy' 
  | 'brown'
  | 'gold'
  | 'silver';

export type BandType = 
  | 'leather' 
  | 'cord' 
  | 'chain';

export type BackgroundType = 
  | 'white-seamless' 
  | 'transparent' 
  | 'soft-neutral';

export type OutputFormat = 
  | '1:1' 
  | '4:5' 
  | '16:9';

export type ProductCategory = 
  | 'bracelet' 
  | 'ring' 
  | 'necklace' 
  | 'earring' 
  | 'pendant';

export interface StoneConfig {
  type: StoneType;
  shape: StoneShape;
}

export interface BandConfig {
  type: BandType;
  color: StrapColor | CordColor;
}

export interface VariantConfig {
  stoneA: StoneConfig;
  stoneB?: StoneConfig;
  metal: MetalType;
  band?: BandConfig;
  background: BackgroundType;
  outputFormat: OutputFormat;
}

export interface GenerationRequest {
  productName: string;
  category: ProductCategory;
  originalImageBase64: string;
  variantConfig: VariantConfig;
}

export interface BatchGenerationRequest {
  productName: string;
  category: ProductCategory;
  originalImageBase64: string;
  variants: VariantConfig[];
}

export interface GenerationResult {
  id: string;
  productName: string;
  category: ProductCategory;
  originalImageUrl: string;
  generatedImageUrl?: string;
  generatedImageBase64?: string;
  variantConfig: VariantConfig;
  promptUsed: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'approved' | 'rejected';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIStudioVariant {
  id: string;
  product_name: string;
  category: ProductCategory;
  original_image_url: string;
  generated_image_url?: string;
  variant_config: VariantConfig;
  prompt_used?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Display labels for UI
export const STONE_TYPE_LABELS: Record<StoneType, string> = {
  'diamond': 'Diamond',
  'ruby': 'Ruby',
  'emerald': 'Emerald',
  'sapphire': 'Sapphire',
  'amethyst': 'Amethyst',
  'topaz': 'Topaz',
  'opal': 'Opal',
  'pearl': 'Pearl',
  'morganite': 'Morganite',
  'aquamarine': 'Aquamarine',
  'tanzanite': 'Tanzanite',
  'citrine': 'Citrine',
  'garnet': 'Garnet',
  'peridot': 'Peridot',
  'none': 'No Stone',
};

export const STONE_SHAPE_LABELS: Record<StoneShape, string> = {
  'pear': 'Pear',
  'oval': 'Oval',
  'round': 'Round Brilliant',
  'heart': 'Heart',
  'cushion': 'Cushion',
  'marquise': 'Marquise',
  'princess': 'Princess',
  'emerald-cut': 'Emerald Cut',
  'radiant': 'Radiant',
  'asscher': 'Asscher',
};

export const METAL_TYPE_LABELS: Record<MetalType, string> = {
  '18k-yellow-gold': '18K Yellow Gold',
  '18k-white-gold': '18K White Gold',
  '18k-rose-gold': '18K Rose Gold',
  'platinum': 'Platinum',
};

export const STRAP_COLOR_LABELS: Record<StrapColor, string> = {
  'red': 'Red',
  'black': 'Black',
  'beige': 'Beige',
  'brown': 'Brown',
  'navy': 'Navy',
  'burgundy': 'Burgundy',
  'forest-green': 'Forest Green',
  'white': 'White',
  'tan': 'Tan',
};

export const CORD_COLOR_LABELS: Record<CordColor, string> = {
  'black': 'Black',
  'red': 'Red',
  'white': 'White',
  'navy': 'Navy',
  'brown': 'Brown',
  'gold': 'Gold',
  'silver': 'Silver',
};

export const BAND_TYPE_LABELS: Record<BandType, string> = {
  'leather': 'Leather Strap',
  'cord': 'Cord',
  'chain': 'Chain',
};

export const BACKGROUND_LABELS: Record<BackgroundType, string> = {
  'white-seamless': 'White Seamless',
  'transparent': 'Transparent PNG',
  'soft-neutral': 'Soft Luxury Neutral',
};

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  '1:1': 'Square (1:1)',
  '4:5': 'Portrait (4:5)',
  '16:9': 'Landscape (16:9)',
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'bracelet': 'Bracelet',
  'ring': 'Ring',
  'necklace': 'Necklace',
  'earring': 'Earring',
  'pendant': 'Pendant',
};
