import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";

interface GuestWishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
}

interface GuestCartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    variant?: {
        volume: string;
        sku: string;
    };
}

interface GuestContextType {
    guestWishlist: GuestWishlistItem[];
    guestCart: GuestCartItem[];
    addToGuestWishlist: (item: GuestWishlistItem) => void;
    removeFromGuestWishlist: (id: string) => void;
    addToGuestCart: (item: GuestCartItem) => void;
    removeFromGuestCart: (id: string, variant?: { volume: string; sku: string }) => void;
    updateGuestCartQuantity: (id: string, quantity: number, variant?: { volume: string; sku: string }) => void;
    clearGuestData: () => void;
    guestCartCount: number;
    isInGuestWishlist: (id: string) => boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const useGuest = () => {
    const context = useContext(GuestContext);
    if (!context) {
        throw new Error('useGuest must be used within a GuestProvider');
    }
    return context;
};

export const GuestProvider = ({ children }: { children: ReactNode }) => {
    const [guestWishlist, setGuestWishlist] = useState<GuestWishlistItem[]>([]);
    const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);

    // Load guest data from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('shimmer_guest_wishlist');
        const savedCart = localStorage.getItem('shimmer_guest_cart');

        if (savedWishlist) {
            try {
                setGuestWishlist(JSON.parse(savedWishlist));
            } catch (error) {
                console.error('Error parsing guest wishlist:', error);
                localStorage.removeItem('shimmer_guest_wishlist');
            }
        }

        if (savedCart) {
            try {
                setGuestCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error parsing guest cart:', error);
                localStorage.removeItem('shimmer_guest_cart');
            }
        }
    }, []);

    // Save guest data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('shimmer_guest_wishlist', JSON.stringify(guestWishlist));
    }, [guestWishlist]);

    useEffect(() => {
        localStorage.setItem('shimmer_guest_cart', JSON.stringify(guestCart));
    }, [guestCart]);

    const addToGuestWishlist = (item: GuestWishlistItem) => {
        setGuestWishlist(prev => {
            const exists = prev.find(wishlistItem => wishlistItem.id === item.id);
            if (exists) {
                toast({
                    title: "Already in wishlist",
                    description: "This item is already in your wishlist.",
                });
                return prev;
            }
            const newWishlist = [...prev, item];
            toast({
                title: "Added to wishlist",
                description: `${item.name} has been added to your wishlist.`,
            });
            return newWishlist;
        });
    };

    const removeFromGuestWishlist = (id: string) => {
        setGuestWishlist(prev => {
            const item = prev.find(wishlistItem => wishlistItem.id === id);
            const newWishlist = prev.filter(wishlistItem => wishlistItem.id !== id);
            if (item) {
                toast({
                    title: "Removed from wishlist",
                    description: `${item.name} has been removed from your wishlist.`,
                });
            }
            return newWishlist;
        });
    };

    const addToGuestCart = (item: GuestCartItem) => {
        setGuestCart(prev => {
            // Check for existing item with same ID and variant
            const existingItem = prev.find(cartItem =>
                cartItem.id === item.id &&
                JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
            );

            if (existingItem) {
                const newCart = prev.map(cartItem =>
                    cartItem.id === item.id && JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
                        ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                        : cartItem
                );
                toast({
                    title: "Cart updated",
                    description: `${item.name} quantity updated in your cart.`,
                });
                return newCart;
            } else {
                const newCart = [...prev, item];
                toast({
                    title: "Added to cart",
                    description: `${item.name} has been added to your cart.`,
                });
                return newCart;
            }
        });
    };

    const removeFromGuestCart = (id: string, variant?: { volume: string; sku: string }) => {
        setGuestCart(prev => {
            const item = prev.find(cartItem =>
                cartItem.id === id &&
                JSON.stringify(cartItem.variant) === JSON.stringify(variant)
            );
            const newCart = prev.filter(cartItem =>
                !(cartItem.id === id && JSON.stringify(cartItem.variant) === JSON.stringify(variant))
            );
            if (item) {
                toast({
                    title: "Removed from cart",
                    description: `${item.name} has been removed from your cart.`,
                });
            }
            return newCart;
        });
    };

    const updateGuestCartQuantity = (id: string, quantity: number, variant?: { volume: string; sku: string }) => {
        if (quantity < 1) {
            removeFromGuestCart(id, variant);
            return;
        }

        console.log('GuestContext: Updating guest cart quantity:', { id, quantity, variant });

        setGuestCart(prev => {
            const newCart = prev.map(cartItem =>
                cartItem.id === id && JSON.stringify(cartItem.variant) === JSON.stringify(variant)
                    ? { ...cartItem, quantity }
                    : cartItem
            );

            console.log('GuestContext: Guest cart updated:', {
                oldCount: prev.length,
                newCount: newCart.length,
                updatedItem: newCart.find(item => item.id === id)
            });

            return newCart;
        });
    };

    const clearGuestData = () => {
        setGuestWishlist([]);
        setGuestCart([]);
        localStorage.removeItem('shimmer_guest_wishlist');
        localStorage.removeItem('shimmer_guest_cart');
    };

    const isInGuestWishlist = (id: string) => {
        return guestWishlist.some(item => item.id === id);
    };

    const guestCartCount = guestCart.reduce((acc, item) => acc + item.quantity, 0);

    // Function to validate all applied offers when guest cart changes
    const validateAllOffers = useCallback(() => {
        console.log('GuestContext: Validating all offers with cart changes');

        // Check localStorage for applied offers
        const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
        if (!hasClaimedReward) return;

        const storedReward = localStorage.getItem('claimedRewardDetails');
        if (!storedReward) return;

        try {
            const parsedReward = JSON.parse(storedReward);
            const rewardText = (parsedReward.reward || parsedReward.rewardText || '').toLowerCase();
            const rewardTitle = (parsedReward.title || parsedReward.rewardTitle || '').toLowerCase();

            // Check if it's a BOGO offer
            if (rewardText.includes('bogo') || rewardText.includes('buy one get one')) {
                const totalItems = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

                if (totalItems < 2) {
                    console.log('GuestContext: BOGO validation failed - insufficient items:', totalItems);
                    // Instead of removing, mark as invalid but keep the offer
                    const updatedReward = {
                        ...parsedReward,
                        isValid: false,
                        validationMessage: 'BOGO offer requires at least 2 items in cart',
                        currentItems: totalItems,
                        requiredItems: 2
                    };
                    localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));
                    return;
                } else {
                    // If BOGO conditions are met, mark as valid and recalculate
                    console.log('GuestContext: BOGO validation passed - recalculating discount');
                    const updatedReward = {
                        ...parsedReward,
                        isValid: true,
                        validationMessage: undefined,
                        currentItems: totalItems,
                        requiredItems: undefined
                    };
                    localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));

                    // Recalculate BOGO discount with current cart
                    recalculateBOGODiscount();
                }
            }

            // Check minimum order amount for other types
            if (parsedReward.minOrderAmount) {
                const subtotal = guestCart.reduce((acc, item) => {
                    const price = item.price || 0;
                    return acc + (price * (item.quantity || 1));
                }, 0);

                if (subtotal < parsedReward.minOrderAmount) {
                    console.log('GuestContext: Welcome gift validation failed - insufficient order amount');
                    // Instead of removing, mark as invalid but keep the offer
                    const updatedReward = {
                        ...parsedReward,
                        isValid: false,
                        validationMessage: `Minimum order amount of ₹${parsedReward.minOrderAmount} required`,
                        currentSubtotal: subtotal,
                        requiredAmount: parsedReward.minOrderAmount
                    };
                    localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));
                    return;
                } else {
                    // If minimum order amount is met, mark as valid and recalculate
                    console.log('GuestContext: Welcome gift validation passed - recalculating discount');
                    const updatedReward = {
                        ...parsedReward,
                        isValid: true,
                        validationMessage: undefined,
                        currentSubtotal: subtotal,
                        requiredAmount: undefined
                    };
                    localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));

                    // Recalculate welcome gift discount with current cart
                    recalculateWelcomeGiftDiscount();
                }
            } else {
                // If no minimum order amount requirement, mark as valid
                const updatedReward = {
                    ...parsedReward,
                    isValid: true,
                    validationMessage: undefined
                };
                localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));
            }

            console.log('GuestContext: Welcome gift validation passed');
        } catch (error) {
            console.error('GuestContext: Error validating welcome gift:', error);
        }
    }, [guestCart.length]); // Use guestCart.length instead of guestCart array

    // Function to recalculate BOGO discount when guest cart changes
    const recalculateBOGODiscount = () => {
        const storedReward = localStorage.getItem('claimedRewardDetails');
        if (!storedReward) return;

        try {
            const parsedReward = JSON.parse(storedReward);
            const rewardText = (parsedReward.reward || parsedReward.rewardText || '').toLowerCase();

            // Only recalculate for BOGO offers
            if (!rewardText.includes('bogo') && !rewardText.includes('buy one get one')) return;

            const totalItems = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

            if (totalItems >= 2) {
                // Find the cheapest item to give for free
                const sortedItems = [...guestCart].sort((a, b) => (a.price || 0) - (b.price || 0));
                const freeItemValue = sortedItems[0].price || 0;

                // Update the stored reward with new discount
                const updatedReward = {
                    ...parsedReward,
                    discountAmount: freeItemValue,
                    isValid: true,
                    validationMessage: undefined
                };
                localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));

                console.log('GuestContext: BOGO discount recalculated:', freeItemValue);
            }
        } catch (error) {
            console.error('GuestContext: Error recalculating BOGO discount:', error);
        }
    };

    // Function to recalculate welcome gift discount when guest cart changes
    const recalculateWelcomeGiftDiscount = () => {
        const storedReward = localStorage.getItem('claimedRewardDetails');
        if (!storedReward) return;

        try {
            const parsedReward = JSON.parse(storedReward);
            const rewardText = (parsedReward.reward || parsedReward.rewardText || '').toLowerCase();
            const rewardTitle = (parsedReward.title || parsedReward.rewardTitle || '').toLowerCase();

            // Skip BOGO offers (handled separately)
            if (rewardText.includes('bogo') || rewardText.includes('buy one get one')) return;

            const subtotal = guestCart.reduce((acc, item) => {
                const price = item.price || 0;
                return acc + (price * (item.quantity || 1));
            }, 0);

            let discountAmount = 0;

            // Calculate discount based on reward type
            if (rewardText.includes('%') || rewardTitle.includes('%')) {
                // Extract percentage from text (e.g., "25% off" -> 25)
                const percentMatch = (rewardText + rewardTitle).match(/(\d+)%/);
                if (percentMatch) {
                    const percentage = parseInt(percentMatch[1]);
                    discountAmount = (subtotal * percentage) / 100;

                    // Apply max discount limit if specified
                    if (parsedReward.maxDiscount) {
                        discountAmount = Math.min(discountAmount, parsedReward.maxDiscount);
                    }
                }
            } else if (rewardText.includes('flat') || rewardText.includes('₹') || rewardTitle.includes('flat')) {
                // Extract fixed amount from text (e.g., "₹100 off" -> 100)
                const amountMatch = (rewardText + rewardTitle).match(/₹?(\d+)/);
                if (amountMatch) {
                    const amount = parseInt(amountMatch[1]);
                    discountAmount = Math.min(amount, subtotal);
                }
            } else if (rewardText.includes('free shipping') || rewardTitle.includes('shipping')) {
                // Free shipping discount
                discountAmount = parsedReward.shippingDiscount || 0;
            }

            const finalAmount = subtotal - discountAmount;

            // Update the stored reward with new calculations
            const updatedReward = {
                ...parsedReward,
                discountAmount,
                finalAmount,
                currentSubtotal: subtotal
            };
            localStorage.setItem('claimedRewardDetails', JSON.stringify(updatedReward));

            console.log('GuestContext: Welcome gift discount recalculated:', discountAmount);
        } catch (error) {
            console.error('GuestContext: Error recalculating welcome gift discount:', error);
        }
    };

    // Function to automatically remove invalid offers for guest users
    const autoRemoveInvalidOffers = useCallback(() => {
        console.log('GuestContext: Auto-removing invalid offers');

        // Only run validation if there are claimed rewards
        const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
        if (hasClaimedReward) {
            // Call validation directly instead of through validateAllOffers
            // to prevent dependency loops
            validateAllOffers();
        }
    }, []); // Remove validateAllOffers from dependencies

    // Effect to validate offers when guest cart changes (but not recursively)
    useEffect(() => {
        // Only validate if there are claimed rewards to prevent unnecessary calls
        const hasClaimedReward = localStorage.getItem('rewardClaimed') === 'true';
        if (hasClaimedReward) {
            console.log('GuestContext: Guest cart changed, validating offers');

            // Add a small delay to prevent rapid successive validations
            const timeoutId = setTimeout(() => {
                // Call validation directly instead of through validateAllOffers
                // to prevent dependency loops
                validateAllOffers();
            }, 300); // 300ms delay

            return () => clearTimeout(timeoutId);
        }
    }, [guestCart.length]); // Remove validateAllOffers from dependencies

    return (
        <GuestContext.Provider
            value={{
                guestWishlist,
                guestCart,
                addToGuestWishlist,
                removeFromGuestWishlist,
                addToGuestCart,
                removeFromGuestCart,
                updateGuestCartQuantity,
                clearGuestData,
                guestCartCount,
                isInGuestWishlist,
            }}
        >
            {children}
        </GuestContext.Provider>
    );
}; 