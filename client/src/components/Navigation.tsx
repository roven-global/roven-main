import { useState, useEffect, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Menu, X, Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/contexts/SearchContext";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import UserDropdown from "@/components/UserDropdown"; // ✅ Import the fixed dropdown
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface NavItem {
  name: string;
  href: string;
}

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated } = useAuth();
  const { guestCartCount } = useGuest();
  const { openSearch } = useSearch();

  const fetchCartCount = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await Axios.get(SummaryApi.getCart.url);
        if (response.data.success) {
          setCartCount(response.data.data?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await Axios.get(
          `${SummaryApi.getAllCategories.url}?parent=main`
        );
        if (response.data.success && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
          setNavItems([
            { name: "Home", href: "/" },
            { name: "Shop", href: "/shop" },
            { name: "About Us", href: "/about" },
          ]);
        } else {
          setNavItems([
            { name: "Home", href: "/" },
            { name: "Shop", href: "/shop" },
            { name: "About Us", href: "/about" },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setNavItems([
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: "About Us", href: "/about" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
    fetchCartCount();
  }, [isAuthenticated, fetchCartCount]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener("cartUpdate", handleCartUpdate);
    return () => window.removeEventListener("cartUpdate", handleCartUpdate);
  }, [isAuthenticated, fetchCartCount]);

  // Handle scroll events for navbar hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      }
      // Hide navbar when scrolling down and not at the top
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-warm-taupe/50 transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0 shadow-sm" : "-translate-y-full"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="font-sans text-3xl font-bold text-deep-forest"
          >
            Roven
          </Link>

          {/* Main Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-16 bg-soft-beige" />
                <Skeleton className="h-4 w-16 bg-soft-beige" />
                <Skeleton className="h-4 w-20 bg-soft-beige" />
                <Skeleton className="h-4 w-24 bg-soft-beige" />
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "font-medium text-forest transition-colors hover:text-sage relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-sage after:transition-all after:duration-300",
                        isActive ? "text-sage after:w-full" : ""
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="font-medium text-forest transition-colors hover:text-sage hover:bg-transparent flex items-center gap-1 p-0"
                    >
                      Categories
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 bg-white border-warm-taupe shadow-lg rounded-lg mt-2"
                  >
                    {categories.map((category) => (
                      <DropdownMenuItem key={category._id} asChild>
                        <Link
                          to={`/category/${category.slug}`}
                          className="cursor-pointer text-forest hover:bg-warm-cream"
                        >
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Icon Buttons & Mobile Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-warm-cream"
              onClick={openSearch}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-forest" />
            </Button>

            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-warm-cream"
                  aria-label="Login"
                >
                  <svg
                    className="h-6 w-6 text-forest"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Button>
              </Link>
            )}

            <Link to="/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-warm-cream relative"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 text-forest" />
              </Button>
            </Link>

            <Link to="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-warm-cream relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5 text-forest" />
                {(isAuthenticated ? cartCount : guestCartCount) > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-sage ring-2 ring-white" />
                )}
              </Button>
            </Link>

            <button
              className="md:hidden p-2 rounded-full hover:bg-warm-cream"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-forest" />
              ) : (
                <Menu className="h-6 w-6 text-forest" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          "md:hidden absolute inset-x-0 top-full bg-white border-t border-warm-taupe/50 transition-all duration-300 ease-in-out z-40 shadow-lg",
          isMenuOpen
            ? "visible opacity-100 transform translate-y-0"
            : "invisible opacity-0 transform -translate-y-4"
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-2 max-h-[80vh] overflow-y-auto">
          {/* Main Navigation Links */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block px-4 py-3 rounded-lg text-base font-medium text-forest hover:bg-warm-cream transition-colors duration-200 active:bg-sage/20"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {/* Categories Section */}
          <div className="border-t border-warm-taupe/50 pt-4 mt-4">
            <h3 className="px-4 text-xs font-semibold text-warm-taupe uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-forest hover:bg-warm-cream transition-colors duration-200 active:bg-sage/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="border-t border-warm-taupe/50 pt-4 mt-4 px-4">
            <div className="text-xs text-warm-taupe text-center">
              <p>Roven Global Beauty</p>
              <p className="mt-1">Premium Beauty Products</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
