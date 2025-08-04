export interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
  color?: string;
  price?: number;
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
}

export interface CustomizationState {
  [settingId: string]: string | string[];
}

export interface CustomizationConfig {
  necklaces: JewelryItem;
  rings: JewelryItem;
  bracelets: JewelryItem;
  earrings: JewelryItem;
}
