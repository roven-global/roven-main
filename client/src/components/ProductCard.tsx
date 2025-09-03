// ProductCard.tsx
import React, { useState, memo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ShoppingBag,
  Star,
  Sparkles,
  CheckCircle,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useGuest } from "@/contexts/GuestContext";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { toast } from "@/hooks/use-toast";
import { formatRupees } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviews?: number;
  category: string;
  specifications?: {
    volume?: string;
  };
  variants?: Array<{
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
  }>;
  isNew?: boolean;
  isSale?: boolean;
  benefits?: string[];
  hideAddToCart?: boolean; // New prop to hide the Add to Cart button
}

const ProductCard = ({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  rating = 0,
  reviews = 0,
  category,
  specifications,
  variants,
  isNew,
  isSale,
  benefits,
  hideAddToCart = false,
}: ProductCardProps) => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const {
    addToGuestWishlist,
    removeFromGuestWishlist,
    addToGuestCart,
    isInGuestWishlist,
    guestCart,
    updateGuestCartQuantity,
    removeFromGuestCart,
  } = useGuest();
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);

  const isLiked = isAuthenticated
    ? user?.wishlist?.includes(id)
    : isInGuestWishlist(id);

  // Helper function to check if product is in cart and get its quantity
  const getCartItemInfo = () => {
    if (!id) return { isInCart: false, quantity: 0, cartItemId: null };

    if (isAuthenticated) {
      // For authenticated users, check cartItems from CartContext
      const cartItem = cartItems.find((item) => {
        if (item.productId._id === id) {
          if (variants && variants.length === 1) {
            // Check if variant matches
            return item.variant?.sku === variants[0].sku;
          } else {
            // No variant or multiple variants, check if item has no variant
            return !item.variant;
          }
        }
        return false;
      });

      return {
        isInCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        cartItemId: cartItem?._id || null,
      };
    } else {
      // For guest users, check guestCart from GuestContext
      const cartItem = guestCart.find((item) => {
        if (item.id === id) {
          if (variants && variants.length === 1) {
            // Check if variant matches
            return item.variant?.sku === variants[0].sku;
          } else {
            // No variant or multiple variants, check if item has no variant
            return !item.variant;
          }
        }
        return false;
      });

      return {
        isInCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        cartItemId: null, // Guest cart doesn't have cartItemId
      };
    }
  };

  // Get current cart item info
  const cartItemInfo = getCartItemInfo();

  // Update local quantity when cart changes
  useEffect(() => {
    if (cartItemInfo.isInCart) {
      setQuantity(cartItemInfo.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItemInfo.isInCart, cartItemInfo.quantity, cartItems, guestCart]);

  const getDisplayPrice = () => {
    if (variants && variants.length > 0) {
      return Math.min(...variants.map((v) => v.price));
    }
    return price;
  };

  const getDisplayOriginalPrice = () => {
    if (variants && variants.length > 0) {
      const variantsWithOriginal = variants.filter((v) => v.originalPrice);
      if (variantsWithOriginal.length > 0) {
        return Math.min(...variantsWithOriginal.map((v) => v.originalPrice!));
      }
    }
    return originalPrice;
  };

  const getTotalStock = () => {
    if (variants && variants.length > 0) {
      return variants.reduce((total, v) => total + v.stock, 0);
    }
    return null;
  };

  const calculateDiscount = () => {
    const currentPrice = getDisplayPrice();
    const originalPrice = getDisplayOriginalPrice();
    if (originalPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  const getDisplayVolume = () => {
    if (variants && variants.length === 1) {
      return variants[0].volume;
    }
    if (specifications?.volume) {
      return specifications.volume;
    }
    if (variants && variants.length > 1) {
      return `${variants.length} variants`;
    }
    return null;
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      if (isInGuestWishlist(id)) {
        removeFromGuestWishlist(id);
      } else {
        addToGuestWishlist({ id, name, price, image, slug });
      }
      toast({
        title: isInGuestWishlist(id)
          ? "Removed from Wishlist"
          : "Added to Wishlist",
        description: name,
      });
      return;
    }

    try {
      const response = await Axios.post(SummaryApi.toggleWishlist.url, {
        productId: id,
      });
      if (response.data.success) {
        updateUser({ ...user, wishlist: response.data.wishlist });
        toast({
          title: response.data.message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdded) return;

    if (variants && variants.length > 1) {
      navigate(`/product/${slug}`);
      return;
    }

    const selectedVariant =
      variants && variants.length === 1 ? variants[0] : null;

    if (selectedVariant && selectedVariant.stock === 0) {
      toast({ title: "This item is out of stock.", variant: "destructive" });
      return;
    }

    const cartItem = {
      id,
      name: selectedVariant ? `${name} - ${selectedVariant.volume}` : name,
      price: selectedVariant ? selectedVariant.price : price,
      image,
      quantity: 1,
      variant: selectedVariant
        ? { volume: selectedVariant.volume, sku: selectedVariant.sku }
        : undefined,
    };

    if (!isAuthenticated) {
      addToGuestCart(cartItem);
    } else {
      addToCart({
        productId: cartItem.id,
        name: cartItem.name,
        quantity: cartItem.quantity,
        variant: cartItem.variant,
      });
    }

    toast({
      title: "Added to Cart!",
      description: cartItem.name,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (!id || newQuantity < 0) return;

    setIsUpdatingQuantity(true);

    try {
      if (newQuantity === 0) {
        // Remove from cart
        if (isAuthenticated && cartItemInfo.cartItemId) {
          await removeFromCart(cartItemInfo.cartItemId);
        } else {
          const selectedVariant =
            variants && variants.length === 1 ? variants[0] : null;
          removeFromGuestCart(
            id,
            selectedVariant
              ? { volume: selectedVariant.volume, sku: selectedVariant.sku }
              : undefined
          );
        }
        toast({
          title: "Removed from Cart",
          description: name,
        });
        return;
      }

      // Check stock limit
      const maxStock =
        variants && variants.length === 1 ? variants[0].stock : 10;
      if (newQuantity > maxStock) {
        toast({
          title: "Stock Limit",
          description: `Only ${maxStock} units available`,
          variant: "destructive",
        });
        return;
      }

      // Update quantity
      if (isAuthenticated && cartItemInfo.cartItemId) {
        await updateQuantity(cartItemInfo.cartItemId, newQuantity);
      } else {
        const selectedVariant =
          variants && variants.length === 1 ? variants[0] : null;
        updateGuestCartQuantity(
          id,
          newQuantity,
          selectedVariant
            ? { volume: selectedVariant.volume, sku: selectedVariant.sku }
            : undefined
        );
      }

      setQuantity(newQuantity);
      toast({
        title: "Cart Updated",
        description: `Quantity updated to ${newQuantity}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  const discount = calculateDiscount();

  return (
    <Card className="group relative w-full h-full flex flex-col bg-white border border-border/20 hover:border-primary/30 rounded-lg shadow-sm hover:shadow-elegant transition-all duration-300 overflow-hidden touch-manipulation">
      <Link to={`/product/${slug}`} className="flex flex-col h-full">
        {/* Large Product Image */}
        <div className="relative overflow-hidden bg-white">
          <div className="aspect-square w-full p-3">
            <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                {discount}% OFF
              </Badge>
            </div>
          )}

          {/* NEW Badge - Top Left (if no discount) */}
          {isNew && !discount && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                NEW
              </Badge>
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full shadow-sm w-7 h-7 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            onClick={handleLikeClick}
            aria-label={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-all duration-300",
                isLiked ? "fill-primary text-primary" : "text-foreground"
              )}
            />
          </Button>
        </div>

        {/* Compact Content Layout */}
        <CardContent className="p-2 flex flex-col flex-grow bg-white text-center">
          {/* Product Title */}
          <h3 className="font-sans font-bold text-sm text-foreground mb-0.5 line-clamp-2 leading-tight">
            {name}
          </h3>

          {/* Benefits - Show first 2 benefits in green text */}
          {benefits && benefits.length > 0 && (
            <div className="mb-0.5">
              <p className="text-xs text-muted-green font-medium line-clamp-2 leading-tight">
                {benefits.slice(0, 2).join(" | ")}
              </p>
            </div>
          )}

          {/* Product Quantity/Volume */}
          {getDisplayVolume() && (
            <div className="mb-0.5">
              <span className="text-xs text-muted-foreground font-medium">
                {getDisplayVolume()}
              </span>
            </div>
          )}

          {/* Rating and Reviews */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="text-xs font-medium text-muted-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviews} Reviews)
            </span>
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-center justify-center gap-2">
              {variants && variants.length > 1 && (
                <span className="text-xs text-muted-foreground">From</span>
              )}
              <span className="font-sans font-bold text-sm text-foreground">
                {formatRupees(getDisplayPrice())}
              </span>
              {getDisplayOriginalPrice() && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatRupees(getDisplayOriginalPrice())}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Cart Section - Hidden when hideAddToCart is true */}
          {!hideAddToCart && (
            <div className="mt-auto">
              {cartItemInfo.isInCart ? (
                // Quantity Selector (JioMart-style)
                <div className="w-full">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm h-8 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-12 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 text-gray-600 disabled:opacity-40 flex items-center justify-center border-r border-gray-200 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuantityChange(quantity - 1);
                      }}
                      disabled={
                        (variants &&
                          variants.length === 1 &&
                          variants[0].stock === 0) ||
                        isUpdatingQuantity
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="h-8 flex-1 flex items-center justify-center bg-white border-r border-gray-200">
                      <span className="font-semibold text-gray-800 text-sm">
                        {isUpdatingQuantity ? (
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                            <div
                              className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        ) : (
                          quantity
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-12 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 text-gray-600 disabled:opacity-40 flex items-center justify-center text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuantityChange(quantity + 1);
                      }}
                      disabled={
                        (variants &&
                          variants.length === 1 &&
                          variants[0].stock === 0) ||
                        quantity >=
                          (variants && variants.length === 1
                            ? variants[0].stock
                            : 10) ||
                        isUpdatingQuantity
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Add to Cart Button
                <Button
                  variant="default"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-1.5 px-3 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-xs"
                  onClick={handleAddToCart}
                  disabled={getTotalStock() === 0 || isAdded}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                      {getTotalStock() === 0
                        ? "OUT OF STOCK"
                        : variants && variants.length > 1
                        ? "SELECT OPTIONS"
                        : "ADD TO CART"}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default memo(ProductCard);
