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
  shortDescription?: string;
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
  shortDescription,
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
    <Card className="product-card-uniform">
      <Link to={`/product/${slug}`} className="flex flex-col h-full">
        {/* Perfect 1:1 Square Image Container */}
        <div className="product-image-square-container">
          <img src={image} alt={name} />

          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                {discount}% OFF
              </Badge>
            </div>
          )}

          {/* NEW Badge - Top Left (if no discount) */}
          {isNew && !discount && (
            <div className="absolute top-2 left-2 z-10">
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
            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full shadow-sm w-7 h-7 backdrop-blur-sm transition-all duration-300 hover:scale-110"
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

        {/* Content Section - Consistent Spacing */}
        <CardContent className="product-content-uniform">
          {/* Product Title and Description - Flexible Top Section */}
          <div className="product-card-content">
            <h3 className="product-title">{name}</h3>
            {shortDescription && (
              <p className="product-description">{shortDescription}</p>
            )}
          </div>

          {/* Footer: Rating, Price, Button - Always at Bottom */}
          <div className="product-card-footer">
            {/* Rating Section */}
            <div className="product-card-rating">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">({reviews})</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="product-card-price">
              <div className="flex items-center justify-center gap-2">
                {variants && variants.length > 1 && (
                  <span className="text-sm text-gray-500">From</span>
                )}
                <span className="text-xl font-bold text-gray-900">
                  {formatRupees(getDisplayPrice())}
                </span>
                {getDisplayOriginalPrice() && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatRupees(getDisplayOriginalPrice())}
                  </span>
                )}
              </div>
            </div>

            {/* Product Card Action Area */}
            {!hideAddToCart && (
              <div className="product-card-action-area">
                {cartItemInfo.isInCart ? (
                  // Quantity Selector - Same position as Add to Cart button
                  <div className="product-card-quantity-selector">
                    <Button
                      variant="outline"
                      size="sm"
                      className="quantity-btn"
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
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="quantity-value-box">
                      {isUpdatingQuantity ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></div>
                          <div
                            className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      ) : (
                        quantity
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="quantity-btn"
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
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // Add to Cart Button - Uniform Style
                  <Button
                    variant="default"
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={getTotalStock() === 0 || isAdded}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        {getTotalStock() === 0
                          ? "Out of Stock"
                          : variants && variants.length > 1
                          ? "Select Options"
                          : "Add to Cart"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default memo(ProductCard);
