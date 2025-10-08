export interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  color?: string;
  colorGradient?: string;
  price?: number;
  priceLabGrown?: number | null; // Lab grown option price
  priceGold?: number | null; // Gold option price
  priceSilver?: number | null; // Silver option price
}

export interface CustomizationSetting {
  id: string;
  title: string;
  description?: string;
  type: 'single' | 'multiple';
  options: CustomizationOption[];
  required: boolean;
}

export interface JewelryItem {
  id: string;
  name: string;
  type: string; // Product type (bracelet, ring, necklace, earrings)
  baseImage: string | null;
  settings: CustomizationSetting[];
  basePrice: number;
  basePriceLabGrown?: number; // Lab grown base price
  basePriceGold?: number; // Gold base price
  basePriceSilver?: number; // Silver base price
  blackOnyxBasePrice?: number; // Black onyx base price
  blackOnyxBasePriceLabGrown?: number; // Black onyx lab grown base price
  blackOnyxBasePriceGold?: number; // Black onyx gold base price
  blackOnyxBasePriceSilver?: number; // Black onyx silver base price
  pricingType?: 'diamond_type' | 'metal_type'; // Determines which pricing model is used
}

export type DiamondType = 'natural' | 'lab_grown';
export type MetalType = 'gold' | 'silver';
export type PricingVariant = DiamondType | MetalType;

export interface CustomizationState {
  [settingId: string]: string | string[] | PricingVariant | undefined;
  diamondType?: DiamondType; // Add diamond type to customization state
  metalType?: MetalType; // Add metal type to customization state
}

export interface CustomizationConfig {
  necklaces: JewelryItem;
  rings: JewelryItem;
  bracelets: JewelryItem;
  earrings: JewelryItem;
}
