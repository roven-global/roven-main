import React, { useState, useRef, useEffect } from "react";
import Axios from "@/utils/Axios";
import { Input } from "./input";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import ProductCard from "../ProductCard";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useTypewriter } from "@/hooks/useTypewriter";

interface SearchDropdownProps {
  open: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    categories: any[];
    products: any[];
  }>({ categories: [], products: [] });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const placeholderText = useTypewriter(
    [
      "Search for products...",
      "Search for cleansers...",
      "Search for serums...",
      "Search for moisturizers...",
    ],
    { loop: true }
  );

  // Close on escape key
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 500);
    } else {
      setQuery("");
      setResults({ categories: [], products: [] });
      setError("");
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ categories: [], products: [] });
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          Axios.get(`/api/category/search?q=${encodeURIComponent(query)}`),
          Axios.get(
            `/api/product/search?search=${encodeURIComponent(query)}&limit=10`
          ),
        ]);
        setResults({
          categories: catRes.data.data || [],
          products: prodRes.data.data?.products || [],
        });
      } catch (err: any) {
        setError("Search failed.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const handleResultClick = (type: "category" | "product", slug: string) => {
    onClose();
    if (type === "category") {
      navigate(`/category/${slug}`);
    } else {
      navigate(`/product/${slug}`);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-20 bottom-0 bg-background z-[9999] transition-transform duration-500 ease-in-out",
        {
          "translate-y-0": open,
          "translate-y-full": !open,
          "pointer-events-auto": open,
          "pointer-events-none": !open,
        }
      )}
    >
      <div className="flex flex-col h-full w-[80%] mx-auto px-6">
        {/* Combined Header/Input row */}
        <div className="flex items-center gap-4 py-6 border-b">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-muted-foreground"
            />
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-8 w-8" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto py-8 scrollbar-hide">
          {!query && !loading && (
            <p className="text-center text-muted-foreground text-lg">
              Start typing to see products you are looking for.
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive text-center py-4">{error}</div>
          ) : (
            <div>
              {results.categories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4 text-center">
                    Categories
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {results.categories.map((cat: any) => (
                      <button
                        key={cat._id}
                        onClick={() => handleResultClick("category", cat.slug)}
                        className="px-4 py-2 bg-muted/20 text-foreground rounded-full hover:bg-muted/30 transition"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.products.map((prod: any) => (
                    <ProductCard
                      key={prod._id}
                      id={prod._id}
                      slug={prod.slug}
                      name={prod.name}
                      price={prod.price}
                      originalPrice={prod.originalPrice}
                      image={prod.images && prod.images[0]?.url}
                      rating={prod.ratings?.average || 0}
                      reviews={prod.ratings?.numOfReviews || 0}
                      category={prod.category?.name || ""}
                      volume={prod.volume}
                      isNew={prod.isNew}
                      isSale={prod.isSale}
                      benefits={prod.benefits}
                    />
                  ))}
                </div>
              )}

              {query &&
                results.products.length === 0 &&
                results.categories.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No results found for "{query}"
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
