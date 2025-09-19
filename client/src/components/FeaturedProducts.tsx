import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";
import Axios from "../utils/Axios";
import SummaryApi from "../common/summaryApi";
import { Skeleton } from "./ui/skeleton";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define the Product interface to match the data structure from the backend.
interface Product {
  _id: string;
  name: string;
  slug: string; // Added slug to the interface
  price: number;
  originalPrice?: number;
  images: Array<{ url: string }>;
  ratings: {
    average: number;
    numOfReviews: number;
  };
  category: {
    _id: string;
    name: string;
  };
  volume?: string;
  variants?: Array<{
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
  }>;
  shortDescription?: string;
  isFeatured?: boolean;
  ranking_featured?: number;
  createdAt: string;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Add timestamp to prevent caching
        const response = await Axios.get(
          `${SummaryApi.getFeaturedProducts.url}?t=${Date.now()}`
        );
        if (response.data.success) {
          // Handle both old and new response structures
          const products = response.data.data.products || response.data.data;
          const enabled = response.data.isEnabled !== false; // Default to true if not specified

          // Debug: Log the order of products received from backend
          console.log(
            "Featured products order from backend:",
            products.map((p) => ({
              name: p.name,
              isFeatured: p.isFeatured,
              ranking_featured: p.ranking_featured,
              isActive: p.isActive,
            }))
          );

          // Safety filter: Only show products that are truly featured
          const validFeaturedProducts = products.filter(
            (product) =>
              product.isFeatured === true &&
              product.isActive === true &&
              product.ranking_featured > 0
          );

          console.log(
            "Valid featured products after frontend filtering:",
            validFeaturedProducts.map((p) => ({
              name: p.name,
              isFeatured: p.isFeatured,
              ranking_featured: p.ranking_featured,
              isActive: p.isActive,
            }))
          );

          setProducts(validFeaturedProducts);
          setIsEnabled(enabled);
        } else {
          throw new Error("Failed to fetch featured products");
        }
      } catch (err) {
        setError("Could not load products. Please try again later.");
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();

    // Listen for product updates from admin panel
    const handleProductUpdate = () => {
      console.log(
        "Product update event received in FeaturedProducts, refreshing featured products..."
      );
      fetchFeaturedProducts();
    };

    window.addEventListener("productUpdated", handleProductUpdate);

    return () => {
      window.removeEventListener("productUpdated", handleProductUpdate);
    };
  }, []);

  // Check for overflow when products change
  useEffect(() => {
    const checkOverflow = () => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        const isOverflowing =
          scrollContainer.scrollWidth > scrollContainer.clientWidth;
        setIsOverflowing(isOverflowing);
      }
    };

    // Check overflow after products are loaded and rendered
    if (products.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(checkOverflow, 100);
    }

    // Also check on window resize
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [products]);

  // Scroll functions for arrow buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Scroll by approximately one card width + gap
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Scroll by approximately one card width + gap
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Function to determine the layout class based on product count
  const getLayoutClass = (productCount: number) => {
    if (productCount === 1) return "single-product";
    if (productCount === 2) return "two-products";
    if (productCount === 3) return "three-products";
    return "multiple-products";
  };

  // Function to return products in the exact order received from backend
  // Backend already sorts by ranking_featured (ascending), so we use that order directly
  const getOrderedProducts = (products: Product[]) => {
    // Return products in the exact order they come from the backend
    // Backend sorts by ranking_featured: 1, so rank 1 is first, rank 2 is second, etc.
    return products;
  };

  // If the featured products section is disabled, don't render anything
  if (!isEnabled) {
    return null;
  }

  return (
    <section
      id="featured-products"
      className="featured-products pt-8 lg:pt-12 pb-20 bg-card/80"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-2 max-w-full overflow-hidden">
        <div className="text-center mb-6 lg:mb-5 px-4 sm:px-6 lg:px-8">
          <h2 className="featured-products-title font-sans text-2xl sm:text-3xl lg:text-3xl xl:text-[28px] font-bold text-foreground mb-4 lg:mb-4">
            Featured Products
          </h2>
          <p className="featured-products-description text-foreground/80 text-base sm:text-lg lg:text-lg leading-relaxed max-w-[600px] sm:max-w-[700px] mx-auto text-center">
            Discover our handpicked selection of premium beauty products,
            crafted with the finest ingredients for exceptional results.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[280px] h-[400px] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  <Skeleton className="w-full h-[200px] bg-gray-200" />
                  <div className="p-4 flex flex-col justify-between h-[200px]">
                    <div>
                      <Skeleton className="h-6 w-full bg-gray-200 rounded mb-2" />
                      <Skeleton className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                      <Skeleton className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
                      <Skeleton className="h-5 w-1/3 bg-gray-200 rounded mb-4" />
                    </div>
                    <Skeleton className="h-12 w-full bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : (
          <div className="featured-products-horizontal-container px-0">
            <div
              ref={scrollContainerRef}
              className={`featured-products-horizontal-scroll ${
                isOverflowing ? "overflowing" : ""
              }`}
            >
              {getOrderedProducts(products).map((product, index) => {
                return (
                  <div
                    key={product._id}
                    className="featured-product-wrapper-horizontal"
                  >
                    <ProductCard
                      id={product._id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.images[0]?.url || ""}
                      rating={product.ratings.average}
                      reviews={product.ratings.numOfReviews}
                      category={product.category.name}
                      specifications={
                        product.volume ? { volume: product.volume } : undefined
                      }
                      variants={product.variants}
                      isSale={
                        !!(
                          product.originalPrice &&
                          product.originalPrice > product.price
                        )
                      }
                      shortDescription={product.shortDescription}
                      isNew={
                        new Date(product.createdAt) >
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Left scroll button */}
            {isOverflowing && (
              <button
                onClick={scrollLeft}
                className="scroll-arrow scroll-arrow-left"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* View All Products link - centered */}
            <Link to="/shop">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-border text-muted-foreground bg-transparent hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-full px-8 py-6 text-sm sm:text-base font-semibold"
              >
                View All Products
              </Button>
            </Link>

            {/* Right scroll button */}
            {isOverflowing && (
              <button
                onClick={scrollRight}
                className="scroll-arrow scroll-arrow-right"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
