import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";
import Axios from '../utils/Axios';
import SummaryApi from '../common/summaryApi';
import { Skeleton } from "./ui/skeleton";
import { Link } from "react-router-dom";

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
    <section id="featured-products" className="py-20 bg-gradient-to-br from-sage/5 via-white to-sage/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-deep-forest mb-4">
            Featured Products
          </h2>
          <p className="text-forest text-lg max-w-2xl mx-auto text-balance">
            Discover our handpicked selection of premium beauty products,
            crafted with the finest ingredients for exceptional results.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-72 w-full bg-soft-beige rounded-lg" />
                <Skeleton className="h-4 w-5/6 bg-soft-beige rounded-md" />
                <Skeleton className="h-4 w-1/2 bg-soft-beige rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 mb-12">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.images[0]?.url || ''}
                rating={product.ratings.average}
                reviews={product.ratings.numOfReviews}
                category={product.category.name}
                volume={product.volume}
                variants={product.variants}
                isSale={!!(product.originalPrice && product.originalPrice > product.price)}
                benefits={product.benefits}
                isNew={new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                hideAddToCart={true}
              />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/shop">
            <Button size="lg" variant="outline" className="border-2 border-warm-taupe text-forest bg-transparent hover:bg-warm-taupe/20 hover:border-warm-taupe transition-all duration-300 rounded-full px-8 py-6 text-base font-semibold">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;