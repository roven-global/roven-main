# Size Selector Integration Guide

A modern, accessible size/volume selection component for e-commerce websites with dynamic price updates and responsive design.

## Features

- ✅ **Modern Card Design**: Square selectable cards with size labels and unit pricing
- ✅ **Dynamic Price Updates**: Real-time price changes without page reload
- ✅ **Accessibility**: Full keyboard navigation and screen reader support
- ✅ **Responsive**: Works on desktop, tablet, and mobile
- ✅ **Stock Management**: Shows availability and low stock warnings
- ✅ **Event System**: Custom events for integration with other scripts
- ✅ **Fallback Support**: Select dropdown when JavaScript is disabled

## Quick Start

### 1. HTML Structure

```html
<!-- Price Display -->
<div class="price-display">
    <span class="current-price" id="current-price">₹430</span>
    <span class="original-price" id="original-price">₹499</span>
</div>

<!-- Size Selector -->
<div class="size-selector" id="size-selector">
    <div class="size-selector-header">
        <h4>Select Size</h4>
        <span class="stock-info" id="stock-info">12 units available</span>
    </div>
    
    <div class="size-grid" id="size-grid">
        <!-- Size options will be populated by JavaScript -->
    </div>
</div>
```

### 2. CSS Integration

```html
<link rel="stylesheet" href="size-selector.css">
```

### 3. JavaScript Initialization

```html
<script src="size-selector.js"></script>
<script>
    const sizeSelector = new SizeSelector({
        container: '#size-selector',
        priceElement: '#current-price',
        originalPriceElement: '#original-price',
        stockElement: '#stock-info',
        variants: [
            {
                volume: '100ml',
                price: 399,
                originalPrice: 450,
                stock: 10,
                sku: '100ml',
                isActive: true
            },
            {
                volume: '200ml',
                price: 430,
                originalPrice: 499,
                stock: 12,
                sku: '200ml',
                isActive: true
            },
            {
                volume: '300ml',
                price: 599,
                originalPrice: 699,
                stock: 5,
                sku: '300ml',
                isActive: true
            }
        ],
        defaultSku: '200ml'
    });

    // Listen for size changes
    sizeSelector.on('sizeChanged', (variant) => {
        console.log('Size changed to:', variant);
        // Update cart, analytics, etc.
    });
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string | `#size-selector` | CSS selector for the main container |
| `priceElement` | string | `#current-price` | CSS selector for current price display |
| `originalPriceElement` | string | `#original-price` | CSS selector for original price display |
| `stockElement` | string | `#stock-info` | CSS selector for stock information |
| `variants` | array | `[]` | Array of variant objects |
| `defaultSku` | string | `null` | SKU of default selected variant |
| `onSizeChange` | function | `null` | Callback function for size changes |

## Variant Object Structure

```javascript
{
    volume: '200ml',           // Display text for size
    price: 430,               // Current price in rupees
    originalPrice: 499,       // Original price (optional)
    stock: 12,                // Available stock quantity
    sku: '200ml',             // Unique identifier
    isActive: true            // Whether variant is available
}
```

## API Methods

### Event Handling

```javascript
// Listen for size changes
sizeSelector.on('sizeChanged', (variant) => {
    console.log('Selected variant:', variant);
});

// Remove event listener
sizeSelector.off('sizeChanged', callback);

// Trigger custom events
sizeSelector.trigger('customEvent', data);
```

### Public Methods

```javascript
// Get currently selected variant
const selected = sizeSelector.getSelectedVariant();

// Update variants dynamically
sizeSelector.setVariants(newVariants);

// Update specific variant
sizeSelector.updateVariant('200ml', { stock: 8 });

// Clean up
sizeSelector.destroy();
```

## CSS Customization

The component uses CSS custom properties for easy theming:

```css
:root {
    --primary-color: #8B9D94;      /* Main brand color */
    --primary-hover: #6B7A72;      /* Hover state */
    --border-color: #E5E7EB;       /* Default border */
    --border-hover: #8B9D94;       /* Hover border */
    --text-primary: #111827;       /* Primary text */
    --text-secondary: #6B7280;     /* Secondary text */
    --text-muted: #9CA3AF;         /* Muted text */
    --background: #FFFFFF;         /* Card background */
    --background-selected: #F3F4F6; /* Selected state */
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --border-radius: 0.75rem;
    --transition: all 0.2s ease-in-out;
}
```

## Responsive Breakpoints

- **Desktop**: 5 columns (lg:grid-cols-5)
- **Tablet**: 4 columns (md:grid-cols-4)
- **Mobile**: 2 columns (sm:grid-cols-3)
- **Small Mobile**: 1 column (default)

## Accessibility Features

- **Keyboard Navigation**: Tab, Enter, and Space key support
- **Screen Reader**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Semantic HTML**: Button elements with proper roles
- **Fallback**: Select dropdown when JavaScript is disabled

## Test Cases

### 1. Default Selection
```javascript
// Should select the first available variant by default
const sizeSelector = new SizeSelector({
    variants: [
        { volume: '100ml', price: 399, stock: 10, sku: '100ml', isActive: true },
        { volume: '200ml', price: 430, stock: 12, sku: '200ml', isActive: true }
    ]
});
// Expected: 100ml should be selected
```

### 2. Price Updates
```javascript
// Clicking different sizes should update the price display
sizeSelector.selectVariant('200ml');
// Expected: Price should change to ₹430
```

### 3. Keyboard Selection
```javascript
// Tab to a size option and press Enter
// Expected: Size should be selected
```

### 4. Out of Stock Handling
```javascript
// Variants with stock: 0 should be disabled
// Expected: Button should be disabled and show "Out of Stock"
```

### 5. Low Stock Warning
```javascript
// Variants with stock <= 5 should show warning
// Expected: Should display "Only X left"
```

## Integration Examples

### React Integration

```jsx
import { useEffect, useRef } from 'react';

function ProductPage({ variants }) {
    const sizeSelectorRef = useRef(null);
    const sizeSelectorInstance = useRef(null);

    useEffect(() => {
        if (sizeSelectorRef.current && variants.length > 0) {
            sizeSelectorInstance.current = new SizeSelector({
                container: sizeSelectorRef.current,
                variants: variants,
                onSizeChange: (variant) => {
                    // Update React state
                    setSelectedVariant(variant);
                }
            });
        }

        return () => {
            if (sizeSelectorInstance.current) {
                sizeSelectorInstance.current.destroy();
            }
        };
    }, [variants]);

    return (
        <div ref={sizeSelectorRef} className="size-selector">
            <div className="size-selector-header">
                <h4>Select Size</h4>
                <span className="stock-info"></span>
            </div>
            <div className="size-grid"></div>
        </div>
    );
}
```

### jQuery Integration

```javascript
$(document).ready(function() {
    const sizeSelector = new SizeSelector({
        container: '#size-selector',
        variants: productVariants,
        onSizeChange: function(variant) {
            // Update other page elements
            $('#add-to-cart').data('variant', variant.sku);
            $('#product-price').text('₹' + variant.price);
        }
    });
});
```

### Vanilla JS with AJAX

```javascript
// Load variants from API
fetch('/api/product/variants')
    .then(response => response.json())
    .then(variants => {
        const sizeSelector = new SizeSelector({
            container: '#size-selector',
            variants: variants,
            onSizeChange: (variant) => {
                // Update cart or other components
                updateCart(variant);
            }
        });
    });
```

## Troubleshooting

### Common Issues

1. **Elements not found**: Ensure all CSS selectors match your HTML structure
2. **Price not updating**: Check that price element selectors are correct
3. **Events not firing**: Verify event listeners are properly attached
4. **Styling issues**: Ensure CSS file is loaded and custom properties are set

### Debug Mode

```javascript
// Enable debug logging
const sizeSelector = new SizeSelector({
    ...options,
    debug: true
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - Feel free to use in commercial projects.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.

