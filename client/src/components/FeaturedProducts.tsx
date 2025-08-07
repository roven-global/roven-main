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
  benefits?: string[];
  isFeatured?: boolean;
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
    <section id="featured-products" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            Featured Products
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our handpicked selection of premium beauty products,
            crafted with the finest ingredients for exceptional results.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                slug={product.slug} // Passing the slug to the ProductCard
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.images[0]?.url || ''}
                rating={product.ratings.average}
                reviews={product.ratings.numOfReviews}
                category={product.category.name}
                volume={product.volume}
                isSale={product.originalPrice && product.originalPrice > product.price}
                benefits={product.benefits}
              />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/shop">
            <Button size="lg" variant="outline" className="px-8">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;