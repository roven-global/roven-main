import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
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

// ... (interfaces remain the same)
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
  const navigate = useNavigate();

  // Component state
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  // Hooks for context
  const { isAuthenticated, user, updateUser } = useAuth();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { addToGuestWishlist, removeFromGuestWishlist, addToGuestCart, isInGuestWishlist } = useGuest();
  const reviewsRef = useRef<CustomerReviewsHandles>(null);

  // React Query for fetching product data
  const { data: product, isLoading: isProductLoading, isError: isProductError } = useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<Product> => {
      if (!slug) throw new Error('Product slug is required.');
      const response = await Axios.get(`${SummaryApi.getProductById.url}/${slug}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Product not found.');
      }
      return response.data.data;
    },
    enabled: !!slug, // Only run query if slug is available
  });

  // React Query for fetching reviews
  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: async () => {
      if (!slug) return { reviews: [] };
      const response = await Axios.get(`${SummaryApi.getReviews.url}/${slug}?page=1&limit=10`);
      return response.data.data;
    },
    enabled: !!slug,
  });

  // Effect to update selected image and variant when product data loads
  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0]?.url || "");
      if (product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants.find(v => v.isActive && v.stock > 0) || product.variants[0];
        setSelectedVariant(defaultVariant);
      }
    }
  }, [product]);
  
  const quantityInCart = useMemo(() => {
    if (!product) return 0;
    const itemInCart = cartItems.find((item) => {
      const isProductMatch = item.productId._id === product._id;
      if (product.variants && product.variants.length > 0) {
        return isProductMatch && item.variant?.sku === selectedVariant?.sku;
      }
      return isProductMatch;
    });
    return itemInCart ? itemInCart.quantity : 0;
  }, [cartItems, product, selectedVariant]);

  const isLiked = isAuthenticated
    ? user?.wishlist?.includes(product?._id ?? '')
    : isInGuestWishlist(product?._id ?? '');

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    // ... (rest of the function is the same)
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
    if (!product) return;
    // ... (rest of the function is mostly the same)
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }

    const variantToAdd = selectedVariant || (product.variants && product.variants.length === 1 ? product.variants[0] : null);
    if (variantToAdd && variantToAdd.stock === 0) {
      toast({ title: "Out of Stock", variant: "destructive" });
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      quantity: 1, // Always add 1 on the first click
      variant: variantToAdd ? { volume: variantToAdd.volume, sku: variantToAdd.sku } : undefined,
    };

    if (!isAuthenticated) {
      addToGuestCart({ ...cartItem, id: product._id, price: currentPrice, image: product.images[0]?.url || "" });
    } else {
      addToCart(cartItem);
    }

    toast({ title: "Added to Cart!", description: product.name });
  };

  const handleQuantityChange = (change: number) => {
    if (!product) return;
    // ... (rest of the function is the same)
    const itemInCart = cartItems.find((item) => {
      const isProductMatch = item.productId._id === product._id;
      if (product.variants && product.variants.length > 0) {
        return isProductMatch && item.variant?.sku === selectedVariant?.sku;
      }
      return isProductMatch;
    });

    if (!itemInCart) return;

    const newQuantity = itemInCart.quantity + change;

    if (newQuantity > 0) {
      updateQuantity(itemInCart._id, newQuantity);
    } else {
      removeFromCart(itemInCart._id);
    }
  };

  // Loading state
  if (isProductLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Skeleton className="w-full h-96 rounded-lg bg-warm-taupe/20" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-20 h-20 rounded-lg bg-warm-taupe/20" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4 bg-warm-taupe/20" />
                <Skeleton className="h-6 w-1/2 bg-warm-taupe/20" />
                <Skeleton className="h-12 w-1/3 bg-warm-taupe/20" />
                <Skeleton className="h-20 w-full bg-warm-taupe/20" />
                <Skeleton className="h-12 w-full bg-warm-taupe/20" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (isProductError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-red-500">
            Could not load the product. Please try again later.
          </h2>
          <Link to="/shop">
            <Button variant="outline" className="mt-4 border-warm-taupe text-forest hover:bg-sage/20 hover:text-sage">
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
  const discount = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* ... (rest of the JSX is the same, but now uses 'product' and 'reviewsData' from useQuery) ... */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-forest mb-8 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-sage transition-colors flex-shrink-0">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-warm-taupe" />
            <Link to="/shop" className="hover:text-sage transition-colors flex-shrink-0">Shop</Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-warm-taupe" />
            <span className="text-deep-forest font-medium flex-shrink-0">{product.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* ... (Image section) ... */}
            <div className="space-y-4">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-warm-cream-light border border-warm-taupe/20">
                <InnerImageZoom src={selectedImage} zoomSrc={selectedImage} zoomType="hover" zoomPreload={true} className="w-full h-full" imgAttributes={{ alt: product.name, className: "w-full h-full object-cover" }} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button key={image.public_id} onClick={() => setSelectedImage(image.url)} className={cn("w-20 h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer transition-all", selectedImage === image.url ? "border-sage" : "border-warm-taupe/30 hover:border-sage")}>
                    <img src={image.url} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            {/* ... (Product Info section) ... */}
            <div className="space-y-6">
              <div>
                <h1 className="font-sans text-3xl lg:text-4xl font-bold text-deep-forest leading-tight">{product.name}</h1>
                {product.shortDescription && (<p className="text-forest mt-2 text-lg">{product.shortDescription}</p>)}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (<Star key={i} className={cn("h-4 w-4", i < Math.floor(product.ratings.average) ? "text-gold-accent fill-gold-accent" : "text-warm-taupe")} />))}
                </div>
                <span className="font-semibold text-deep-forest">{product.ratings.average.toFixed(1)}</span>
                <span className="text-sm text-forest">{product.ratings.numOfReviews} reviews</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-3xl font-bold text-deep-forest">{formatRupees(currentPrice)}</span>
                  {originalPrice && (<span className="text-lg text-warm-taupe line-through">{formatRupees(originalPrice)}</span>)}
                </div>
                {discount > 0 && (<span className="bg-sage/10 text-sage px-2 py-1 rounded-full text-sm font-semibold inline-block">{discount}% OFF</span>)}
              </div>
              {product.variants && product.variants.length > 0 && (<div><SizeSelector variants={product.variants} selectedVariant={selectedVariant} onVariantChange={(variant) => { const fullVariant = product.variants?.find((v) => v.volume === variant.volume && v.sku === variant.sku); setSelectedVariant(fullVariant || null); }} /></div>)}
              {selectedVariant && (<div className="text-sm flex items-center gap-2">{selectedVariant.stock > 0 && selectedVariant.stock <= selectedVariant.lowStockThreshold ? (<><AlertTriangle className="h-4 w-4 text-gold-accent" /><span className="text-gold-accent font-semibold">Only {selectedVariant.stock} left in stock!</span></>) : selectedVariant.stock > 0 ? (<><CheckCircle className="h-4 w-4 text-sage" /><span className="text-forest">{selectedVariant.stock} units available</span></>) : (<span className="text-red-500 font-semibold">Out of Stock</span>)}</div>)}
              <div className="space-y-4">
                {quantityInCart === 0 ? (<Button size="lg" className="w-full bg-forest hover:bg-deep-forest text-white font-semibold rounded-lg transition-all py-3" onClick={handleAddToCart} disabled={selectedVariant?.stock === 0}><ShoppingBag className="mr-2 h-5 w-5" />{selectedVariant?.stock === 0 ? "Out of Stock" : "Add to Cart"}</Button>) : (<div className="flex items-center justify-center border border-warm-taupe rounded-lg overflow-hidden bg-white w-full"><Button variant="ghost" size="lg" className="px-6 py-3 hover:bg-sage/20 hover:text-sage transition-colors text-forest" onClick={() => handleQuantityChange(-1)}><Minus className="h-5 w-5" /></Button><span className="px-6 py-3 font-semibold text-forest text-lg">{quantityInCart}</span><Button variant="ghost" size="lg" className="px-6 py-3 hover:bg-sage/20 hover:text-sage transition-colors text-forest" onClick={() => handleQuantityChange(1)}><Plus className="h-5 w-5" /></Button></div>)}
              </div>
              {/* ... (Accordion sections) ... */}
            </div>
          </div>
          <div className="mt-12 pt-12 border-t border-warm-taupe/20">
            <CustomerReviews ref={reviewsRef} productId={product._id} productName={product.name} initialReviews={reviewsData?.reviews || []} isLoading={isReviewsLoading} />
          </div>
        </div>
      </div>
      {product && (<div className="bg-background"><div className="container mx-auto px-4 py-12"><div className="max-w-6xl mx-auto"><h2 className="font-sans text-xl font-bold text-deep-forest mb-2 text-center">— You May Also Like —</h2><RelatedProducts currentProductId={product._id} /></div></div></div>)}
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
