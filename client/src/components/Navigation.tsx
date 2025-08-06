import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Menu, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdown from './ui/SearchDropdown';
import { Skeleton } from "@/components/ui/skeleton";
import Axios from '@/utils/Axios';
import SummaryApi from "@/common/summaryApi";
import UserDropdown from "@/components/UserDropdown"; // ✅ Import the fixed dropdown
import { useAuth } from "@/contexts/AuthContext";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchCartCount = async () => {
    if (isAuthenticated) {
      try {
        const response = await Axios.get(SummaryApi.getCart.url);
        if (response.data.success && Array.isArray(response.data.data)) {
          const totalItems = response.data.data.reduce((acc: number, item: any) => acc + item.quantity, 0);
          setCartCount(totalItems);
        }
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
      }
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await Axios.get(`${SummaryApi.getAllCategories.url}?parent=main`);
        if (response.data.success && Array.isArray(response.data.data)) {
          const dynamicCategories: NavItem[] = response.data.data.map((cat: Category) => ({
            name: cat.name,
            href: `/category/${cat.slug}`,
          }));

          setNavItems([
            { name: "Home", href: "/" },
            { name: "Shop", href: "/shop" },
            ...dynamicCategories,
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
  }, [isAuthenticated]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, [isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 bg-transparent border-b-0 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-playfair font-bold text-transparent bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text">
              Shimmer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoading ? (
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-16" />
                ))}
              </div>
            ) : (
              navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "text-foreground hover:text-primary transition-colors font-medium",
                      isActive && "text-primary"
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Icon Buttons */}
          <div className="flex items-center space-x-3 ml-4">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-white rounded-full shadow w-10 h-10 flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-black" />
            </Button>
            <SearchDropdown open={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* User Dropdown or Login Button */}
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white rounded-full shadow w-10 h-10 flex items-center justify-center"
                  aria-label="Login"
                >
                  <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </Button>
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white rounded-full shadow w-10 h-10 flex items-center justify-center"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 text-black" />
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white rounded-full shadow w-10 h-10 flex items-center justify-center relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5 text-black" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block text-foreground hover:text-primary transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => { setSearchOpen(true); setIsMenuOpen(false); }}
                aria-label="Search"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
