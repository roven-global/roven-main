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
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);

  const perPage = 9;

  // Fetching Logic
  const fetchAllCategoryProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all categories (no parent filter to get all, including subcategories)
      const categoriesRes = await Axios.get(SummaryApi.getAllCategories.url);
      if (
        !categoriesRes.data.success ||
        !Array.isArray(categoriesRes.data.data)
      ) {
        throw new Error("Failed to fetch categories");
      }
      setCategories(categoriesRes.data.data);

      // Fetch all products in one call (set limit=0 to get all)
      const productsRes = await Axios.get(
        `${SummaryApi.getAllProducts.url}?limit=0`
      );
      if (
        !productsRes.data.success ||
        !Array.isArray(productsRes.data.data.products)
      ) {
        throw new Error("Failed to fetch products");
      }
      setProducts(productsRes.data.data.products);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Could not load products. Please try again later.");
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
      const mp =
        Math.ceil(Math.max(...products.map((p) => p.price)) / 10) * 10 || 1000;
      setMaxPrice(mp);
    }
  }, [products]);

  // Compute filtered and sorted products
  const computedProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category._id === activeCategory);
    }

    // Filter by price
    if (activePriceRange) {
      const [min, max] = activePriceRange.split("-").map(Number);
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    } else if (activeCustomMin || activeCustomMax) {
      const min = activeCustomMin ? Number(activeCustomMin) : 0;
      const max = activeCustomMax ? Number(activeCustomMax) : Infinity;
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    }

    // Filter by skin type
    if (activeSkinTypes.length > 0 && !activeSkinTypes.includes("All")) {
      const skinTypesToFilter = new Set(activeSkinTypes);
      filtered = filtered.filter((p) => {
        if (!p.specifications?.skinType) return false;

        // Handle both array and string skinType for backward compatibility
        const productSkinTypes = Array.isArray(p.specifications.skinType)
          ? p.specifications.skinType
          : [p.specifications.skinType];

        // Check if any of the product's skin types match the filter
        return productSkinTypes.some((skinType) =>
          skinTypesToFilter.has(skinType)
        );
      });
    }

    // Filter by hair type
    if (activeHairTypes.length > 0 && !activeHairTypes.includes("All")) {
      const hairTypesToFilter = new Set(activeHairTypes);
      filtered = filtered.filter((p) => {
        if (!p.specifications?.hairType) return false;

        // Handle both array and string hairType for backward compatibility
        const productHairTypes = Array.isArray(p.specifications.hairType)
          ? p.specifications.hairType
          : [p.specifications.hairType];

        // Check if any of the product's hair types match the filter
        return productHairTypes.some((hairType) =>
          hairTypesToFilter.has(hairType)
        );
      });
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "createdAt-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "rating-desc":
          return b.ratings.average - a.ratings.average;
        case "featured-desc":
          return (
            b.ratings.numOfReviews - a.ratings.numOfReviews ||
            b.ratings.average - a.ratings.average
          );
        default:
          return 0;
      }
    });
  }, [
    products,
    activeCategory,
    sortBy,
    activePriceRange,
    activeCustomMin,
    activeCustomMax,
    activeSkinTypes,
    activeHairTypes,
  ]);

  // Paginate
  const displayedProducts = computedProducts.slice(0, currentPage * perPage);
  const totalFiltered = computedProducts.length;
  const hasMore = currentPage * perPage < totalFiltered;

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setLoadingMore(false);
      }, 300);
    }
  };

  const handleApplyFilters = () => {
    setActiveCategory(pendingCategory);
    setActiveSkinTypes(pendingSkinTypes);
    setActiveHairTypes(pendingHairTypes);
    setActivePriceRange(pendingPriceRange);
    setActiveCustomMin(pendingCustomMin);
    setActiveCustomMax(pendingCustomMax);
  };

  const handleClearFilters = () => {
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
                    Showing {displayedProducts.length} of {totalFiltered}{" "}
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
              ) : computedProducts.length === 0 ? (
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
                  {displayedProducts.map((product) => {
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

              {hasMore && (
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
