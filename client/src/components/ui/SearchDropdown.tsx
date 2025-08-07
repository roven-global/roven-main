import React, { useState, useRef, useEffect } from 'react';
import Axios from '@/utils/Axios';
import { Input } from './input';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import ProductCard from '../ProductCard';

interface SearchDropdownProps {
  open: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ categories: any[]; products: any[] }>({ categories: [], products: [] });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const ANIMATION_DURATION = 400; // ms, match CSS

  // Close on escape key
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery('');
      setResults({ categories: [], products: [] });
      setError('');
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ categories: [], products: [] });
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          Axios.get(`/api/category/search?q=${encodeURIComponent(query)}`),
          Axios.get(`/api/product/search?q=${encodeURIComponent(query)}&limit=10`),
        ]);
        setResults({
          categories: catRes.data.data || [],
          products: prodRes.data.data?.products || [],
        });
      } catch (err: any) {
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    }, 350);
    // Cleanup
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const handleResultClick = (type: 'category' | 'product', slug: string) => {
    onClose();
    if (type === 'category') {
      navigate(`/category/${slug}`);
    } else {
      navigate(`/product/${slug}`);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, ANIMATION_DURATION);
  };

  if (!open && !isClosing) return null;

  return (
    <div className="fixed left-0 right-0 top-20 bottom-0 z-50">
      <div className={`fixed left-0 right-0 top-20 bottom-0 bg-white ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex-1"></div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-4xl font-bold p-4"
              aria-label="Close search"
            >
              <X className="h-10 w-10" />
            </button>
          </div>

          {/* Search Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 w-full">
            <div className="w-full max-w-6xl">
              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search for products"
                  className="w-full text-4xl md:text-5xl font-bold text-center bg-transparent border-none outline-none placeholder-gray-400"
                />
              </div>

              {/* Instructional Text */}
              {!query && (
                <p className="text-center text-gray-500 text-lg mb-8">
                  Start typing to see products you are looking for.
                </p>
              )}

              {/* Search Results */}
              {query && (
                <div className="w-full">
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                  )}
                  {!loading && error && (
                    <div className="text-red-500 text-center py-4">{error}</div>
                  )}
                  {!loading && !error && (
                    <>
                      {results.products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                          {results.products.map((prod) => (
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
                              category={prod.category?.name || ''}
                              volume={prod.specifications?.volume}
                              isNew={prod.isNew}
                              isSale={prod.isSale}
                              benefits={prod.benefits}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          No results found for "{query}"
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
