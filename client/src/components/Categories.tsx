import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import CategorySection from "./CategorySection";
import { Skeleton } from "./ui/skeleton";

// Define the Category interface for type safety
interface Category {
  _id: string;
  name: string;
  slug: string;
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

  useEffect(() => {
    const fetchCategoriesAndProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch top-level categories
        const categoriesResponse = await Axios.get(
          `${SummaryApi.getAllCategories.url}?parent=main&limit=3`
        );
        if (!categoriesResponse.data.success) {
          throw new Error("Failed to fetch categories");
        }
        const categories: Category[] = categoriesResponse.data.data;

        // Fetch products for each category
        const categoriesData = await Promise.all(
          categories.map(async (category) => {
            const productsResponse = await Axios.get(
              `${SummaryApi.getAllProducts.url}?category=${category._id}&limit=4`
            );
            const products = productsResponse.data.success
              ? productsResponse.data.data.products
              : [];
            return { ...category, products };
          })
        );

        setCategoriesWithProducts(categoriesData);
      } catch (err) {
        setError("Could not load categories or products.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndProducts();
  }, []);

  return (
    <section id="categories" className="py-20 bg-gray-50">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our curated collections, each designed to elevate your
            unique beauty journey.
          </p>
        </div>

        {loading ? (
          <div className="space-y-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-8">
                <Skeleton className="h-10 w-1/3 bg-gray-200" />
                {/* Mobile: Grid layout skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 md:gap-6">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-64 w-full bg-gray-200" />
                      <Skeleton className="h-4 w-2/3 bg-gray-200" />
                      <Skeleton className="h-4 w-1/2 bg-gray-200" />
                    </div>
                  ))}
                </div>
                {/* Desktop: Horizontal scroll skeleton */}
                <div className="hidden md:flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex-shrink-0 w-64 sm:w-72 md:w-80 space-y-2"
                    >
                      <Skeleton className="h-72 w-full bg-gray-200 rounded-lg" />
                      <Skeleton className="h-4 w-5/6 bg-gray-200 rounded-md" />
                      <Skeleton className="h-4 w-1/2 bg-gray-200 rounded-md" />
                    </div>
                  ))}
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
