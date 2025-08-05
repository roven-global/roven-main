import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

// Define the Category interface for type safety
interface Category {
  _id: string;
  name: string;
  slug: string;
  image: {
    url: string;
  };
  description?: string; // Optional description
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the main categories from the backend when the component mounts.
   */
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch only top-level categories for the homepage display
        const response = await Axios.get(`${SummaryApi.getAllCategories.url}?parent=main&limit=3`);
        if (response.data.success) {
          setCategories(response.data.data);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } catch (err) {
        setError('Could not load categories.');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section id="categories" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our curated collections designed for your beauty journey
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Card key={category._id} className="group cursor-pointer overflow-hidden hover:shadow-elegant transition-all duration-300">
                <Link to={`/category/${category.slug}`} className="block">
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="font-playfair text-3xl font-bold mb-2">
                        {category.name}
                      </h3>
                      <p className="text-white/90 mb-4 line-clamp-2">
                        {category.description || `Explore our ${category.name} collection`}
                      </p>
                      <Button variant="hero" className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        Shop Now
                      </Button>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;