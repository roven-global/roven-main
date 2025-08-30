import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Filter, Star, Loader2, X, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Interfaces for type safety
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  variants?: Array<{
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
    lowStockThreshold: number;
    isActive: boolean;
  }>;
  images: Array<{ url: string }>;
  ratings: {
    average: number;
    numOfReviews: number;
  };
  category: {
    _id: string;
    name: string;
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
}

interface Category {
  _id: string;
  name: string;
  productsCount: number;
  slug: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Pending filter states
  const [pendingCategory, setPendingCategory] = useState("all");
  const [pendingSkinTypes, setPendingSkinTypes] = useState<string[]>([]);
  const [pendingHairTypes, setPendingHairTypes] = useState<string[]>([]);
  const [pendingPriceRange, setPendingPriceRange] = useState<string>("");
  const [pendingCustomMin, setPendingCustomMin] = useState<string>("");
  const [pendingCustomMax, setPendingCustomMax] = useState<string>("");

  // Active filter states
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSkinTypes, setActiveSkinTypes] = useState<string[]>([]);
  const [activeHairTypes, setActiveHairTypes] = useState<string[]>([]);
  const [activePriceRange, setActivePriceRange] = useState<string>("");
  const [activeCustomMin, setActiveCustomMin] = useState<string>("");
  const [activeCustomMax, setActiveCustomMax] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const perPage = 9;

  // Fetching Logic
  const fetchProducts = useCallback(async (page: number, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(perPage));

      if (activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      if (activeSkinTypes.length > 0 && !activeSkinTypes.includes("All")) {
        params.append("skinType", activeSkinTypes.join(","));
      }
      if (activeHairTypes.length > 0 && !activeHairTypes.includes("All")) {
        params.append("hairType", activeHairTypes.join(","));
      }
      if (activePriceRange) {
        const [min, max] = activePriceRange.split("-");
        params.append("minPrice", min);
        params.append("maxPrice", max);
      } else {
        if (activeCustomMin) params.append("minPrice", activeCustomMin);
        if (activeCustomMax) params.append("maxPrice", activeCustomMax);
      }
      if (sortBy) {
        const [sortField, sortOrder] = sortBy.split("-");
        params.append("sortBy", sortField);
        params.append("sortOrder", sortOrder);
      }

      const response = await Axios.get(
        `${SummaryApi.getAllProducts.url}?${params.toString()}`
      );

      if (response.data.success) {
        const { products: newProducts, pagination: newPagination } =
          response.data.data;
        setProducts(
          loadMore ? [...products, ...newProducts] : newProducts
        );
        setPagination(newPagination);
      } else {
        throw new Error("Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Could not load products. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [
    activeCategory,
    activeSkinTypes,
    activeHairTypes,
    activePriceRange,
    activeCustomMin,
    activeCustomMax,
    sortBy,
    products,
  ]);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await Axios.get(SummaryApi.getAllCategories.url);
        if (
          categoriesRes.data.success &&
          Array.isArray(categoriesRes.data.data)
        ) {
          setCategories(categoriesRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when filters or page change
  useEffect(() => {
    fetchProducts(pagination.currentPage);
  }, [
    activeCategory,
    activeSkinTypes,
    activeHairTypes,
    activePriceRange,
    activeCustomMin,
    activeCustomMax,
    sortBy,
  ]);
  
  const handleLoadMore = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchProducts(pagination.currentPage + 1, true);
    }
  };

  const handleApplyFilters = () => {
    setPagination(p => ({ ...p, currentPage: 1 }));
    setActiveCategory(pendingCategory);
    setActiveSkinTypes(pendingSkinTypes);
    setActiveHairTypes(pendingHairTypes);
    setActivePriceRange(pendingPriceRange);
    setActiveCustomMin(pendingCustomMin);
    setActiveCustomMax(pendingCustomMax);
  };

  const handleClearFilters = () => {
    setPagination(p => ({ ...p, currentPage: 1 }));
    setPendingCategory("all");
    setPendingSkinTypes([]);
    setPendingHairTypes([]);
    setPendingPriceRange("");
    setPendingCustomMin("");
    setPendingCustomMax("");
    setActiveCategory("all");
    setActiveSkinTypes([]);
    setActiveHairTypes([]);
    setActivePriceRange("");
    setActiveCustomMin("");
    setActiveCustomMax("");
    setOpenAccordionItems([]);
  };

  const FilterContent = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl">FILTERS</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear
        </Button>
      </div>
      <Accordion
        type="multiple"
        value={openAccordionItems}
        onValueChange={setOpenAccordionItems}
        className="w-full space-y-4"
      >
        <AccordionItem value="product-type">
          <AccordionTrigger>Product Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category._id}`}
                    checked={pendingCategory === category._id}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPendingCategory(category._id);
                      } else {
                        setPendingCategory("all");
                      }
                    }}
                  />
                  <label htmlFor={`cat-${category._id}`}>{category.name}</label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="skin-type">
          <AccordionTrigger>Skin Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["All", "Combination", "Oily", "Dry", "Normal", "Sensitive"].map(
                (type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skin-${type}`}
                      checked={pendingSkinTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setPendingSkinTypes((prev) =>
                          checked
                            ? [...prev, type]
                            : prev.filter((t) => t !== type)
                        );
                      }}
                    />
                    <label htmlFor={`skin-${type}`}>{type}</label>
                  </div>
                )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="hair-type">
          <AccordionTrigger>Hair Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["All", "Normal", "Dry", "Oily", "Damaged", "Color-Treated"].map(
                (type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hair-${type}`}
                      checked={pendingHairTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setPendingHairTypes((prev) =>
                          checked
                            ? [...prev, type]
                            : prev.filter((t) => t !== type)
                        );
                      }}
                    />
                    <label htmlFor={`hair-${type}`}>{type}</label>
                  </div>
                )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price-range">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <RadioGroup
                value={pendingPriceRange}
                onValueChange={setPendingPriceRange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0-500" id="price-1" />
                  <Label htmlFor="price-1">Under ₹500</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="500-1000" id="price-2" />
                  <Label htmlFor="price-2">₹500 - ₹1000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1000-2000" id="price-3" />
                  <Label htmlFor="price-3">₹1000 - ₹2000</Label>
                </div>
              </RadioGroup>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pendingCustomMin}
                  onChange={(e) => setPendingCustomMin(e.target.value)}
                  className="w-full"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={pendingCustomMax}
                  onChange={(e) => setPendingCustomMax(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button className="w-full mt-6" onClick={handleApplyFilters}>
        Apply
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative bg-gradient-to-br from-sage/10 via-forest/10 to-deep-forest/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-sans text-5xl md:text-6xl font-bold text-deep-forest mb-6">
            Shop Our Collection
          </h1>
          <p className="text-xl text-forest leading-relaxed">
            Discover luxury beauty products crafted with the finest ingredients.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
            <aside className="hidden lg:block col-span-1">
              <div className="sticky top-24">
                <FilterContent />
              </div>
            </aside>
            <main className="col-span-1 lg:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-sans font-bold text-deep-forest">
                    {activeCategory === "all"
                      ? "All Products"
                      : categories.find((c) => c._id === activeCategory)
                          ?.name || "Products"}
                  </h2>
                  <p className="text-forest mt-1">
                    Showing {products.length} of {pagination.totalProducts}{" "}
                    products
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Mobile Filter Button - More Prominent */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-warm-taupe text-forest hover:bg-sage/20 hover:text-sage lg:hidden bg-white shadow-sm"
                        size="lg"
                      >
                        <Filter className="mr-2 h-5 w-5" />
                        <span className="hidden xs:inline">Filters</span>
                        <span className="xs:hidden">Filter</span>
                        {Object.values({
                          category: activeCategory !== "all",
                          skinTypes: activeSkinTypes.length > 0,
                          hairTypes: activeHairTypes.length > 0,
                          price:
                            activePriceRange ||
                            activeCustomMin ||
                            activeCustomMax,
                        }).some(Boolean) && (
                          <span className="ml-2 bg-sage text-white text-xs rounded-full px-2 py-1">
                            Active
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[320px] sm:w-[380px] bg-white border-warm-taupe overflow-y-auto"
                    >
                      <SheetHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-warm-taupe/20">
                        <SheetTitle className="text-deep-forest text-xl">
                          Filter Products
                        </SheetTitle>
                        <p className="text-sm text-forest">
                          Refine your search to find exactly what you need
                        </p>
                      </SheetHeader>
                      <div className="py-4">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px] border-warm-taupe text-forest bg-white shadow-sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-warm-taupe">
                      <SelectItem
                        value="featured-desc"
                        className="text-forest hover:bg-sage/20"
                      >
                        Featured
                      </SelectItem>
                      <SelectItem
                        value="price-asc"
                        className="text-forest hover:bg-sage/20"
                      >
                        Price: Low to High
                      </SelectItem>
                      <SelectItem
                        value="price-desc"
                        className="text-forest hover:bg-sage/20"
                      >
                        Price: High to Low
                      </SelectItem>
                      <SelectItem
                        value="createdAt-desc"
                        className="text-forest hover:bg-sage/20"
                      >
                        Newest
                      </SelectItem>
                      <SelectItem
                        value="rating-desc"
                        className="text-forest hover:bg-sage/20"
                      >
                        Rating
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-64 w-full bg-warm-taupe/20" />
                      <Skeleton className="h-4 w-2/3 bg-warm-taupe/20" />
                      <Skeleton className="h-4 w-1/2 bg-warm-taupe/20" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-10">{error}</div>
              ) : products.length === 0 ? (
                <div className="text-center text-forest py-20 rounded-lg bg-gradient-to-br from-sage/10 via-white to-sage/10 border border-warm-taupe">
                  <h3 className="text-2xl font-semibold mb-2 text-deep-forest">
                    No Products Found
                  </h3>
                  <p>
                    Try adjusting your filters to find what you're looking for.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                        image={product.images[0]?.url || ""}
                        rating={product.ratings.average}
                        reviews={product.ratings.numOfReviews}
                        category={product.category.name}
                        volume={product.volume}
                        variants={product.variants}
                        isSale={
                          !!(
                            product.originalPrice &&
                            product.originalPrice > product.price
                          )
                        }
                        isNew={isNew}
                        benefits={product.benefits}
                      />
                    );
                  })}
                </div>
              )}

              {pagination.hasNext && (
                <div className="text-center mt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="border-warm-taupe text-forest hover:bg-sage/20 hover:text-sage"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Products"
                    )}
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
