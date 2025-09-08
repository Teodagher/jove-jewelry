# ProductImages Component System

## Overview
The ProductImages component automatically detects all possible variants for a customizable product and creates image upload boxes for each variant. The system includes intelligent compression to WebP format targeting ~100KB while maintaining quality.

## Features

### 🎯 Variant Detection
- Automatically generates all possible combinations from customization options
- Uses the same naming convention as your existing image system
- Supports bracelet-specific filename mapping with chain/metal/stone combinations
- Handles special cases like black onyx + emerald combinations

### 📸 Image Management
- **Smart Compression**: Progressive quality reduction to target 100KB
- **WebP Format**: Automatic conversion to WebP for optimal file sizes
- **Drag & Drop**: Support for dragging images directly onto upload areas
- **Batch Operations**: Upload multiple images efficiently
- **Image Preview**: Full-size modal preview with zoom functionality

### 🎨 User Interface
- **Grid/List Views**: Toggle between visual grid and compact list layouts
- **Search & Filter**: Find specific variants quickly
- **Upload Progress**: Real-time progress indicators during uploads
- **Status Indicators**: Clear visual feedback for existing vs missing images
- **Responsive Design**: Works seamlessly on desktop and mobile

### 📊 Analytics
- **Variant Statistics**: Total variants, existing images, missing images
- **Upload Status**: Track success/failure rates
- **File Size Reporting**: Show compressed file sizes

## File Structure

```
src/
├── components/admin/
│   ├── ProductImages.tsx          # Main component
│   └── README-ProductImages.md    # This documentation
├── services/
│   └── variantGenerator.ts        # Variant generation logic
└── lib/
    └── imageCompression.ts        # Enhanced compression utilities
```

## Integration

The component is integrated as a third tab in the product management edit page:

1. **Basic Information** - Product details
2. **Customization Options** - Settings and options configuration  
3. **Product Images** - Variant image management

## Usage

### For Admins
1. Navigate to Admin → Product Management
2. Click "Edit" on any customizable product
3. Go to the "Product Images" tab
4. The system automatically detects all possible variants
5. Upload images by:
   - Clicking the upload area
   - Dragging and dropping images
   - Using the file picker

### For Developers
```tsx
import ProductImages from '@/components/admin/ProductImages';

<ProductImages
  productId={productId}
  productType={product.type}
  productSlug={product.slug}
/>
```

## Variant Naming Convention

The system follows your existing naming pattern:

### Bracelets
```
bracelet-[chain]-[stone]-[metal].webp
```

Examples:
- `bracelet-black-leather-ruby-whitegold.webp`
- `bracelet-whitegold-chain-bluesapphire-whitegold.webp`
- `bracelet-gold-cord-emerald-yellowgold.webp`

### Other Products
```
[productType]-[option1]-[option2]-[optionN].webp
```

## Storage Structure

Images are stored in Supabase Storage:
```
customization-item/
├── bracelets/
│   ├── bracelet-black-leather-ruby-whitegold.webp
│   ├── bracelet-whitegold-chain-emerald-whitegold.webp
│   └── ...
├── rings/
│   └── ...
└── necklaces/
    └── ...
```

## Compression Algorithm

1. **Start High**: Begin with 95% quality
2. **Progressive Reduction**: Reduce quality based on file size difference
3. **Target 100KB**: Stop when within 10% of target size
4. **Quality Floor**: Never go below 10% quality
5. **Max Attempts**: Stop after 8 compression attempts

## Technical Details

### Dependencies
- `@supabase/supabase-js` - File storage and database
- `lucide-react` - Icons
- Custom toast system for notifications

### Browser Compatibility
- Modern browsers with Canvas API support
- WebP support (fallback to JPEG if needed)
- File API for drag and drop

### Performance
- Lazy loading of variant generation
- Efficient file compression using Canvas API
- Optimized database queries
- Progressive image loading

## Customization

### Adding New Product Types
1. Update `generateVariantFilename()` in `variantGenerator.ts`
2. Add product-specific naming logic
3. Update storage path generation

### Modifying Compression Settings
```tsx
// In imageCompression.ts
export const compressToTargetSize = async (
  file: File,
  targetSizeKB: number = 100, // Adjust target size
  options: CompressionOptions = {}
)
```

### UI Customization
The component uses Tailwind CSS classes and can be styled by modifying the class names in `ProductImages.tsx`.

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check Supabase storage permissions
2. **Large File Sizes**: Adjust compression settings
3. **Variant Generation Errors**: Verify customization options are properly configured
4. **Missing Images**: Ensure proper naming convention

### Debug Mode
Set `console.log` in `variantGenerator.ts` to trace variant generation logic.

## Future Enhancements

- [ ] Bulk image upload from ZIP files
- [ ] AI-powered image optimization
- [ ] Automated image generation for missing variants
- [ ] Integration with external image services
- [ ] Advanced filtering and sorting options
- [ ] Image editing capabilities (crop, rotate, filters)

