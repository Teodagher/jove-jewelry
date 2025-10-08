# Remaining Implementation Guide

This guide provides exact code patterns for completing the Gold/Silver pricing implementation.

## Status Summary

### ✅ COMPLETED
- Database schema & migrations
- TypeScript types
- CustomizationService (all backend methods)
- CustomizationEditor admin interface

### 🔨 REMAINING (Simple Pattern Updates)
- Admin pricing pages (4 files)
- CustomizationComponent frontend

---

## 1. Admin Pricing Pages

Update these 4 files with the same pattern:
- `src/app/admin/pricing/rings/page.tsx`
- `src/app/admin/pricing/necklaces/page.tsx`
- `src/app/admin/pricing/bracelets/page.tsx`
- `src/app/admin/pricing/earrings/page.tsx`

### Pattern to Follow:

#### Step 1: Update the PricingData interface

```typescript
interface PricingData {
  id: string;
  name: string;
  type: string;
  base_price: number;
  base_price_lab_grown?: number;
  base_price_gold?: number;          // ADD THIS
  base_price_silver?: number;        // ADD THIS
  pricing_type?: 'diamond_type' | 'metal_type'; // ADD THIS
  customization_options: Array<{
    id: string;
    setting_id: string;
    setting_title: string;
    option_id: string;
    option_name: string;
    price: number;
    price_lab_grown?: number;
    price_gold?: number;             // ADD THIS
    price_silver?: number;           // ADD THIS
    display_order: number;
  }>;
}
```

#### Step 2: Update state to use dynamic variant type

CHANGE FROM:
```typescript
const [selectedDiamondType, setSelectedDiamondType] = useState<'natural' | 'lab_grown'>('natural');
```

TO:
```typescript
const [selectedVariant, setSelectedVariant] = useState<'natural' | 'lab_grown' | 'gold' | 'silver'>('natural');
```

#### Step 3: Add new update methods for gold/silver

ADD these methods (copy from existing lab_grown methods and modify):

```typescript
const updateBasePriceGold = async (newPrice: number) => {
  try {
    setSaving(true);
    const success = await CustomizationService.updateBasePriceGold('ring', newPrice);

    if (success) {
      setMessage({ type: 'success', text: 'Gold base price updated successfully' });
      fetchPricingData();
    } else {
      setMessage({ type: 'error', text: 'Failed to update gold base price' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Error updating gold base price' });
  } finally {
    setSaving(false);
  }
};

const updateBasePriceSilver = async (newPrice: number) => {
  try {
    setSaving(true);
    const success = await CustomizationService.updateBasePriceSilver('ring', newPrice);

    if (success) {
      setMessage({ type: 'success', text: 'Silver base price updated successfully' });
      fetchPricingData();
    } else {
      setMessage({ type: 'error', text: 'Failed to update silver base price' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Error updating silver base price' });
  } finally {
    setSaving(false);
  }
};

const updateOptionPriceGold = async (settingId: string, optionId: string, newPrice: number) => {
  try {
    setSaving(true);
    const success = await CustomizationService.updateOptionPriceGold('ring', settingId, optionId, newPrice);

    if (success) {
      setMessage({ type: 'success', text: 'Gold option price updated successfully' });
      fetchPricingData();
    } else {
      setMessage({ type: 'error', text: 'Failed to update gold option price' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Error updating gold option price' });
  } finally {
    setSaving(false);
  }
};

const updateOptionPriceSilver = async (settingId: string, optionId: string, newPrice: number) => {
  try {
    setSaving(true);
    const success = await CustomizationService.updateOptionPriceSilver('ring', settingId, optionId, newPrice);

    if (success) {
      setMessage({ type: 'success', text: 'Silver option price updated successfully' });
      fetchPricingData();
    } else {
      setMessage({ type: 'error', text: 'Failed to update silver option price' });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Error updating silver option price' });
  } finally {
    setSaving(false);
  }
};
```

#### Step 4: Replace the toggle section

FIND this section (around line 151-176):
```tsx
{/* Diamond Type Toggle */}
<div className="mt-4 flex items-center space-x-4">
  <span className="text-sm font-medium text-gray-700">Pricing Type:</span>
  <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
    <button
      onClick={() => setSelectedDiamondType('natural')}
      className={...}
    >
      Natural Diamonds
    </button>
    <button
      onClick={() => setSelectedDiamondType('lab_grown')}
      className={...}
    >
      Lab Grown Diamonds
    </button>
  </div>
</div>
```

REPLACE WITH:
```tsx
{/* Pricing Variant Toggle */}
<div className="mt-4 flex items-center space-x-4">
  <span className="text-sm font-medium text-gray-700">Pricing Variant:</span>
  <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
    {pricingData.pricing_type === 'diamond_type' ? (
      <>
        <button
          onClick={() => setSelectedVariant('natural')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedVariant === 'natural'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Natural Diamonds
        </button>
        <button
          onClick={() => setSelectedVariant('lab_grown')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedVariant === 'lab_grown'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lab Grown Diamonds
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => setSelectedVariant('gold')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedVariant === 'gold'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gold
        </button>
        <button
          onClick={() => setSelectedVariant('silver')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedVariant === 'silver'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Silver
        </button>
      </>
    )}
  </div>
</div>
```

#### Step 5: Update the base price section title

CHANGE:
```tsx
<h2 className="text-xl font-semibold text-gray-900 mb-4">
  Base Price - {selectedDiamondType === 'natural' ? 'Natural Diamonds' : 'Lab Grown Diamonds'}
</h2>
```

TO:
```tsx
<h2 className="text-xl font-semibold text-gray-900 mb-4">
  Base Price - {
    pricingData.pricing_type === 'diamond_type'
      ? (selectedVariant === 'natural' ? 'Natural Diamonds' : 'Lab Grown Diamonds')
      : (selectedVariant === 'gold' ? 'Gold' : 'Silver')
  }
</h2>
```

#### Step 6: Update base price input logic

CHANGE the `defaultValue` and `onBlur` logic:

```tsx
<input
  type="number"
  step="0.01"
  key={selectedVariant}
  defaultValue={
    pricingData.pricing_type === 'diamond_type'
      ? (selectedVariant === 'natural' ? pricingData.base_price : (pricingData.base_price_lab_grown || 0))
      : (selectedVariant === 'gold' ? (pricingData.base_price_gold || 0) : (pricingData.base_price_silver || 0))
  }
  className="border border-gray-300 rounded px-3 py-2 w-32"
  onBlur={(e) => {
    const newPrice = parseFloat(e.target.value);
    if (newPrice > 0) {
      if (pricingData.pricing_type === 'diamond_type') {
        if (selectedVariant === 'natural') {
          updateBasePrice(newPrice);
        } else {
          updateBasePriceLabGrown(newPrice);
        }
      } else {
        if (selectedVariant === 'gold') {
          updateBasePriceGold(newPrice);
        } else {
          updateBasePriceSilver(newPrice);
        }
      }
    }
  }}
/>
```

#### Step 7: Update option price inputs similarly

Find the option price inputs (around line 246) and update them with the same pattern as base price.

---

## 2. CustomizationComponent Frontend

**File**: `src/components/CustomizationComponent.tsx`

### Step 1: Add metalType state

ADD after the diamond type state:
```typescript
const [selectedMetalType, setSelectedMetalType] = useState<'gold' | 'silver'>('gold');
```

### Step 2: Find the diamond type toggle UI

FIND (search for "Natural" and "Lab Grown"):
```tsx
{/* Diamond Type Toggle */}
<div className="...">
  <button onClick={() => setSelectedDiamondType('natural')}>
    Natural
  </button>
  <button onClick={() => setSelectedDiamondType('lab_grown')}>
    Lab Grown
  </button>
</div>
```

### Step 3: Make it conditional

REPLACE WITH:
```tsx
{/* Pricing Variant Toggle */}
{jewelryItem.pricingType === 'diamond_type' ? (
  <div className="...">
    <button
      onClick={() => setSelectedDiamondType('natural')}
      className={selectedDiamondType === 'natural' ? 'active-class' : 'inactive-class'}
    >
      Natural
    </button>
    <button
      onClick={() => setSelectedDiamondType('lab_grown')}
      className={selectedDiamondType === 'lab_grown' ? 'active-class' : 'inactive-class'}
    >
      Lab Grown
    </button>
  </div>
) : (
  <div className="...">
    <button
      onClick={() => setSelectedMetalType('gold')}
      className={selectedMetalType === 'gold' ? 'active-class' : 'inactive-class'}
    >
      Gold
    </button>
    <button
      onClick={() => setSelectedMetalType('silver')}
      className={selectedMetalType === 'silver' ? 'active-class' : 'inactive-class'}
    >
      Silver
    </button>
  </div>
)}
```

### Step 4: Update price calculation

FIND where `calculateTotalPrice` is called:
```tsx
const totalPrice = CustomizationService.calculateTotalPrice(
  jewelryItem,
  customizationState,
  selectedDiamondType
);
```

REPLACE WITH:
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

### Step 5: Update cart/checkout data

FIND where items are added to cart:
```tsx
customizationData: {
  ...customizationState,
  diamondType: selectedDiamondType
}
```

UPDATE TO:
```tsx
customizationData: {
  ...customizationState,
  diamondType: jewelryItem.pricingType === 'diamond_type' ? selectedDiamondType : undefined,
  metalType: jewelryItem.pricingType === 'metal_type' ? selectedMetalType : undefined
}
```

---

## Testing Checklist

After implementing the changes:

### Admin Pricing Pages
- [ ] Select a product
- [ ] Change pricing type to "Metal Type" in CustomizationEditor
- [ ] Go to pricing page for that product
- [ ] Verify toggle shows "Gold" / "Silver" instead of "Natural" / "Lab Grown"
- [ ] Update gold price - verify it saves
- [ ] Update silver price - verify it saves
- [ ] Switch back to "Diamond Type"
- [ ] Verify toggle shows "Natural" / "Lab Grown" again

### CustomizationComponent
- [ ] Set a product to "Metal Type" pricing
- [ ] Go to customization page for that product
- [ ] Verify toggle shows "Gold" / "Silver"
- [ ] Select Gold - verify price updates
- [ ] Select Silver - verify price updates
- [ ] Add to cart - verify metalType is stored
- [ ] Repeat for "Diamond Type" product
- [ ] Verify Natural/Lab Grown toggle shows and works

---

## Quick Implementation Estimate

- **Admin Pricing Pages**: ~15 minutes per file (4 files = 1 hour)
  - Most of it is copy/paste with variable name changes
  - Pattern is identical across all 4 files

- **CustomizationComponent**: ~30 minutes
  - Find toggle UI
  - Make it conditional
  - Update price calculation
  - Update cart data

**Total time**: ~1.5 hours of straightforward pattern-following work

---

## Need Help?

All the backend logic is complete and working:
- `CustomizationService.updateBasePriceGold()`
- `CustomizationService.updateBasePriceSilver()`
- `CustomizationService.updateOptionPriceGold()`
- `CustomizationService.updateOptionPriceSilver()`
- `CustomizationService.calculateTotalPrice()` - handles everything automatically

The remaining work is purely UI updates following the patterns above!
