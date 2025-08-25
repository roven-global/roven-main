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
    <section id="categories" className="py-20 bg-gradient-to-br from-sage/10 via-forest/5 to-sage/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-deep-forest mb-4">
            Shop by Category
          </h2>
          <p className="text-forest text-lg max-w-2xl mx-auto text-balance">
            Explore our curated collections, each designed to elevate your unique beauty journey.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-96 w-full bg-sage/20 rounded-lg" />
                <Skeleton className="h-6 w-3/4 bg-sage/20 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-10">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link key={category._id} to={`/category/${category.slug}`} className="block group">
                <Card className="overflow-hidden rounded-lg shadow-elegant hover:shadow-luxury transition-all duration-300 border-sage/30 bg-white/80 backdrop-blur-sm">
                  <div className="relative h-96">
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-forest/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-6 bg-gradient-to-br from-white via-sage/5 to-white">
                    <h3 className="font-sans text-2xl font-bold text-deep-forest mb-1">
                      {category.name}
                    </h3>
                    <p className="text-forest group-hover:text-gold-accent transition-colors duration-300">
                      Explore Collection &rarr;
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;