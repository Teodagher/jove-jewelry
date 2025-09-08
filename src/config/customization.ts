import { CustomizationConfig } from '@/types/customization';

const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public';

export const customizationConfig: CustomizationConfig = {
  necklaces: {
    id: 'necklaces',
    name: 'Necklace',
    type: 'necklace',
    baseImage: `${SUPABASE_URL}/customization-item/necklace.png`,
    basePrice: 299,
    settings: [
      {
        id: 'chain_type',
        title: 'Choose gold chain or leather cord',
        type: 'single',
        required: true,
        options: [
          {
            id: 'gold_chain',
            name: 'Gold Chain',
            image: `${SUPABASE_URL}/necklace-cords/Gold cord.png`,
            price: 0,
          },
          {
            id: 'leather_cord',
            name: 'Leather Cord',
            image: `${SUPABASE_URL}/necklace-cords/Leather cord.png`,
            price: -50,
          }
        ]
      },
      {
        id: 'metal',
        title: 'Choose Metal',
        type: 'single',
        required: true,
        options: [
          {
            id: 'yellow_gold',
            name: '18kt Yellow Gold',
            color: 'linear-gradient(135deg, #F4E4BC 0%, #E6D690 50%, #D4AF37 100%)',
            price: 0,
          },
          {
            id: 'white_gold',
            name: '18kt/18 White Gold',
            color: 'linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 50%, #D3D3D3 100%)',
            price: 25,
          }
        ]
      },
      {
        id: 'first_stone',
        title: 'Choose first stone',
        type: 'single',
        required: true,
        options: [
          {
            id: 'diamond',
            name: 'Diamond',
            image: `${SUPABASE_URL}/gems/diamond.png`,
            price: 200,
          },
          {
            id: 'pink_sapphire',
            name: 'Pink Sapphire',
            image: `${SUPABASE_URL}/gems/pink-sapphire.png`,
            price: 150,
          },
          {
            id: 'ruby',
            name: 'Ruby',
            image: `${SUPABASE_URL}/gems/ruby.png`,
            price: 175,
          },
          {
            id: 'emerald',
            name: 'Emerald',
            image: `${SUPABASE_URL}/gems/emerald.png`,
            price: 160,
          },
          {
            id: 'blue_sapphire',
            name: 'Blue Sapphire',
            image: `${SUPABASE_URL}/gems/blue-sapphire.png`,
            price: 150,
          }
        ]
      },
      {
        id: 'second_stone',
        title: 'Choose second stone',
        type: 'single',
        required: true,
        options: [
          {
            id: 'diamond',
            name: 'Diamond',
            image: `${SUPABASE_URL}/gems/diamond.png`,
            price: 200,
          },
          {
            id: 'pink_sapphire',
            name: 'Pink Sapphire',
            image: `${SUPABASE_URL}/gems/pink-sapphire.png`,
            price: 150,
          },
          {
            id: 'ruby',
            name: 'Ruby',
            image: `${SUPABASE_URL}/gems/ruby.png`,
            price: 175,
          },
          {
            id: 'emerald',
            name: 'Emerald',
            image: `${SUPABASE_URL}/gems/emerald.png`,
            price: 160,
          },
          {
            id: 'blue_sapphire',
            name: 'Blue Sapphire',
            image: `${SUPABASE_URL}/gems/blue-sapphire.png`,
            price: 150,
          }
        ]
      }
    ]
  },
  // Placeholder configurations for other jewelry types
  rings: {
    id: 'rings',
    name: 'Ring',
    type: 'ring',
    baseImage: `${SUPABASE_URL}/item-pictures/ring-preview.jpg`,
    basePrice: 199,
    settings: []
  },
  bracelets: {
    id: 'bracelets',
    name: 'Bracelet',
    type: 'bracelet',
    baseImage: `${SUPABASE_URL}/item-pictures/bracelet-preview.jpg`,
    basePrice: 149,
    settings: []
  },
  earrings: {
    id: 'earrings',
    name: 'Earrings',
    type: 'earring',
    baseImage: `${SUPABASE_URL}/item-pictures/earring-preview.jpg`,
    basePrice: 129,
    settings: []
  }
};
