// ProductCard.tsx
import React, { useState, memo } from "react";
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

  const discount = calculateDiscount();

  return (
    <Card className="group relative w-full h-full flex flex-col bg-white border border-border/20 hover:border-primary/30 rounded-xl shadow-sm hover:shadow-elegant transition-all duration-300 overflow-hidden touch-manipulation">
      <Link to={`/product/${slug}`} className="flex flex-col h-full">
        {/* Large Product Image */}
        <div className="relative overflow-hidden bg-white">
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
              <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm border-0">
                {discount}% OFF
              </Badge>
            </div>
          )}

          {/* NEW Badge - Top Left (if no discount) */}
          {isNew && !discount && (
            <div className="absolute top-3 left-3">
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
            className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full shadow-sm w-8 h-8 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            onClick={handleLikeClick}
            aria-label={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-300",
                isLiked ? "fill-primary text-primary" : "text-foreground"
              )}
            />
          </Button>
        </div>

        {/* Compact Content Layout */}
        <CardContent className="p-4 flex flex-col flex-grow bg-white text-center">
          {/* Product Title */}
          <h3 className="font-sans font-bold text-sm sm:text-lg text-foreground mb-1 line-clamp-2 leading-tight">
            {name}
          </h3>

          {/* Benefits - Show first 2 benefits in green text */}
          {benefits && benefits.length > 0 && (
            <div className="mb-1">
              <p className="text-xs sm:text-sm text-muted-green font-medium line-clamp-2 leading-tight">
                {benefits.slice(0, 2).join(" | ")}
              </p>
            </div>
          )}

          {/* Product Quantity/Volume */}
          {getDisplayVolume() && (
            <div className="mb-1">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {getDisplayVolume()}
              </span>
            </div>
          )}

          {/* Rating and Reviews */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              ({reviews} Reviews)
            </span>
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-center justify-center gap-2">
              {variants && variants.length > 1 && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  From
                </span>
              )}
              <span className="font-sans font-bold text-base sm:text-xl text-foreground">
                {formatRupees(getDisplayPrice())}
              </span>
              {getDisplayOriginalPrice() && (
                <span className="text-xs sm:text-sm text-muted-foreground line-through">
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
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-xs sm:text-sm"
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

export default memo(ProductCard);
