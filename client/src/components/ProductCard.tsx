// ProductCard.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Star, Sparkles, CheckCircle } from "lucide-react";
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
  volume?: string;
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
  volume,
  variants,
  isNew,
  isSale,
  hideAddToCart = false,
}: ProductCardProps) => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const {
    addToGuestWishlist,
    removeFromGuestWishlist,
    addToGuestCart,
    isInGuestWishlist,
  } = useGuest();
  const [isAdded, setIsAdded] = useState(false);

  const isLiked = isAuthenticated
    ? user?.wishlist?.includes(id)
    : isInGuestWishlist(id);

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
    if (volume) {
      return volume;
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

  const discount = calculateDiscount();

  return (
    <Card className="group relative w-full h-full flex flex-col bg-white border border-warm-taupe/20 hover:border-sage/30 rounded-xl shadow-sm hover:shadow-elegant transition-all duration-300 overflow-hidden touch-manipulation">
      <Link to={`/product/${slug}`} className="flex flex-col h-full">
        {/* Large Product Image */}
        <div className="relative overflow-hidden bg-warm-cream">
          <div className="aspect-[4/5] w-full">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                {discount}% OFF
              </Badge>
            </div>
          )}

          {/* NEW Badge - Top Left (if no discount) */}
          {isNew && !discount && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-sage text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                NEW
              </Badge>
            </div>
          )}

          {/* Wishlist Button - Top Right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full shadow-sm w-8 h-8 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            onClick={handleLikeClick}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-300",
                isLiked ? "fill-sage text-sage-dark" : "text-deep-forest"
              )}
            />
          </Button>
        </div>

        {/* Compact Content Layout */}
        <CardContent className="p-4 flex flex-col flex-grow bg-white">
          {/* Category */}
          <div className="mb-2">
            <span className="text-xs font-medium text-forest uppercase tracking-wide">
              {category}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="font-sans font-bold text-lg text-deep-forest mb-2 line-clamp-2 leading-tight flex-grow">
            {name}
          </h3>

          {/* Rating and Volume Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(rating)
                      ? "fill-gold-accent text-gold-accent"
                      : "text-warm-taupe/50"
                  }`}
                />
              ))}
              <span className="text-xs font-medium text-forest ml-1">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-forest/70">({reviews})</span>
            </div>
            {getDisplayVolume() && (
              <span className="text-xs text-forest font-medium">
                {getDisplayVolume()}
              </span>
            )}
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              {variants && variants.length > 1 && (
                <span className="text-xs text-forest/80 font-medium">From</span>
              )}
              <span className="font-sans font-bold text-xl text-deep-forest">
                {formatRupees(getDisplayPrice())}
              </span>
              {getDisplayOriginalPrice() && (
                <span className="text-sm text-warm-taupe line-through">
                  {formatRupees(getDisplayOriginalPrice())}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button - Hidden when hideAddToCart is true */}
          {!hideAddToCart && (
            <div className="mt-auto">
              <Button
                variant="default"
                className="w-full bg-forest hover:bg-deep-forest text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                onClick={handleAddToCart}
                disabled={getTotalStock() === 0 || isAdded}
              >
                {isAdded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {getTotalStock() === 0
                      ? "OUT OF STOCK"
                      : variants && variants.length > 1
                      ? "SELECT OPTIONS"
                      : "ADD TO CART"}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default ProductCard;
