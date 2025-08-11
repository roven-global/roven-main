/**
 * Size Selector - Vanilla JavaScript Implementation
 * A modern, accessible size/volume selection component for e-commerce
 */

class SizeSelector {
    constructor(options) {
        this.options = {
            container: '#size-selector',
            priceElement: '#current-price',
            originalPriceElement: '#original-price',
            stockElement: '#stock-info',
            variants: [],
            defaultSku: null,
            onSizeChange: null,
            ...options
        };

        this.container = document.querySelector(this.options.container);
        this.priceElement = document.querySelector(this.options.priceElement);
        this.originalPriceElement = document.querySelector(this.options.originalPriceElement);
        this.stockElement = document.querySelector(this.options.stockElement);
        this.gridElement = this.container?.querySelector('.size-grid');

        this.selectedVariant = null;
        this.eventListeners = {};

        this.init();
    }

    init() {
        if (!this.container || !this.gridElement) {
            console.error('SizeSelector: Required elements not found');
            return;
        }

        this.render();
        this.setDefaultSelection();
        this.bindEvents();
    }

    render() {
        if (!this.gridElement) return;

        this.gridElement.innerHTML = this.options.variants.map(variant => {
            const isDisabled = variant.stock === 0 || !variant.isActive;
            const unitPrice = this.calculateUnitPrice(variant.price, variant.volume);

            return `
                <button
                    class="size-option"
                    data-sku="${variant.sku}"
                    data-size="${variant.volume}"
                    data-price="${variant.price}"
                    data-original-price="${variant.originalPrice || ''}"
                    data-stock="${variant.stock}"
                    data-unit-price="${unitPrice}"
                    ${isDisabled ? 'disabled' : ''}
                    role="radio"
                    aria-checked="false"
                    aria-label="Select ${variant.volume} size"
                    tabindex="${isDisabled ? '-1' : '0'}"
                >
                    <div class="size-label">${variant.volume}</div>
                    <div class="price-info">
                        <div class="price-main">₹${variant.price}</div>
                        ${unitPrice > 0 ? `<div class="price-unit">(₹${unitPrice} / 100ml)</div>` : ''}
                        ${variant.originalPrice && variant.originalPrice > variant.price ?
                    `<div class="price-original">₹${variant.originalPrice}</div>` : ''}
                    </div>
                    ${variant.stock === 0 ?
                    '<div class="stock-status out-of-stock">Out of Stock</div>' :
                    variant.stock <= 5 ?
                        `<div class="stock-status low-stock">Only ${variant.stock} left</div>` : ''
                }
                </button>
            `;
        }).join('');
    }

    setDefaultSelection() {
        const defaultSku = this.options.defaultSku ||
            this.options.variants.find(v => v.stock > 0 && v.isActive)?.sku ||
            this.options.variants[0]?.sku;

        if (defaultSku) {
            this.selectVariant(defaultSku);
        }
    }

    bindEvents() {
        if (!this.gridElement) return;

        // Click events
        this.gridElement.addEventListener('click', (e) => {
            const button = e.target.closest('.size-option');
            if (button && !button.disabled) {
                this.selectVariant(button.dataset.sku);
            }
        });

        // Keyboard events
        this.gridElement.addEventListener('keydown', (e) => {
            const button = e.target.closest('.size-option');
            if (button && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                if (!button.disabled) {
                    this.selectVariant(button.dataset.sku);
                }
            }
        });

        // Focus management
        this.gridElement.addEventListener('focusin', (e) => {
            const button = e.target.closest('.size-option');
            if (button) {
                button.setAttribute('tabindex', '0');
            }
        });
    }

    selectVariant(sku) {
        const variant = this.options.variants.find(v => v.sku === sku);
        if (!variant || variant.stock === 0 || !variant.isActive) return;

        // Update selected state
        this.selectedVariant = variant;

        // Update UI
        this.updateSelectionUI();
        this.updatePriceDisplay();
        this.updateStockDisplay();

        // Trigger events
        this.trigger('sizeChanged', variant);

        if (this.options.onSizeChange) {
            this.options.onSizeChange(variant);
        }
    }

    updateSelectionUI() {
        const buttons = this.gridElement.querySelectorAll('.size-option');

        buttons.forEach(button => {
            const isSelected = button.dataset.sku === this.selectedVariant?.sku;

            button.classList.toggle('selected', isSelected);
            button.setAttribute('aria-checked', isSelected.toString());

            // Update selection indicator
            let indicator = button.querySelector('.selection-indicator');
            if (isSelected && !indicator) {
                indicator = document.createElement('div');
                indicator.className = 'selection-indicator';
                indicator.innerHTML = '✓';
                button.appendChild(indicator);
            } else if (!isSelected && indicator) {
                indicator.remove();
            }
        });
    }

    updatePriceDisplay() {
        if (!this.selectedVariant) return;

        if (this.priceElement) {
            this.priceElement.textContent = `₹${this.selectedVariant.price}`;
        }

        if (this.originalPriceElement) {
            if (this.selectedVariant.originalPrice && this.selectedVariant.originalPrice > this.selectedVariant.price) {
                this.originalPriceElement.textContent = `₹${this.selectedVariant.originalPrice}`;
                this.originalPriceElement.style.display = 'inline';
            } else {
                this.originalPriceElement.style.display = 'none';
            }
        }
    }

    updateStockDisplay() {
        if (!this.selectedVariant || !this.stockElement) return;

        if (this.selectedVariant.stock === 0) {
            this.stockElement.textContent = 'Out of Stock';
            this.stockElement.style.color = '#EF4444';
        } else if (this.selectedVariant.stock <= 5) {
            this.stockElement.textContent = `Only ${this.selectedVariant.stock} units available`;
            this.stockElement.style.color = '#F59E0B';
        } else {
            this.stockElement.textContent = `${this.selectedVariant.stock} units available`;
            this.stockElement.style.color = '';
        }
    }

    calculateUnitPrice(price, volume) {
        const volumeNumber = parseInt(volume.replace(/\D/g, ''));
        if (volumeNumber > 0) {
            return Math.round((price / volumeNumber) * 100);
        }
        return 0;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    trigger(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('SizeSelector event error:', error);
                }
            });
        }
    }

    // Public API methods
    getSelectedVariant() {
        return this.selectedVariant;
    }

    setVariants(variants) {
        this.options.variants = variants;
        this.render();
        this.setDefaultSelection();
    }

    updateVariant(sku, updates) {
        const index = this.options.variants.findIndex(v => v.sku === sku);
        if (index !== -1) {
            this.options.variants[index] = { ...this.options.variants[index], ...updates };
            this.render();

            // If this was the selected variant, update the display
            if (this.selectedVariant?.sku === sku) {
                this.selectedVariant = this.options.variants[index];
                this.updatePriceDisplay();
                this.updateStockDisplay();
            }
        }
    }

    destroy() {
        if (this.gridElement) {
            this.gridElement.innerHTML = '';
        }
        this.eventListeners = {};
    }
}

// Utility function for currency formatting
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SizeSelector;
} else if (typeof window !== 'undefined') {
    window.SizeSelector = SizeSelector;
}

