// CartContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images: Array<{ public_id: string; url: string }>;
    description: string;
    variants?: Array<{
      sku: string;
      volume: string;
      price: number;
      stock: number;
    }>;
  };
  quantity: number;
  variant?: {
    sku: string;
    volume: string;
    price: number;
  };
}

interface AppliedCoupon {
  coupon: {
    _id: string;
    code: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscount?: number;
    minOrderAmount?: number;
    minCartItems?: number;
  };
  discountAmount: number;
  finalAmount: number;
  isValid?: boolean; // Added for validation status
  validationMessage?: string; // Added for validation messages
}

interface AppliedWelcomeGift {
  reward: {
    _id: string;
    rewardTitle: string;
    rewardText: string;
    giftId: string;
    couponCode?: string;
    rewardType?: string;
    rewardValue?: number;
    maxDiscount?: number;
    minOrderAmount?: number;
    displayText?: string;
  };
  discountAmount: number;
  type: 'discount' | 'shipping' | 'sample';
  reason?: string;
  finalAmount?: number;
  shippingDiscount?: number;
  productDiscount?: number;
  isValid?: boolean; // Added for BOGO validation
  validationMessage?: string; // Added for BOGO validation
}

interface CartContextType {
  cartItems: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  appliedWelcomeGift: AppliedWelcomeGift | null;
  addToCart: (item: { productId: string; name: string; quantity?: number; variant?: { volume: string; sku: string } }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  cartCount: number;
  fetchUserCart: () => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  applyCoupon: (couponCode: string, orderAmount: number, cartItems: any[]) => Promise<boolean>;
  removeCoupon: () => void;
  clearCoupon: () => void;
  applyWelcomeGift: (reward: any, discountAmount: number, additionalData?: any) => void;
  removeWelcomeGift: () => void;
  clearWelcomeGift: () => void;
  fetchAndApplyMigratedGift: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedWelcomeGift, setAppliedWelcomeGift] = useState<AppliedWelcomeGift | null>(null);

  // Load applied coupon from localStorage on mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    console.log('CartContext: Loading saved coupon from localStorage:', savedCoupon);
    if (savedCoupon) {
      try {
        const parsedCoupon = JSON.parse(savedCoupon);
        console.log('CartContext: Parsed saved coupon:', parsedCoupon);
        setAppliedCoupon(parsedCoupon);
      } catch (error) {
        console.error('Error parsing saved coupon:', error);
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  // Save applied coupon to localStorage whenever it changes
  useEffect(() => {
    console.log('CartContext: Saving applied coupon to localStorage:', appliedCoupon);
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
      console.log('CartContext: Coupon saved to localStorage');
    } else {
      localStorage.removeItem('appliedCoupon');
      console.log('CartContext: Coupon removed from localStorage');
    }
  }, [appliedCoupon]);

  // Always clear cart on logout event
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setAppliedWelcomeGift(null);
  }, []);

  // Listen for logout event to clear cart
  useEffect(() => {
    window.addEventListener('logoutStateChange', clearCart);
    return () => window.removeEventListener('logoutStateChange', clearCart);
  }, [clearCart]);

  // Fetch user cart from backend
  const fetchUserCart = useCallback(async () => {
    try {
      const response = await Axios.get(SummaryApi.getCart.url);
      if (response.data.success) {
        setCartItems(response.data.data || []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch user cart:", error);
      setCartItems([]);
    }
  }, []);

  // Listen for login event to fetch user cart
  useEffect(() => {
    const handleLogin = async () => {
      await fetchUserCart();
    };
    window.addEventListener('loginStateChange', handleLogin);
    return () => window.removeEventListener('loginStateChange', handleLogin);
  }, [fetchUserCart]);

  const addToCart = useCallback(async (item: { productId: string; name: string; quantity?: number; variant?: { volume: string; sku: string } }) => {
    try {
      await Axios.post(SummaryApi.addToCart.url, {
        productId: item.productId,
        quantity: item.quantity || 1,
        variant: item.variant,
      });
      toast({ title: "Added to cart", description: `${item.name} has been added or updated.` });
      await fetchUserCart();
      // Remove unnecessary event dispatch
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item to cart." });
    }
  }, [fetchUserCart]); // Add fetchUserCart as dependency

  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      await Axios.delete(SummaryApi.deleteFromCart.url.replace(':cartItemId', cartItemId));
      await fetchUserCart();
      // Remove unnecessary event dispatch
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove item from cart." });
    }
  }, [fetchUserCart]); // Add fetchUserCart as dependency

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      await Axios.put(SummaryApi.updateCart.url.replace(':cartItemId', cartItemId), { quantity });
      await fetchUserCart();
      // Remove unnecessary event dispatch
    } catch (error) {
      toast({ title: "Error", description: "Failed to update quantity." });
    }
  }, [fetchUserCart]); // Add fetchUserCart as dependency

  const refreshCart = useCallback(async () => {
    await fetchUserCart();
  }, [fetchUserCart]); // Add fetchUserCart as dependency

  const applyCoupon = useCallback(async (couponCode: string, orderAmount: number, cartItems: any[]): Promise<boolean> => {
    try {
      console.log('CartContext: Applying coupon:', couponCode);
      console.log('CartContext: Order amount:', orderAmount);
      console.log('CartContext: Cart items:', cartItems);

      const response = await Axios.post(SummaryApi.validateCoupon.url, {
        code: couponCode.toUpperCase(),
        orderAmount,
        cartItems
      });

      console.log('CartContext: API response:', response.data);

      if (response.data.success) {
        console.log('CartContext: Setting applied coupon:', response.data.data);
        setAppliedCoupon(response.data.data);
        toast({
          title: "Coupon applied successfully!",
          description: `You saved ${response.data.data.discountAmount}₹`,
        });
        return true;
      }
      console.log('CartContext: Coupon application failed');
      return false;
    } catch (error: any) {
      console.error('CartContext: Error applying coupon:', error);
      const errorMessage = error.response?.data?.message || "Invalid coupon code";
      toast({
        title: "Coupon error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, []); // Empty dependency array since it doesn't depend on any state

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast({
      title: "Coupon removed",
    });
  }, []); // Empty dependency array since it doesn't depend on any state

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []); // Empty dependency array since it doesn't depend on any state

  const applyWelcomeGift = useCallback((reward: any, discountAmount: number, additionalData?: any) => {
    console.log('🔍 DEBUG: CartContext applyWelcomeGift START');
    console.log('🔍 DEBUG: reward parameter:', JSON.stringify(reward, null, 2));
    console.log('🔍 DEBUG: discountAmount parameter:', discountAmount);
    console.log('🔍 DEBUG: additionalData parameter:', JSON.stringify(additionalData, null, 2));
    console.log('🔍 DEBUG: current cartItems:', JSON.stringify(cartItems, null, 2));

    try {
      // Determine the type based on additionalData
      let type: 'discount' | 'shipping' | 'sample' = 'discount';
      if (additionalData?.rewardType === 'buy_one_get_one') {
        type = 'sample';
        console.log('🔍 DEBUG: BOGO offer detected, setting type to "sample"');
      }

      console.log('🔍 DEBUG: type determined:', type);

      // For BOGO offers, recalculate discount based on current cart
      let calculatedDiscountAmount = discountAmount;
      if (additionalData?.rewardType === 'buy_one_get_one') {
        console.log('🔍 DEBUG: BOGO offer - recalculating discount based on current cart');
        const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        console.log('🔍 DEBUG: totalItems in cart:', totalItems);

        if (totalItems >= 2) {
          // Find the cheapest item to give for free
          const sortedItems = [...cartItems].sort((a, b) => {
            const priceA = a.variant?.price || a.productId?.price || 0;
            const priceB = b.variant?.price || b.productId?.price || 0;
            console.log('🔍 DEBUG: Comparing prices for BOGO - item A:', { id: a._id, price: priceA });
            console.log('🔍 DEBUG: Comparing prices for BOGO - item B:', { id: b._id, price: priceB });
            return priceA - priceB;
          });

          calculatedDiscountAmount = sortedItems[0].variant?.price || sortedItems[0].productId?.price || 0;
          console.log('🔍 DEBUG: BOGO discount recalculated:', calculatedDiscountAmount);
          console.log('🔍 DEBUG: Cheapest item details:', {
            id: sortedItems[0]._id,
            price: sortedItems[0].variant?.price || sortedItems[0].productId?.price || 0
          });
        } else {
          console.log('🔍 DEBUG: BOGO offer requires 2+ items, setting discount to 0');
          calculatedDiscountAmount = 0;
        }
      }

      console.log('🔍 DEBUG: Final calculatedDiscountAmount:', calculatedDiscountAmount);

      // Set initial validation status based on offer type and current cart
      const isValid = type === 'sample' ?
        (cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) >= 2) :
        true;
      const validationMessage = type === 'sample' && cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) < 2 ?
        'BOGO offer requires at least 2 items in cart' : undefined;

      console.log('🔍 DEBUG: isValid calculated:', isValid);
      console.log('🔍 DEBUG: validationMessage:', validationMessage);

      const appliedGift: AppliedWelcomeGift = {
        reward,
        discountAmount: calculatedDiscountAmount,
        type,
        isValid,
        validationMessage
      };

      console.log('🔍 DEBUG: Final appliedGift object:', JSON.stringify(appliedGift, null, 2));

      setAppliedWelcomeGift(appliedGift);

      // Store in localStorage for guest users
      // The 'user' variable is not defined in this context, so this block is commented out.
      // if (!user) {
      //   localStorage.setItem('appliedWelcomeGift', JSON.stringify(appliedGift));
      //   console.log('🔍 DEBUG: Stored in localStorage for guest user');
      // }

      console.log('🔍 DEBUG: Welcome gift applied successfully');
    } catch (error) {
      console.error('🔍 DEBUG: Error in applyWelcomeGift:', error);
      console.error('Error applying welcome gift:', error);
    }
  }, [cartItems]); // Add cartItems as dependency since we're using it for BOGO calculation

  const removeWelcomeGift = useCallback(() => {
    setAppliedWelcomeGift(null);
  }, []); // Empty dependency array since it doesn't depend on any state

  const clearWelcomeGift = useCallback(() => {
    setAppliedWelcomeGift(null);
  }, []); // Empty dependency array since it doesn't depend on any state

  // Function to fetch and apply migrated welcome gift after login
  const fetchAndApplyMigratedGift = useCallback(async () => {
    console.log('CartContext: fetchAndApplyMigratedGift called');
    try {
      const response = await Axios.get(SummaryApi.getUserRewards.url);
      console.log('CartContext: getUserRewards response:', response.data);

      if (response.data.success && response.data.data.length > 0) {
        const userReward = response.data.data[0]; // Get the first (and should be only) reward
        console.log('CartContext: Found user reward:', userReward);

        if (userReward && !userReward.isUsed) {
          // Apply the welcome gift to the cart
          const gift = userReward.giftId;
          console.log('CartContext: Gift details:', gift);

          if (gift) {
            // Calculate discount based on current cart
            const cartSubtotal = cartItems.reduce((total, item) => {
              const price = item.variant?.price || item.productId?.price || 0;
              return total + (price * item.quantity);
            }, 0);

            console.log('CartContext: Cart subtotal for gift calculation:', cartSubtotal);

            // Use the gift's calculateDiscount method or apply basic logic
            let discountAmount = 0;
            let additionalData = {};

            if (gift.rewardType === 'percentage') {
              discountAmount = (cartSubtotal * gift.rewardValue) / 100;
              if (gift.maxDiscount && discountAmount > gift.maxDiscount) {
                discountAmount = gift.maxDiscount;
              }
              additionalData = {
                rewardType: gift.rewardType,
                rewardValue: gift.rewardValue,
                maxDiscount: gift.maxDiscount,
                reason: `${gift.rewardValue}% off`
              };
            } else if (gift.rewardType === 'fixed_amount') {
              discountAmount = Math.min(gift.rewardValue, cartSubtotal);
              additionalData = {
                rewardType: gift.rewardType,
                rewardValue: gift.rewardValue,
                reason: `₹${gift.rewardValue} off`
              };
            } else if (gift.rewardType === 'buy_one_get_one') {
              // Handle BOGO offers
              const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

              if (totalItems >= 2) {
                // Find the cheapest item to give for free
                const sortedItems = [...cartItems].sort((a, b) => {
                  const priceA = a.variant?.price || a.productId?.price || 0;
                  const priceB = b.variant?.price || b.productId?.price || 0;
                  return priceA - priceB;
                });

                discountAmount = sortedItems[0].variant?.price || sortedItems[0].productId?.price || 0;

                additionalData = {
                  rewardType: gift.rewardType,
                  reason: 'Buy 1 Get 1 Free'
                };

                console.log('CartContext: BOGO offer migrated with discount:', discountAmount);
              } else {
                // BOGO conditions not met initially
                discountAmount = 0;
                additionalData = {
                  rewardType: gift.rewardType,
                  reason: 'Buy 1 Get 1 Free (requires 2+ items)'
                };

                console.log('CartContext: BOGO offer migrated but conditions not met initially');
              }
            }

            console.log('CartContext: Calculated discount amount:', discountAmount);
            console.log('CartContext: Additional data:', additionalData);

            if (discountAmount > 0) {
              applyWelcomeGift(gift, discountAmount, additionalData);
              console.log('CartContext: Applied migrated welcome gift:', gift.title);
            } else {
              console.log('CartContext: No discount to apply, cart might be empty');
            }
          }
        } else {
          console.log('CartContext: User reward not found or already used');
        }
      } else {
        console.log('CartContext: No user rewards found');
      }
    } catch (error) {
      console.error('CartContext: Error fetching migrated gift:', error);
    }
  }, [cartItems.length, applyWelcomeGift]); // Use cartItems.length instead of cartItems array

  // Function to validate all applied offers when cart changes
  const validateAllOffers = useCallback(async () => {
    console.log('CartContext: Validating all offers with cart changes');

    // Don't call validation functions here to prevent infinite loops
    // The validation will happen automatically when the state changes
    console.log('CartContext: Skipping validation to prevent infinite loops');
  }, []); // No dependencies to prevent loops

  // Function to validate applied coupon
  const validateAppliedCoupon = useCallback(async () => {
    if (!appliedCoupon) return;

    try {
      const subtotal = cartItems.reduce((acc, item) => {
        const price = item.variant?.price || item.productId?.price || 0;
        return acc + (price * item.quantity);
      }, 0);

      // Check minimum order amount
      if (appliedCoupon.coupon.minOrderAmount && subtotal < appliedCoupon.coupon.minOrderAmount) {
        console.log('CartContext: Coupon validation failed - insufficient order amount');
        // Instead of removing, mark as invalid but keep the coupon
        setAppliedCoupon(prev => prev ? {
          ...prev,
          isValid: false,
          validationMessage: `Minimum order amount of ₹${appliedCoupon.coupon.minOrderAmount} required`,
          currentSubtotal: subtotal,
          requiredAmount: appliedCoupon.coupon.minOrderAmount
        } : null);
        return;
      }

      // Check minimum cart items
      if (appliedCoupon.coupon.minCartItems) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < appliedCoupon.coupon.minCartItems) {
          console.log('CartContext: Coupon validation failed - insufficient cart items');
          setAppliedCoupon(prev => prev ? {
            ...prev,
            isValid: false,
            validationMessage: `Minimum ${appliedCoupon.coupon.minCartItems} items required`,
            currentItems: totalItems,
            requiredItems: appliedCoupon.coupon.minCartItems
          } : null);
          return;
        }
      }

      // If all validations pass, mark as valid and recalculate discount
      console.log('CartContext: Coupon validation passed - recalculating discount');
      setAppliedCoupon(prev => prev ? {
        ...prev,
        isValid: true,
        validationMessage: undefined,
        currentSubtotal: subtotal,
        requiredAmount: undefined,
        currentItems: undefined,
        requiredItems: undefined
      } : null);

      // Recalculate coupon discount with current cart
      await recalculateCouponDiscount();
    } catch (error) {
      console.error('CartContext: Error validating coupon:', error);
    }
  }, [appliedCoupon, cartItems]); // Add dependencies

  // Function to recalculate coupon discount when cart changes
  const recalculateCouponDiscount = useCallback(async () => {
    if (!appliedCoupon) return;

    try {
      const subtotal = cartItems.reduce((acc, item) => {
        const price = item.variant?.price || item.productId?.price || 0;
        return acc + (price * item.quantity);
      }, 0);

      let discountAmount = 0;

      // Calculate discount based on coupon type
      if (appliedCoupon.coupon.type === 'percentage') {
        discountAmount = (subtotal * appliedCoupon.coupon.value) / 100;

        // Apply max discount limit if specified
        if (appliedCoupon.coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, appliedCoupon.coupon.maxDiscount);
        }
      } else if (appliedCoupon.coupon.type === 'fixed') {
        discountAmount = Math.min(appliedCoupon.coupon.value, subtotal);
      }

      const finalAmount = subtotal - discountAmount;

      // Update the applied coupon with new calculations
      setAppliedCoupon(prev => prev ? {
        ...prev,
        discountAmount,
        finalAmount,
        currentSubtotal: subtotal
      } : null);

      console.log('CartContext: Coupon discount recalculated:', discountAmount);
    } catch (error) {
      console.error('CartContext: Error recalculating coupon discount:', error);
    }
  }, [appliedCoupon, cartItems]); // Add dependencies

  // Function to recalculate BOGO discount when cart changes
  const recalculateBOGODiscount = useCallback(async () => {
    if (!appliedWelcomeGift || appliedWelcomeGift.type !== 'sample') {
      console.log('CartContext: recalculateBOGODiscount early return - not a BOGO offer');
      return 0;
    }

    try {
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      console.log('CartContext: recalculateBOGODiscount - totalItems:', totalItems);

      if (totalItems >= 2) {
        // Find the cheapest item to give for free
        const sortedItems = [...cartItems].sort((a, b) => {
          const priceA = a.variant?.price || a.productId?.price || 0;
          const priceB = b.variant?.price || b.productId?.price || 0;
          return priceA - priceB;
        });

        const freeItemValue = sortedItems[0].variant?.price || sortedItems[0].productId?.price || 0;
        console.log('CartContext: recalculateBOGODiscount - freeItemValue:', freeItemValue);
        return freeItemValue;
      } else {
        console.log('CartContext: recalculateBOGODiscount - not enough items for BOGO');
        return 0;
      }
    } catch (error) {
      console.error('CartContext: Error recalculating BOGO discount:', error);
      return 0;
    }
  }, [appliedWelcomeGift, cartItems]);

  // Function to recalculate welcome gift discount when cart changes
  const recalculateWelcomeGiftDiscount = useCallback(async () => {
    if (!appliedWelcomeGift) return 0;

    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.productId?.price || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);

      let discountAmount = 0;

      // Calculate discount based on reward type
      if (appliedWelcomeGift.reward?.rewardType === 'percentage') {
        discountAmount = (subtotal * (appliedWelcomeGift.reward.rewardValue || 0)) / 100;
      } else if (appliedWelcomeGift.reward?.rewardType === 'fixed') {
        discountAmount = Math.min(appliedWelcomeGift.reward.rewardValue || 0, subtotal);
      }

      console.log('CartContext: recalculateWelcomeGiftDiscount - calculated:', discountAmount);
      return discountAmount;
    } catch (error) {
      console.error('CartContext: Error recalculating welcome gift discount:', error);
      return 0;
    }
  }, [appliedWelcomeGift, cartItems]);

  // Function to validate applied welcome gift
  const validateAppliedWelcomeGift = useCallback(async (appliedWelcomeGift: AppliedWelcomeGift | null) => {
    if (!appliedWelcomeGift) return;

    console.log('CartContext: validateAppliedWelcomeGift called with:', {
      appliedWelcomeGift,
      type: appliedWelcomeGift.type,
      cartItems: cartItems.length,
      totalQuantity: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    });

    try {
      // For BOGO offers, check if we have enough items
      if (appliedWelcomeGift.type === 'sample') {
        const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        console.log('CartContext: BOGO validation - totalItems:', totalItems);

        if (totalItems >= 2) {
          console.log('CartContext: BOGO validation passed - recalculating discount');

          // Call recalculateBOGODiscount with the correct parameters
          const newDiscountAmount = await recalculateBOGODiscount();
          console.log('CartContext: BOGO discount calculation result:', newDiscountAmount);

          // Update the appliedWelcomeGift with the new discount amount
          setAppliedWelcomeGift(prev => prev ? {
            ...prev,
            discountAmount: newDiscountAmount,
            isValid: true,
            validationMessage: undefined
          } : null);

          console.log('CartContext: BOGO offer updated with new discount amount:', newDiscountAmount);
        } else {
          console.log('CartContext: BOGO validation failed - not enough items');
          setAppliedWelcomeGift(prev => prev ? {
            ...prev,
            isValid: false,
            validationMessage: 'BOGO offer requires at least 2 items in cart'
          } : null);
        }
      }
      // For other welcome gift types, check minimum order amount
      else if (appliedWelcomeGift.reward?.minOrderAmount) {
        const subtotal = cartItems.reduce((sum, item) => {
          const itemPrice = item.variant?.price || item.productId?.price || 0;
          return sum + (itemPrice * item.quantity);
        }, 0);

        if (subtotal >= appliedWelcomeGift.reward.minOrderAmount) {
          console.log('CartContext: Welcome gift validation passed - minimum order met');
          setAppliedWelcomeGift(prev => prev ? {
            ...prev,
            isValid: true,
            validationMessage: undefined
          } : null);

          // Recalculate discount for non-BOGO offers
          const newDiscountAmount = await recalculateWelcomeGiftDiscount();
          if (newDiscountAmount > 0) {
            setAppliedWelcomeGift(prev => prev ? {
              ...prev,
              discountAmount: newDiscountAmount
            } : null);
          }
        } else {
          console.log('CartContext: Welcome gift validation failed - minimum order not met');
          setAppliedWelcomeGift(prev => prev ? {
            ...prev,
            isValid: false,
            validationMessage: `Minimum order amount of ₹${appliedWelcomeGift.reward.minOrderAmount} required`
          } : null);
        }
      } else {
        console.log('CartContext: Welcome gift validation passed - no minimum requirement');
        setAppliedWelcomeGift(prev => prev ? {
          ...prev,
          isValid: true,
          validationMessage: undefined
        } : null);
      }

      console.log('CartContext: Welcome gift validation completed');
    } catch (error) {
      console.error('CartContext: Error validating welcome gift:', error);
    }
  }, [cartItems, recalculateBOGODiscount, recalculateWelcomeGiftDiscount]);

  // Effect to validate offers when cart changes (but not recursively)
  useEffect(() => {
    // Only validate if there are applied offers to prevent unnecessary calls
    if (appliedCoupon || appliedWelcomeGift) {
      console.log('CartContext: Cart changed, triggering validation - useEffect triggered', {
        cartItemsLength: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        hasAppliedCoupon: !!appliedCoupon,
        hasAppliedWelcomeGift: !!appliedWelcomeGift,
        welcomeGiftType: appliedWelcomeGift?.type
      });

      // Add a small delay to prevent rapid successive validations
      const timeoutId = setTimeout(() => {
        console.log('CartContext: Running validation after debounce');

        // Call validation functions directly to update the state
        if (appliedCoupon) {
          validateAppliedCoupon();
        }
        if (appliedWelcomeGift) {
          validateAppliedWelcomeGift(appliedWelcomeGift);
        }
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [cartItems.length, appliedCoupon, appliedWelcomeGift]); // Depend on cartItems.length and applied offers

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      appliedCoupon,
      appliedWelcomeGift,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartCount,
      fetchUserCart,
      clearCart,
      refreshCart,
      applyCoupon,
      removeCoupon,
      clearCoupon,
      applyWelcomeGift,
      removeWelcomeGift,
      clearWelcomeGift,
      fetchAndApplyMigratedGift,
    }}>
      {children}
    </CartContext.Provider>
  );
};