export interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
  color?: string;
  price?: number;
  priceLabGrown?: number; // Lab grown option price
}

export interface CustomizationSetting {
  id: string;
  title: string;
  type: 'single' | 'multiple';
  options: CustomizationOption[];
  required: boolean;
}

export interface JewelryItem {
  id: string;
  name: string;
  baseImage: string;
  settings: CustomizationSetting[];
  basePrice: number;
  basePriceLabGrown?: number; // Lab grown base price
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
