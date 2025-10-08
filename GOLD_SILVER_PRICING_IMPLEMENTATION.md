# Gold/Silver Pricing Implementation

## Overview
This document tracks the implementation of a new pricing dimension (Gold vs Silver) as an alternative to the existing Natural/Lab Grown diamond pricing system.

## Implementation Status

### ✅ Completed

#### 1. Database Schema Updates
- **Migration**: `add_gold_silver_pricing_columns`
- Added `pricing_type` column to `jewelry_items` table
  - Type: `VARCHAR(50)`
  - Values: `'diamond_type'` or `'metal_type'`
  - Default: `'diamond_type'`
- Added gold/silver pricing columns to `jewelry_items`:
  - `base_price_gold`
  - `base_price_silver`
  - `black_onyx_base_price_gold`
  - `black_onyx_base_price_silver`
- Added gold/silver pricing columns to `customization_options`:
  - `price_gold`
  - `price_silver`

#### 2. TypeScript Type Updates
- **File**: `src/types/customization.ts`
  - Added `priceGold` and `priceSilver` to `CustomizationOption` interface
  - Added `basePriceGold`, `basePriceSilver`, `blackOnyxBasePriceGold`, `blackOnyxBasePriceSilver` to `JewelryItem` interface
  - Added `pricingType` field to `JewelryItem` interface
  - Created new types: `MetalType`, `PricingVariant`
  - Updated `CustomizationState` to support `metalType`

- **File**: `src/lib/supabase/types.ts`
  - Updated `JewelryItem` interface with new pricing fields
  - Updated `CustomizationOption` interface with gold/silver price fields

#### 3. CustomizationService Updates
- **File**: `src/services/customizationService.ts`
  - Updated `getJewelryItemConfigBySlug()` to fetch and map all new pricing fields
  - Updated `getJewelryItemConfig()` (legacy method) with new pricing fields
  - Added new service methods:
    - `updateBasePriceGold()`
    - `updateBasePriceSilver()`
    - `updateBlackOnyxBasePriceGold()`
    - `updateBlackOnyxBasePriceSilver()`
    - `updateOptionPriceGold()`
    - `updateOptionPriceSilver()`
    - `updatePricingType()` - to switch between diamond_type and metal_type
  - **Updated `calculateTotalPrice()` method**:
    - Now accepts `PricingVariant` (DiamondType | MetalType) instead of just `DiamondType`
    - Automatically determines pricing type from `jewelryItem.pricingType`
    - Handles both diamond_type (natural/lab_grown) and metal_type (gold/silver) pricing
    - Falls back to base `price` field if variant-specific price is not set

#### 4. Admin Interface - CustomizationEditor ✅
**Files**:
- `src/components/admin/CustomizationEditor.tsx`
- `src/app/admin/product-management/edit/[id]/page.tsx`

**Completed Changes**:
1. ✅ Added pricing type selector with radio buttons:
   - "Diamond Type (Natural / Lab Grown)"
   - "Metal Type (Gold / Silver)"
   - Beautiful UI with blue highlight box

2. ✅ Updated "Add New Option" form to show conditional price fields:
   - If `diamond_type`: Shows "Natural Diamond Price" and "Lab Grown Price"
   - If `metal_type`: Shows "Base Price", "Gold Price", and "Silver Price"

3. ✅ Updated "Edit Option" form with same conditional logic

4. ✅ Database updates include all price fields (`price_gold`, `price_silver`)

5. ✅ Parent component integration:
   - Pricing type is passed from product data
   - Changes are saved immediately to database
   - Proper state management

### ⏳ Pending

#### 5. Admin Pricing Pages
**Files**:
- `src/app/admin/pricing/rings/page.tsx`
- `src/app/admin/pricing/necklaces/page.tsx`
- `src/app/admin/pricing/bracelets/page.tsx`
- `src/app/admin/pricing/earrings/page.tsx`

**Required Changes**:
1. Fetch `pricing_type` from jewelry item
2. Show appropriate toggle based on pricing type:
   - If `diamond_type`: Show "Natural Diamonds" / "Lab Grown Diamonds" toggle
   - If `metal_type`: Show "Gold" / "Silver" toggle
3. Update base price inputs to use correct update methods:
   - Diamond type: `updateBasePrice()` / `updateBasePriceLabGrown()`
   - Metal type: `updateBasePriceGold()` / `updateBasePriceSilver()`
4. Update option price inputs similarly
5. Update black onyx price inputs if applicable

#### 6. CustomizationComponent (Frontend)
**File**: `src/components/CustomizationComponent.tsx`

**Required Changes**:
1. Fetch `pricingType` from `jewelryItem`
2. Replace hardcoded diamond type toggle with dynamic toggle:
   ```tsx
   {jewelryItem.pricingType === 'diamond_type' ? (
     // Show Natural / Lab Grown toggle
     <DiamondTypeToggle />
   ) : (
     // Show Gold / Silver toggle
     <MetalTypeToggle />
   )}
   ```
3. Update state management:
   - If diamond_type: use `selectedDiamondType` state
   - If metal_type: add new `selectedMetalType` state
4. Update price calculations to pass correct variant to `calculateTotalPrice()`:
   ```tsx
   const pricingVariant = jewelryItem.pricingType === 'diamond_type'
     ? selectedDiamondType
     : selectedMetalType;

   const totalPrice = CustomizationService.calculateTotalPrice(
     jewelryItem,
     customizationState,
     pricingVariant
   );
   ```
5. Update cart/checkout to store the selected variant in customization data

## Database Migration Details

The migration has been successfully applied to your Supabase project `ndqxwvascqwhqaoqkpng`.

```sql
-- Migration: add_gold_silver_pricing_columns

-- Add pricing_type to determine which pricing model
ALTER TABLE jewelry_items
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50) DEFAULT 'diamond_type'
CHECK (pricing_type IN ('diamond_type', 'metal_type'));

-- Add gold and silver base prices
ALTER TABLE jewelry_items
ADD COLUMN IF NOT EXISTS base_price_gold NUMERIC,
ADD COLUMN IF NOT EXISTS base_price_silver NUMERIC,
ADD COLUMN IF NOT EXISTS black_onyx_base_price_gold NUMERIC,
ADD COLUMN IF NOT EXISTS black_onyx_base_price_silver NUMERIC;

-- Add gold and silver option prices
ALTER TABLE customization_options
ADD COLUMN IF NOT EXISTS price_gold NUMERIC,
ADD COLUMN IF NOT EXISTS price_silver NUMERIC;
```

## How It Works

### Pricing Type Selection (Admin)
1. Admin goes to product configuration
2. Selects either "Diamond Type" or "Metal Type" pricing model
3. This sets `jewelry_items.pricing_type` to `'diamond_type'` or `'metal_type'`
4. The admin interface adapts to show relevant price fields

### Price Calculation Logic
The `calculateTotalPrice()` method now:
1. Checks `jewelryItem.pricingType` to determine which pricing model is active
2. Uses the appropriate price fields based on the model:
   - **Diamond Type**: Uses `base_price`, `base_price_lab_grown`, `price`, `price_lab_grown`
   - **Metal Type**: Uses `base_price`, `base_price_gold`, `base_price_silver`, `price`, `price_gold`, `price_silver`
3. Falls back to base `price` if variant-specific price is null/undefined

### Frontend Display
The customization component will dynamically show:
- **Diamond Type Products**: "Natural Diamonds" / "Lab Grown Diamonds" toggle
- **Metal Type Products**: "Gold" / "Silver" toggle

## Next Steps

1. **Update CustomizationEditor** - Add pricing type selector and conditional price fields
2. **Update Admin Pricing Pages** - Make toggles dynamic based on pricing type
3. **Update CustomizationComponent** - Add metal type toggle and state management
4. **Test thoroughly** - Verify pricing calculations work correctly for both models
5. **Update cart/order system** - Ensure selected variant is stored correctly

## API Reference

### New Service Methods

```typescript
// Update pricing type for a product
CustomizationService.updatePricingType(
  jewelryType: string,
  pricingType: 'diamond_type' | 'metal_type'
): Promise<boolean>

// Update gold prices
CustomizationService.updateBasePriceGold(jewelryType: string, newPrice: number)
CustomizationService.updateOptionPriceGold(jewelryType: string, settingId: string, optionId: string, newPrice: number)
CustomizationService.updateBlackOnyxBasePriceGold(jewelryType: string, newPrice: number)

// Update silver prices
CustomizationService.updateBasePriceSilver(jewelryType: string, newPrice: number)
CustomizationService.updateOptionPriceSilver(jewelryType: string, settingId: string, optionId: string, newPrice: number)
CustomizationService.updateBlackOnyxBasePriceSilver(jewelryType: string, newPrice: number)

// Updated calculate method
CustomizationService.calculateTotalPrice(
  jewelryItem: JewelryItem,
  customizations: { [key: string]: string },
  pricingVariant: DiamondType | MetalType = 'natural'
): number
```

## Notes

- The system defaults to `'diamond_type'` for existing products
- Both pricing models can coexist - different products can use different models
- Price fields are nullable - if gold/silver prices aren't set, system falls back to base price
- This is a mutually exclusive system - each product uses EITHER diamond type OR metal type pricing, not both
