import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Define the Product interface for type safety
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
  };
  volume?: string;
  shortDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const CategoryProductsPage = () => {
  // This now correctly reads the 'slug' from the URL, as defined in your App.tsx router
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If slug is not present in the URL, stop loading and show an error.
    if (!slug) {
      setLoading(false);
      setError("Category not specified in the URL.");
      return;
    }

    const fetchProductsByCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        // This API call now uses the slug, which matches the backend controller.
        const response = await Axios.get(
          `${SummaryApi.getProductsByCategory.url}/${slug}`
        );

        // Check for a successful response and the presence of data
        if (response.data && response.data.success && response.data.data) {
          const productsData = response.data.data.products || [];
          const categoryData = response.data.data.category;

          setProducts(productsData);
          setCategoryName(categoryData ? categoryData.name : "Category");
        } else {
          // If the API returns a non-success status, use its message
          throw new Error(
            response.data.message ||
              "Failed to fetch products for this category."
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Could not load products. ${errorMessage}`);
        console.error("Error fetching products by category:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [slug]); // The component will re-fetch data whenever the slug in the URL changes.

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <section className="relative bg-gradient-to-br from-primary/10 via-muted-brown/10 to-foreground/10 py-8 sm:py-20">
          <div className="container mx-auto px-4">
            {/* Back button positioned at top-left */}
            <div className="mb-4 sm:mb-8 pt-2 -mt-4">
              <Link to="/#categories" className="inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Back to Categories</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </div>

            {/* Centered title */}
            <div className="text-center">
              {loading ? (
                <Skeleton className="h-8 sm:h-12 w-1/3 mx-auto" />
              ) : (
                <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {categoryName || "Category"}
                </h1>
              )}
            </div>
          </div>
        </section>

        <section className="py-4 sm:py-8 bg-background">
          <div className="container mx-auto px-2">
            {loading ? (
              <div className="grid gap-2 sm:gap-2 lg:gap-3 grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-10">{error}</div>
            ) : products.length > 0 ? (
              <div className="grid gap-2 sm:gap-2 lg:gap-3 grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  const isNew = new Date(product.createdAt) > thirtyDaysAgo;

                  return (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={
                        product.images && product.images[0]
                          ? product.images[0].url
                          : ""
                      }
                      rating={product.ratings ? product.ratings.average : 0}
                      reviews={
                        product.ratings ? product.ratings.numOfReviews : 0
                      }
                      category={product.category ? product.category.name : ""}
                      specifications={
                        product.volume ? { volume: product.volume } : undefined
                      }
                      isSale={
                        !!(
                          product.originalPrice &&
                          product.originalPrice > product.price
                        )
                      }
                      isNew={isNew}
                      shortDescription={product.shortDescription}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-20">
                <h3 className="text-lg font-semibold mb-2">
                  No Products Found
                </h3>
                <p>
                  There are currently no products available in this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProductsPage;
