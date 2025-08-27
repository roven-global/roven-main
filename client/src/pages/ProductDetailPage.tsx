import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const reviewsRef = useRef<CustomerReviewsHandles>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const {
    addToGuestWishlist,
    removeFromGuestWishlist,
    addToGuestCart,
    isInGuestWishlist,
  } = useGuest();

  const isLiked = isAuthenticated
    ? user?.wishlist?.includes(product?._id)
    : isInGuestWishlist(product?._id || "");

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

  if (loading) {
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
                    <Skeleton
                      key={i}
                      className="w-20 h-20 rounded-lg bg-warm-taupe/20"
                    />
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-red-500">
            {error || "Product not found."}
          </h2>
          <Link to="/shop">
            <Button
              variant="outline"
              className="mt-4 border-warm-taupe text-forest hover:bg-sage/20 hover:text-sage"
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-forest mb-8 overflow-x-auto whitespace-nowrap">
            <Link
              to="/"
              className="hover:text-sage transition-colors flex-shrink-0"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-warm-taupe" />
            <Link
              to="/shop"
              className="hover:text-sage transition-colors flex-shrink-0"
            >
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0 text-warm-taupe" />
            <span className="text-deep-forest font-medium flex-shrink-0">
              {product.name}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-warm-cream-light border border-warm-taupe/20">
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
                        ? "border-sage"
                        : "border-warm-taupe/30 hover:border-sage"
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
                <h1 className="font-sans text-3xl lg:text-4xl font-bold text-deep-forest leading-tight">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-forest mt-2 text-lg">
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
                          ? "text-gold-accent fill-gold-accent"
                          : "text-warm-taupe"
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold text-deep-forest">
                  {product.ratings.average.toFixed(1)}
                </span>
                <span className="text-sm text-forest">
                  {product.ratings.numOfReviews} reviews
                </span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-3xl font-bold text-deep-forest">
                    {formatRupees(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-lg text-warm-taupe line-through">
                      {formatRupees(originalPrice)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="bg-sage/10 text-sage px-2 py-1 rounded-full text-sm font-semibold inline-block">
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
                      <AlertTriangle className="h-4 w-4 text-gold-accent" />
                      <span className="text-gold-accent font-semibold">
                        Only {selectedVariant.stock} left in stock!
                      </span>
                    </>
                  ) : selectedVariant.stock > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-sage" />
                      <span className="text-forest">In Stock</span>
                    </>
                  ) : (
                    <span className="text-red-500 font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-warm-taupe rounded-lg overflow-hidden bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-3 py-2 hover:bg-sage/20 hover:text-sage transition-colors text-forest"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 font-semibold text-forest min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-3 py-2 hover:bg-sage/20 hover:text-sage transition-colors text-forest"
                      onClick={() =>
                        setQuantity(
                          Math.min(selectedVariant?.stock ?? 10, quantity + 1)
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Wishlist Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-lg h-10 w-10 transition-colors border-warm-taupe",
                      isLiked
                        ? "bg-gold-accent/20 text-gold-accent border-gold-accent/30"
                        : "hover:bg-sage/20 hover:text-sage text-forest"
                    )}
                    onClick={handleLikeClick}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isLiked
                          ? "fill-gold-accent text-gold-accent"
                          : "text-forest"
                      )}
                    />
                  </Button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  size="lg"
                  className="w-full bg-forest hover:bg-deep-forest text-white font-semibold rounded-lg transition-all py-3"
                  onClick={handleAddToCart}
                  disabled={selectedVariant?.stock === 0 || isAdded}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      {selectedVariant?.stock === 0
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </>
                  )}
                </Button>
              </div>

              {/* What Makes It Good */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="what-makes-it-good"
                  className="border border-sage/20 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="text-lg font-semibold text-deep-forest px-6 py-4 hover:no-underline bg-sage/5">
                    What Makes It Good
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-6 bg-white">
                    <p className="text-forest text-sm leading-relaxed">
                      {product.description.split(".").slice(0, 2).join(".")}.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Additional Product Details */}
              <Accordion type="multiple" className="w-full space-y-3">
                {/* How to Use */}
                {product.howToUse && product.howToUse.length > 0 && (
                  <AccordionItem
                    value="how-to-use"
                    className="border border-sage/20 rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="text-lg font-semibold text-deep-forest px-6 py-4 hover:no-underline bg-sage/5">
                      How to Use
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-6 bg-white">
                      <ol className="list-decimal pl-5 space-y-2 text-forest text-sm">
                        {product.howToUse.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Benefits */}
                {product.benefits && product.benefits.length > 0 && (
                  <AccordionItem
                    value="benefits"
                    className="border border-sage/20 rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="text-lg font-semibold text-deep-forest px-6 py-4 hover:no-underline bg-sage/5">
                      Benefits
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-6 bg-white">
                      <ul className="list-disc pl-5 space-y-2 text-forest text-sm">
                        {product.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Specifications */}
                {product.specifications &&
                  Object.keys(product.specifications).length > 0 && (
                    <AccordionItem
                      value="specifications"
                      className="border border-sage/20 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="text-lg font-semibold text-deep-forest px-6 py-4 hover:no-underline bg-sage/5">
                        Specifications
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-6 bg-white">
                        <dl className="divide-y divide-sage/20">
                          {Object.entries(product.specifications).map(
                            ([key, value]) => (
                              <div key={key} className="flex py-3">
                                <dt className="w-1/3 font-semibold text-deep-forest capitalize text-sm">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </dt>
                                <dd className="w-2/3 text-forest text-sm">
                                  {Array.isArray(value) ? (
                                    <div className="flex flex-wrap gap-1">
                                      {value.map((item, index) => (
                                        <span
                                          key={index}
                                          className="inline-block bg-sage/10 text-sage px-2 py-1 rounded-full text-xs font-medium"
                                        >
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    value
                                  )}
                                </dd>
                              </div>
                            )
                          )}
                        </dl>
                      </AccordionContent>
                    </AccordionItem>
                  )}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white border-t border-warm-taupe/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Accordion
              type="multiple"
              defaultValue={["item-2"]}
              className="w-full space-y-4"
            >
              {/* Hero Ingredients */}
              {product.ingredients && product.ingredients.length > 0 && (
                <AccordionItem
                  value="item-2"
                  className="border border-warm-taupe/20 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="text-xl font-sans font-bold text-deep-forest px-6 py-4 hover:no-underline bg-sage/5">
                    Hero Ingredients
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-6 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {product.ingredients.map((ingredient: any, i: number) => (
                        <div key={i} className="text-center space-y-3">
                          {ingredient.image && (
                            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-warm-cream-light">
                              <img
                                src={ingredient.image.url}
                                alt={ingredient.name || `Ingredient ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {ingredient.name && (
                            <h4 className="font-semibold text-deep-forest">
                              {ingredient.name}
                            </h4>
                          )}
                          {ingredient.description && (
                            <p className="text-sm text-forest leading-relaxed">
                              {ingredient.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Customer Reviews Section */}
            <div className="mt-12">
              <div className="text-center">
                <h2 className="font-sans text-xl font-bold text-deep-forest mb-2">
                  — READ THE REVIEWS —
                </h2>
                <button
                  onClick={() => {
                    const reviewsSection =
                      document.getElementById("customer-reviews");
                    if (reviewsSection) {
                      reviewsSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="text-forest hover:text-sage text-sm cursor-pointer hover:underline transition-colors"
                >
                  See All
                </button>
              </div>
              <div className="text-center mt-8 mb-8">
                <Button
                  variant="outline"
                  className="border-warm-taupe text-forest hover:bg-sage/20 hover:text-sage"
                  onClick={() => reviewsRef.current?.toggleForm()}
                >
                  Write a Review
                </Button>
              </div>
              <div
                id="customer-reviews"
                className="mt-12 pt-12 border-t border-warm-taupe/20"
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
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-sans text-xl font-bold text-deep-forest mb-2 text-center">
                — You May Also Like —
              </h2>
              <RelatedProducts currentProductId={product._id} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
