import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Share2,
  Copy,
} from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useGuest } from "@/contexts/GuestContext";
import { toast } from "@/hooks/use-toast";
import { formatRupees } from "@/lib/currency";
import { cn } from "@/lib/utils";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/styles.min.css";
import SizeSelector from "@/components/SizeSelector";
import RelatedProducts from "@/components/RelatedProducts";
import CustomerReviews, {
  CustomerReviewsHandles,
} from "@/components/CustomerReviews";
import ProductDescription from "@/components/ProductDescription";

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: { url: string };
  };
  rating: number;
  review: string;
  createdAt: string;
}

interface ProductVariant {
  volume: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  lowStockThreshold: number;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  variants?: ProductVariant[];
  images: Array<{ url: string; public_id: string }>;
  category: { _id: string; name: string; slug: string };
  brand: string;
  ratings: { average: number; numOfReviews: number };
  specifications: Record<string, any>;
  ingredients?: Array<{
    name: string;
    description: string;
    image?: { url: string; public_id?: string };
  }>;
  suitableFor?: string[];
  tags: string[];
  benefits: string[];
  slug: string;
  howToUse?: string[];
  nutrition?: Array<{ label: string; value: string }>;
  sellerInfo?: string;
}

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const reviewsRef = useRef<CustomerReviewsHandles>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const tabSliderRef = useRef<HTMLDivElement>(null);
  const {
    addToGuestWishlist,
    removeFromGuestWishlist,
    addToGuestCart,
    isInGuestWishlist,
    guestCart,
    updateGuestCartQuantity,
    removeFromGuestCart,
  } = useGuest();

  const isLiked = isAuthenticated
    ? user?.wishlist?.includes(product?._id)
    : isInGuestWishlist(product?._id || "");

  // Helper function to check if product is in cart and get its quantity
  const getCartItemInfo = () => {
    if (!product) return { isInCart: false, quantity: 0, cartItemId: null };

    if (isAuthenticated) {
      // For authenticated users, check cartItems from CartContext
      const cartItem = cartItems.find((item) => {
        if (item.productId._id === product._id) {
          if (selectedVariant) {
            // Check if variant matches
            return item.variant?.sku === selectedVariant.sku;
          } else {
            // No variant selected, check if item has no variant
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
        if (item.id === product._id) {
          if (selectedVariant) {
            // Check if variant matches
            return item.variant?.sku === selectedVariant.sku;
          } else {
            // No variant selected, check if item has no variant
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

  // Update cart info when variant changes
  useEffect(() => {
    // This will trigger getCartItemInfo() to recalculate with new variant
    // and update the UI accordingly
  }, [selectedVariant]);

  // Fetch cart data on mount to ensure synchronization
  useEffect(() => {
    if (isAuthenticated) {
      // CartContext will handle fetching authenticated user's cart
      // Guest cart is already loaded from localStorage in GuestContext
    }
  }, [isAuthenticated]);

  // Debug: Log product data when it changes
  useEffect(() => {
    if (product) {
      console.log("Product data loaded:", {
        name: product.name,
        suitableFor: product.suitableFor,
        suitableForType: typeof product.suitableFor,
        suitableForLength: product.suitableFor?.length,
      });
    }
  }, [product]);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (tabSliderRef.current && window.innerWidth < 768) {
      const activeButton = tabSliderRef.current.querySelector(
        `[data-tab="${activeTab}"]`
      ) as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

  // Refresh cart data when component becomes visible (for better synchronization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Refresh cart data when page becomes visible
        // This ensures synchronization if cart was modified in another tab
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!slug) return;

    const fetchProductAndReviews = async () => {
      setLoading(true);
      setReviewsLoading(true);
      setError(null);
      try {
        // Fetch product details
        const productResponse = await Axios.get(
          `${SummaryApi.getProductById.url}/${slug}`
        );
        if (productResponse.data.success) {
          const productData = productResponse.data.data;
          setProduct(productData);
          setSelectedImage(productData.images[0]?.url || "");
          if (productData.variants && productData.variants.length > 0) {
            const defaultVariant =
              productData.variants.find(
                (v: ProductVariant) => v.isActive && v.stock > 0
              ) || productData.variants[0];
            setSelectedVariant(defaultVariant);
          }
        } else {
          throw new Error("Product not found.");
        }

        // Fetch initial batch of reviews (first 10)
        const reviewsResponse = await Axios.get(
          `${SummaryApi.getReviews.url}/${slug}?page=1&limit=10`
        );
        if (reviewsResponse.data.success) {
          setAllReviews(reviewsResponse.data.data.reviews);
        }
      } catch (err) {
        setError("Could not load the product. Please try again later.");
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [slug]);

  const handleLikeClick = async () => {
    if (!product) return;

    // Trigger professional animation
    setWishlistAnimation(true);
    setTimeout(() => setWishlistAnimation(false), 1000); // Match animation duration

    if (!isAuthenticated) {
      if (isInGuestWishlist(product._id)) {
        removeFromGuestWishlist(product._id);
      } else {
        addToGuestWishlist({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || "",
          slug: product.slug,
        });
      }
      toast({
        title: isInGuestWishlist(product._id)
          ? "Removed from Wishlist"
          : "Added to Wishlist",
        description: product.name,
      });
      return;
    }

    try {
      const response = await Axios.post(SummaryApi.toggleWishlist.url, {
        productId: product._id,
      });
      if (response.data.success) {
        updateUser({ ...user, wishlist: response.data.wishlist });
        toast({ title: response.data.message });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = () => {
    if (!product || isAdded) return;

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    const variantToAdd =
      selectedVariant ||
      (product.variants && product.variants.length === 1
        ? product.variants[0]
        : null);

    if (variantToAdd && variantToAdd.stock === 0) {
      toast({
        title: "Out of Stock",
        variant: "destructive",
      });
      return;
    }

    const cartItem = {
      id: product._id,
      name: variantToAdd
        ? `${product.name} - ${variantToAdd.volume}`
        : product.name,
      price: variantToAdd ? variantToAdd.price : product.price,
      image: product.images[0]?.url || "",
      quantity,
      variant: variantToAdd
        ? { volume: variantToAdd.volume, sku: variantToAdd.sku }
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
    if (!product || newQuantity < 0) return;

    setIsUpdatingQuantity(true);

    try {
      if (newQuantity === 0) {
        // Remove from cart
        if (isAuthenticated && cartItemInfo.cartItemId) {
          await removeFromCart(cartItemInfo.cartItemId);
        } else {
          removeFromGuestCart(
            product._id,
            selectedVariant
              ? { volume: selectedVariant.volume, sku: selectedVariant.sku }
              : undefined
          );
        }
        toast({
          title: "Removed from Cart",
          description: product.name,
        });
        return;
      }

      // Check stock limit
      const maxStock = selectedVariant?.stock ?? 10;
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
        updateGuestCartQuantity(
          product._id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Skeleton className="w-full h-96 rounded-lg bg-border/20" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="w-20 h-20 rounded-lg bg-border/20"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4 bg-border/20" />
                <Skeleton className="h-6 w-1/2 bg-border/20" />
                <Skeleton className="h-12 w-1/3 bg-border/20" />
                <Skeleton className="h-20 w-full bg-border/20" />
                <Skeleton className="h-12 w-full bg-border/20" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-destructive">
            {error || "Product not found."}
          </h2>
          <Link to="/shop">
            <Button
              variant="outline"
              className="mt-4 border-border text-muted-brown hover:bg-primary/20 hover:text-primary"
            >
              Go back to Shop
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ?? product.price;
  const originalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const discount = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;
  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.name,
      text: `${product.shortDescription || product.description}\nVolume: ${
        selectedVariant?.volume || product.specifications?.volume || ""
      }`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Product shared successfully!" });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Could not share product",
          variant: "destructive",
        });
      }
    } else {
      setShareModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name} | Roven</title>
        <meta name="description" content={product.shortDescription} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription} />
        <meta property="og:image" content={product.images[0]?.url} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Inject custom CSS for professional animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes heartBeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.3); }
          28% { transform: scale(1); }
          42% { transform: scale(1.3); }
          70% { transform: scale(1); }
        }
        
        .animate-heart-beat {
          animation: heartBeat 1.3s ease-in-out;
        }
        
        .wishlist-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .wishlist-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .wishlist-button:active {
          transform: translateY(0);
        }
        
        /* Hide scrollbar for mobile tab slider */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `,
        }}
      />
      <Navigation />

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-muted-brown mb-8 overflow-x-auto whitespace-nowrap">
            <Link
              to="/"
              className="hover:text-primary transition-colors flex-shrink-0"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-border" />
            <Link
              to="/shop"
              className="hover:text-primary transition-colors flex-shrink-0"
            >
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-border" />
            <span className="text-foreground font-medium flex-shrink-0">
              {product.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-warm-cream-light border border-border/20">
                <InnerImageZoom
                  src={selectedImage}
                  zoomSrc={selectedImage}
                  zoomType="hover"
                  zoomPreload={true}
                  className="w-full h-full"
                  imgAttributes={{
                    alt: product.name,
                    className: "w-full h-full object-cover",
                  }}
                />
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image: any, index) => (
                  <button
                    key={image.public_id}
                    onClick={() => setSelectedImage(image.url)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                      selectedImage === image.url
                        ? "border-primary"
                        : "border-border/30 hover:border-primary"
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Product Info */}
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <h1 className="font-sans text-xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-muted-brown mt-2 text-sm sm:text-lg">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.ratings.average)
                          ? "text-accent fill-accent"
                          : "text-border"
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">
                  {product.ratings.average.toFixed(1)}
                </span>
                <span className="text-sm text-muted-brown">
                  {product.ratings.numOfReviews} reviews
                </span>
              </div>

              {/* Volume for single-variant products */}
              {(!product.variants || product.variants.length === 0) &&
                product.specifications?.volume && (
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">
                      Volume:{" "}
                    </span>
                    <span className="text-muted-brown">
                      {product.specifications.volume}
                    </span>
                  </div>
                )}

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-2xl sm:text-3xl font-bold text-foreground">
                    {formatRupees(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-base sm:text-lg text-border line-through">
                      {formatRupees(originalPrice)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs sm:text-sm font-semibold inline-block">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Size Selector */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <SizeSelector
                    variants={product.variants}
                    selectedVariant={selectedVariant}
                    onVariantChange={(variant) => {
                      const fullVariant = product.variants?.find(
                        (v) =>
                          v.volume === variant.volume && v.sku === variant.sku
                      );
                      setSelectedVariant(fullVariant || null);
                    }}
                  />
                </div>
              )}

              {/* Stock Status */}
              {selectedVariant && (
                <div className="text-sm flex items-center gap-2">
                  {selectedVariant.stock > 0 &&
                  selectedVariant.stock <= selectedVariant.lowStockThreshold ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-accent" />
                      <span className="text-accent font-semibold">
                        Only {selectedVariant.stock} left in stock!
                      </span>
                    </>
                  ) : selectedVariant.stock > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-muted-brown">
                        {selectedVariant.stock} units available
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Add to Wishlist Button */}
                  <Button
                    onClick={handleLikeClick}
                    className={cn(
                      "flex-1 bg-primary text-white rounded-lg wishlist-button",
                      wishlistAnimation && "animate-heart-beat"
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5 mr-2 transition-all duration-100",
                        isLiked ? "fill-white text-white" : "text-white"
                      )}
                    />
                    {isLiked ? "Added to Wishlist" : "Add to Wishlist"}
                  </Button>

                  {/* Share Button */}
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-muted-brown hover:bg-primary/20 hover:text-primary"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5 mr-2" /> Share
                  </Button>
                </div>

                {/* Dynamic Cart Button */}
                {cartItemInfo.isInCart ? (
                  // Quantity Selector (Cart.tsx style with Add to Cart button dimensions)
                  <div className="w-full">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1 h-10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-16 p-0 rounded border-2 border-gray-300 hover:border-gray-400 bg-primary text-white touch-manipulation"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={
                            selectedVariant?.stock === 0 || isUpdatingQuantity
                          }
                        >
                          <Minus className="h-2 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-16 text-center border-t border-b py-1 h-10 flex items-center justify-center bg-slate-50">
                          {isUpdatingQuantity ? (
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-1 h-1 bg-mutedforeground rounded-full animate-pulse"></div>
                              <div
                                className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"
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
                          className="h-10 w-16 p-0 rounded border-2 border-gray-300 hover:border-gray-400 bg-primary text-white touch-manipulation"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={
                            selectedVariant?.stock === 0 ||
                            quantity >= (selectedVariant?.stock ?? 10) ||
                            isUpdatingQuantity
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Add to Cart Button
                  <Button
                    size="lg"
                    className="w-full h-10 bg-primary text-white hover:bg-primary/90 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 touch-manipulation"
                    onClick={handleAddToCart}
                    disabled={selectedVariant?.stock === 0 || isAdded}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isAdded ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span className="tracking-wide">Added to Cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5" />
                          <span className="tracking-wide">
                            {selectedVariant?.stock === 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </span>
                        </>
                      )}
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white border-t border-border/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Desktop Tab Navigation */}
            <div className="hidden md:block mb-6">
              <div className="border-b border-border/20">
                <div className="flex gap-8 -mb-px">
                  {[
                    { key: "description", label: "Description" },
                    { key: "ingredients", label: "Hero Ingredients" },
                    { key: "howto", label: "How to Use" },
                    { key: "benefits", label: "Benefits" },
                    { key: "suitable", label: "Suitable For" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "pb-4 px-1 font-semibold text-sm whitespace-nowrap transition-all duration-200 border-b-2",
                        activeTab === tab.key
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-brown hover:text-foreground hover:border-border/30"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Tab Slider */}
            <div className="md:hidden mb-6">
              <div className="relative">
                {/* Scroll indicators */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                {/* Tab slider container */}
                <div
                  ref={tabSliderRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {[
                    { key: "description", label: "Description" },
                    { key: "ingredients", label: "Hero Ingredients" },
                    { key: "howto", label: "How to Use" },
                    { key: "benefits", label: "Benefits" },
                    { key: "suitable", label: "Suitable For" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      data-tab={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 snap-start",
                        activeTab === tab.key
                          ? "bg-primary text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              {activeTab === "description" && (
                <ProductDescription
                  description={product.description}
                  specifications={product.specifications}
                />
              )}

              {activeTab === "ingredients" &&
                product.ingredients &&
                product.ingredients.length > 0 && (
                  <div className="space-y-6">
                    {/* Section Title */}
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Hero Ingredients
                      </h3>
                    </div>

                    {/* Ingredients Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.ingredients.map((ingredient: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-white border border-border/20 rounded-lg hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Left side: Circular ingredient image */}
                          {ingredient.image && (
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 rounded-full overflow-hidden bg-warm-cream-light border-2 border-border/30 shadow-sm">
                                <img
                                  src={ingredient.image.url}
                                  alt={ingredient.name || `Ingredient ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          {/* Right side: Ingredient name and description */}
                          <div className="flex-1 min-w-0">
                            {ingredient.name && (
                              <h4 className="font-bold text-foreground text-base mb-1">
                                {ingredient.name}
                              </h4>
                            )}
                            {ingredient.description && (
                              <p className="text-sm text-muted-brown leading-relaxed">
                                {ingredient.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "howto" &&
                product.howToUse &&
                product.howToUse.length > 0 && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    {/* Section Title */}
                    <div className="text-left mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        Follow These Steps
                      </h3>
                      <p className="text-sm text-muted-brown">
                        Simple instructions for best results
                      </p>
                    </div>

                    {/* Steps List */}
                    <div className="mx-auto space-y-2">
                      {product.howToUse.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 py-2 px-2 rounded-sm border border-border/20 hover:bg-warm-cream-light/30 transition-all duration-200 group"
                        >
                          {/* Step Number Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base shadow-sm group-hover:shadow-md transition-shadow duration-200">
                              {i + 1}
                            </div>
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-foreground text-sm md:text-base leading-relaxed font-medium">
                              {step}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "benefits" &&
                product.benefits &&
                product.benefits.length > 0 && (
                  <div className="space-y-6">
                    {/* Section Title */}
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Key Benefits
                      </h3>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.benefits.map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 bg-white border border-border/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                          {/* Checkmark Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Benefit Text */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground leading-relaxed">
                              {benefit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "suitable" &&
                product.suitableFor &&
                product.suitableFor.length > 0 && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    {/* Section Title */}
                    <div className="text-left mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        Suitable For
                      </h3>
                      <p className="text-sm text-muted-brown">
                        Perfect for these skin types and concerns
                      </p>
                    </div>

                    {/* Suitable For Badges */}
                    <div className="flex flex-wrap gap-3">
                      {product.suitableFor.map((suitable, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-in fade-in-0 slide-in-from-bottom-2"
                          style={{
                            animationDelay: `${i * 100}ms`,
                            animationFillMode: "both",
                          }}
                        >
                          <span className="whitespace-nowrap">{suitable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Show message when no content is available for the selected tab */}
              {activeTab === "ingredients" &&
                (!product.ingredients || product.ingredients.length === 0) && (
                  <p className="text-muted-brown text-center py-4">
                    No ingredient information available.
                  </p>
                )}
              {activeTab === "howto" &&
                (!product.howToUse || product.howToUse.length === 0) && (
                  <p className="text-muted-brown text-center py-4">
                    No usage instructions available.
                  </p>
                )}
              {activeTab === "benefits" &&
                (!product.benefits || product.benefits.length === 0) && (
                  <p className="text-muted-brown text-center py-4">
                    No benefits information available.
                  </p>
                )}
              {activeTab === "suitable" &&
                (!product.suitableFor || product.suitableFor.length === 0) && (
                  <p className="text-muted-brown text-center py-4">
                    No suitability information available.
                  </p>
                )}
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-12">
              <h2 className="font-sans text-xl font-bold text-foreground mb-2 text-center">
                — READ THE REVIEWS —
              </h2>
              <div className="text-center mt-8 mb-8">
                <Button
                  variant="outline"
                  className="border-border text-muted-brown hover:bg-primary/20 hover:text-primary"
                  onClick={() => reviewsRef.current?.toggleForm()}
                >
                  Write a Review
                </Button>
              </div>
              <div
                id="customer-reviews"
                className="mt-12 pt-12 border-t border-border/20"
              >
                <CustomerReviews
                  ref={reviewsRef}
                  productId={product._id}
                  productName={product.name}
                  initialReviews={allReviews}
                  isLoading={reviewsLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product && (
        <div className="bg-background">
          <div className="container mx-auto px-2 sm:px-4 py-12 max-w-full overflow-hidden">
            <div className="text-center mb-8">
              <h2 className="font-sans text-xl font-bold text-foreground mb-2">
                — You May Also Like —
              </h2>
            </div>
            <RelatedProducts currentProductId={product._id} />
          </div>
        </div>
      )}

      <Footer />
      <Dialog open={isShareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this product</DialogTitle>
            <DialogDescription>
              Copy the link below to share this product with others.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={window.location.href} readOnly />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copied to clipboard!" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
