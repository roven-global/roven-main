import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";
import Axios from "../utils/Axios";
import SummaryApi from "../common/summaryApi";
import { Skeleton } from "./ui/skeleton";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
  benefits?: string[];
  isFeatured?: boolean;
  createdAt: string;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Axios.get(SummaryApi.getFeaturedProducts.url);
        if (response.data.success) {
          setProducts(response.data.data);
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
  }, []);

  return (
    <section id="featured-products" className="pt-20 pb-20 -mt-4 bg-card/80">
      <div className="container mx-auto px-2 sm:px-4 max-w-full overflow-hidden">
        <div className="text-center mb-12">
          <h2 className="font-sans text-2xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured Products
          </h2>
          <p className="text-muted-brown text-sm sm:text-lg max-w-2xl mx-auto text-balance">
            Discover our handpicked selection of premium beauty products,
            crafted with the finest ingredients for exceptional results.
          </p>
        </div>

        {loading ? (
          <div className="-mx-4 md:mx-0">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-2 md:pl-4 basis-3/4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <div className="space-y-4">
                      <Skeleton className="h-72 w-full bg-soft-beige rounded-lg" />
                      <Skeleton className="h-4 w-5/6 bg-soft-beige rounded-md" />
                      <Skeleton className="h-4 w-1/2 bg-soft-beige rounded-md" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : (
          <div className="-mx-4 md:mx-0">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {products.map((product) => (
                  <CarouselItem
                    key={product._id}
                    className="pl-2 md:pl-4 basis-3/4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
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
                      benefits={product.benefits}
                      isNew={
                        new Date(product.createdAt) >
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      }
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/shop">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-border text-muted-foreground bg-transparent hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-full px-8 py-6 text-sm sm:text-base font-semibold"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
