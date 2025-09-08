export interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  color?: string;
  colorGradient?: string;
  price?: number;
  priceLabGrown?: number | null; // Lab grown option price
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
  blackOnyxBasePrice?: number; // Black onyx base price
  blackOnyxBasePriceLabGrown?: number; // Black onyx lab grown base price
}

export type DiamondType = 'natural' | 'lab_grown';

export interface CustomizationState {
  [settingId: string]: string | string[] | DiamondType | undefined;
  diamondType?: DiamondType; // Add diamond type to customization state
}

export interface CustomizationConfig {
  necklaces: JewelryItem;
  rings: JewelryItem;
  bracelets: JewelryItem;
  earrings: JewelryItem;
}
