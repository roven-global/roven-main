import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Filter, Star, Loader2, X, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Interfaces for type safety
interface Product {
  _id: string; name: string; price: number; originalPrice?: number;
  slug: string;
  images: Array<{ url: string }>;
  ratings: { average: number; numOfReviews: number; };
  category: { _id: string; name: string; };
  brand: string; createdAt: string;
  specifications?: { volume?: string };
  benefits?: string[];
}

interface Category {
  _id: string; name: string; productsCount: number; slug: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and Sorting State
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [rating, setRating] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [maxPrice, setMaxPrice] = useState(1000);

  const debouncedPriceRange = useDebounce(priceRange, 500);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const perPage = 9;

  // Fetching Logic
  const fetchAllCategoryProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all categories (no parent filter to get all, including subcategories)
      const categoriesRes = await Axios.get(SummaryApi.getAllCategories.url);
      if (!categoriesRes.data.success || !Array.isArray(categoriesRes.data.data)) {
        throw new Error('Failed to fetch categories');
      }
      setCategories(categoriesRes.data.data);

      // Fetch all products in one call (set limit=0 to get all)
      const productsRes = await Axios.get(`${SummaryApi.getAllProducts.url}?limit=0`);
      if (!productsRes.data.success || !Array.isArray(productsRes.data.data.products)) {
        throw new Error('Failed to fetch products');
      }
      setProducts(productsRes.data.data.products);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Could not load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategoryProducts();
  }, [fetchAllCategoryProducts]);

  // Dynamically set maxPrice after fetching products
  useEffect(() => {
    if (products.length > 0) {
      const mp = Math.ceil(Math.max(...products.map(p => p.price)) / 10) * 10 || 1000;
      setMaxPrice(mp);
      setPriceRange([0, mp]);
    }
  }, [products]);

  // Compute filtered and sorted products
  const computedProducts = useMemo(() => {
    // Filter
    const filtered = products.filter(p => {
      if (activeCategory !== 'all' && p.category._id !== activeCategory) return false;
      if (p.price < debouncedPriceRange[0] || p.price > debouncedPriceRange[1]) return false;
      if (rating > 0 && p.ratings.average < rating) return false;
      return true;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'createdAt-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating-desc':
          return b.ratings.average - a.ratings.average;
        case 'featured-desc':
          // Assuming featured sorts by number of reviews descending, with average as tiebreaker
          return b.ratings.numOfReviews - a.ratings.numOfReviews || b.ratings.average - a.ratings.average;
        default:
          return 0;
      }
    });
  }, [products, activeCategory, debouncedPriceRange, rating, sortBy]);

  // Paginate
  const displayedProducts = computedProducts.slice(0, currentPage * perPage);
  const totalFiltered = computedProducts.length;
  const hasMore = currentPage * perPage < totalFiltered;

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      // Simulate a short delay for UX, even though data is local
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setLoadingMore(false);
      }, 300);
    }
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setPriceRange([0, maxPrice]);
    setRating(0);
    setSortBy('featured-desc');
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
          <X className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`w-full text-left p-2 rounded-md transition-colors text-sm ${activeCategory === 'all'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'hover:bg-muted/50'
              }`}
          >
            All Categories
          </button>
          {categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setActiveCategory(category._id)}
                className={`w-full text-left p-2 rounded-md transition-colors text-sm ${activeCategory === category._id
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted/50'
                  }`}
              >
                {category.name}
              </button>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mt-1" />)
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-4">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-4">Rating</h4>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setRating(0)}
            className={`flex items-center p-2 rounded-md transition-colors border ${rating === 0 ? 'bg-amber-100 border-amber-300' : 'hover:bg-muted/50'}`}
          >
            <span className="text-sm">Any</span>
          </button>
          {[5, 4, 3, 2, 1].map(star => (
            <button key={star} onClick={() => setRating(star)}
              className={`flex items-center p-2 rounded-md transition-colors border ${rating === star ? 'bg-amber-100 border-amber-300' : 'hover:bg-muted/50'}`}
            >
              <span className="text-sm">{star}</span>
              <Star className={`h-4 w-4 ml-1 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative bg-gradient-to-r from-rose-50 to-pink-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Shop Our Collection
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Discover luxury beauty products crafted with the finest ingredients.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:w-1/4 sticky top-24">
              <div className="bg-card rounded-xl border p-6">
                <FilterContent />
              </div>
            </aside>

            {/* Products Section */}
            <main className="w-full lg:w-3/4">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-playfair font-bold">
                    {activeCategory === 'all' ? 'Products' : categories.find(c => c._id === activeCategory)?.name || 'Products'}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Showing {displayedProducts.length} of {totalFiltered} products
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Mobile Filter Trigger */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden w-full sm:w-auto">
                        <Filter className="mr-2 h-4 w-4" /> Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                        <SheetTitle>Filter Products</SheetTitle>
                      </SheetHeader>
                      <div className="p-4">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured-desc">Featured</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="createdAt-desc">Newest</SelectItem>
                      <SelectItem value="rating-desc">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="space-y-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-destructive py-10">{error}</div>
              ) : computedProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-20 rounded-lg bg-muted/50">
                  <h3 className="text-2xl font-semibold mb-2">No Products Found</h3>
                  <p>Try adjusting your filters to find what you're looking for.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {displayedProducts.map((product) => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const isNew = new Date(product.createdAt) > thirtyDaysAgo;
                    return <ProductCard key={product._id} id={product._id} slug={product.slug} name={product.name} price={product.price} originalPrice={product.originalPrice} image={product.images[0]?.url || ''} rating={product.ratings.average} reviews={product.ratings.numOfReviews} category={product.category.name} volume={product.specifications?.volume} isSale={!!(product.originalPrice && product.originalPrice > product.price)} isNew={isNew} benefits={product.benefits} />;
                  })}
                </div>
              )}

              {hasMore && (
                <div className="text-center mt-12">
                  <Button variant="outline" size="lg" onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : 'Load More Products'}
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
