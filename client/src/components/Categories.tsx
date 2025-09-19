import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import CategorySection from "./CategorySection";
import { Skeleton } from "./ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Define the Category interface for type safety
interface Category {
  _id: string;
  name: string;
  slug: string;
  categoryRanking?: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
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
    slug: string;
  };
  brand: string;
  volume?: string;
  specifications?: {
    volume?: string;
    skinType?: string | string[];
    hairType?: string | string[];
  };
  benefits?: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  variants?: Array<{
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
  }>;
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

const Categories = () => {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<
    CategoryWithProducts[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true); // New state for toggle status

  useEffect(() => {
    const fetchCategoriesAndProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // First check if category section is enabled
        const categorySettingResponse = await Axios.get(
          SummaryApi.getAdminSetting.url.replace(":key", "is_category_enabled")
        );

        if (categorySettingResponse.data.success) {
          const isCategoryEnabled = categorySettingResponse.data.data.value;
          setIsEnabled(isCategoryEnabled);

          // If category section is disabled, don't fetch data
          if (!isCategoryEnabled) {
            setLoading(false);
            return;
          }
        } else {
          // Default to enabled if setting not found
          setIsEnabled(true);
        }

        // Fetch top-level categories for homepage (exclude rank 0)
        const categoriesResponse = await Axios.get(
          `${SummaryApi.getAllCategories.url}?parent=main&homepage=true&limit=3`
        );
        if (!categoriesResponse.data.success) {
          throw new Error("Failed to fetch categories");
        }
        const categories: Category[] = categoriesResponse.data.data;

        // Fetch products for each category
        const categoriesData = await Promise.all(
          categories.map(async (category) => {
            const productsResponse = await Axios.get(
              `${SummaryApi.getAllProducts.url}?category=${category._id}&limit=4&sortBy=createdAt&sortOrder=desc`
            );
            const products = productsResponse.data.success
              ? productsResponse.data.data.products
              : [];
            return { ...category, products };
          })
        );

        // Categories are already sorted by backend (categoryRanking ascending)
        setCategoriesWithProducts(categoriesData);
      } catch (err) {
        setError("Could not load categories or products.");
        console.error("Error fetching data:", err);
        // Default to enabled on error
        setIsEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndProducts();

    // Listen for category updates from admin panel
    const handleCategoriesUpdate = () => {
      console.log(
        "Categories update event received, refreshing categories and products..."
      );
      fetchCategoriesAndProducts();
    };

    // Listen for product updates from admin panel
    const handleProductUpdate = () => {
      console.log(
        "Product update event received in Categories, refreshing categories and products..."
      );
      fetchCategoriesAndProducts();
    };

    window.addEventListener("categoriesUpdated", handleCategoriesUpdate);
    window.addEventListener("productUpdated", handleProductUpdate);

    return () => {
      window.removeEventListener("categoriesUpdated", handleCategoriesUpdate);
      window.removeEventListener("productUpdated", handleProductUpdate);
    };
  }, []);

  // If the category section is disabled, don't render anything
  if (!isEnabled) {
    return null;
  }

  return (
    <section id="categories" className="py-20 bg-gray-50">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-sans text-2xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto">
            Explore our curated collections, each designed to elevate your
            unique beauty journey.
          </p>
        </div>

        {loading ? (
          <div className="space-y-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-8">
                <Skeleton className="h-10 w-1/3 bg-gray-200" />
                {/* Mobile: Carousel skeleton */}
                <div className="md:hidden -mx-4">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                        stopOnInteraction: false,
                      }),
                    ]}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <CarouselItem key={j} className="pl-2 basis-3/4">
                          <div className="space-y-2">
                            <Skeleton className="h-64 w-full bg-gray-200" />
                            <Skeleton className="h-4 w-2/3 bg-gray-200" />
                            <Skeleton className="h-4 w-1/2 bg-gray-200" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden" />
                    <CarouselNext className="hidden" />
                  </Carousel>
                </div>
                {/* Desktop: Carousel skeleton */}
                <div className="hidden md:block">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                        stopOnInteraction: false,
                      }),
                    ]}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <CarouselItem
                          key={j}
                          className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                        >
                          <div className="space-y-2">
                            <Skeleton className="h-72 w-full bg-gray-200 rounded-lg" />
                            <Skeleton className="h-4 w-5/6 bg-gray-200 rounded-md" />
                            <Skeleton className="h-4 w-1/2 bg-gray-200 rounded-md" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden" />
                    <CarouselNext className="hidden" />
                  </Carousel>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <div className="space-y-16">
            {categoriesWithProducts.map((category, index) => (
              <CategorySection
                key={category._id}
                category={category}
                products={category.products}
                theme={
                  index === 0
                    ? "primary"
                    : index === 1
                    ? "secondary"
                    : index === 2
                    ? "accent"
                    : index === 3
                    ? "warm"
                    : index === 4
                    ? "cool"
                    : "neutral"
                }
                // You can also use custom colors like this:
                // theme="custom"
                // customBgColor="bg-gradient-to-r from-pink-50 to-rose-50"
                // customTextColor="text-pink-900"
                // customBorderColor="border-pink-200"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
