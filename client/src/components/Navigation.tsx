import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Menu, X, Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdown from './ui/SearchDropdown';
import { Skeleton } from "@/components/ui/skeleton";
import Axios from '@/utils/Axios';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated } = useAuth();
  const { guestCartCount } = useGuest();

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
  }, [isAuthenticated]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, [isAuthenticated]);

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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={cn(
      "sticky top-0 z-50 bg-transparent border-b-0 transition-transform duration-300 ease-in-out",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="font-playfair text-2xl font-bold text-primary">
            Shimmer
          </Link>

          {/* Main Nav */}
          <div className="hidden md:flex items-center flex-1 justify-center">
            <div className="bg-white rounded-full shadow-md flex items-center px-4 py-2 space-x-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "px-5 py-2 rounded-full font-bold text-sm transition-all",
                        isActive
                          ? "bg-orange-500 text-white shadow"
                          : "text-black hover:bg-orange-100"
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                ))
              )}

              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-5 py-2 rounded-full font-bold text-sm text-black hover:bg-orange-100 transition-all flex items-center gap-1"
                  >
                    Categories
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category._id} asChild>
                      <Link to={`/category/${category.slug}`} className="cursor-pointer">
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                {(isAuthenticated ? cartCount : guestCartCount) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {isAuthenticated ? cartCount : guestCartCount}
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

            {/* Categories in Mobile Menu */}
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-gray-500 mb-2">Categories</div>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="block text-foreground hover:text-primary transition-colors font-medium py-2 pl-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>

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
