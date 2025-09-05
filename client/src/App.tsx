import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestProvider } from "@/contexts/GuestContext";
import { UserRewardProvider } from "@/contexts/UserRewardContext";
import { SearchProvider, useSearch } from "@/contexts/SearchContext";
import SearchDropdown from "@/components/ui/SearchDropdown";
import { AdminLayout } from "./components/Layout";
import AdminRoute from "@/routes/AdminRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import CheckoutRoute from "@/routes/CheckoutRoute";
import RewardPopup from "@/components/RewardPopup";
import { useRewardPopup } from "@/hooks/useRewardPopup";
import { toast } from "./hooks/use-toast";
import FullPageLoader from "./components/ui/FullPageLoader";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NotAuthorized = lazy(() => import("./pages/NotAuthorized"));
const Orders = lazy(() => import("./pages/Orders"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const CategoryAdmin = lazy(() => import("./pages/CategoryAdmin"));
const UploadProduct = lazy(() => import("./pages/UploadProduct"));
const ProductAdmin = lazy(() => import("./pages/ProductAdmin"));
const CategoryProductsPage = lazy(() => import("./pages/CategoryProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminSubscribers = lazy(() => import("./pages/AdminSubscribers"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const CouponAdmin = lazy(() => import("./pages/CouponAdmin"));
const WelcomeGiftAdmin = lazy(() => import("./pages/WelcomeGiftAdmin"));
const AdminHeroImages = lazy(() => import("./pages/AdminHeroImages"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ShippingInfo = lazy(() => import("./pages/ShippingInfo"));
const Returns = lazy(() => import("./pages/Returns"));

const queryClient = new QueryClient();

const AppContent = () => {
  const {
    isOpen: isRewardPopupOpen,
    closePopup: closeRewardPopup,
    resetEligibilityCheck,
  } = useRewardPopup();
  const { isSearchOpen, closeSearch } = useSearch();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for global session expiration events
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      if (location.pathname !== "/login") {
        navigate("/login");
      }
    };

    window.addEventListener("sessionExpired", handleSessionExpired);

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired);
    };
  }, [logout, navigate]);

  // Listen for logout events to reset eligibility check
  useEffect(() => {
    const handleResetEligibility = () => {
      resetEligibilityCheck();
    };

    window.addEventListener("resetEligibilityCheck", handleResetEligibility);

    return () => {
      window.removeEventListener(
        "resetEligibilityCheck",
        handleResetEligibility
      );
    };
  }, [resetEligibilityCheck]);

  return (
    <>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/category/:slug" element={<CategoryProductsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutRoute>
                  <Checkout />
                </CheckoutRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/payment" element={<Payment />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping-info" element={<ShippingInfo />} />
          <Route path="/returns" element={<Returns />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="category" element={<CategoryAdmin />} />
            <Route path="product" element={<ProductAdmin />} />
            <Route path="product/upload" element={<UploadProduct />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="subscribers" element={<AdminSubscribers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<CouponAdmin />} />
            <Route path="welcome-gifts" element={<WelcomeGiftAdmin />} />
            <Route path="hero-images" element={<AdminHeroImages />} />
          </Route>

          <Route path="/not-authorized" element={<NotAuthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Search Overlay */}
      <SearchDropdown open={isSearchOpen} onClose={closeSearch} />

      {/* Reward Popup for First-Time Visitors */}
      <RewardPopup isOpen={isRewardPopupOpen} onClose={closeRewardPopup} />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GuestProvider>
          <UserRewardProvider>
            <CartProvider>
              <AuthProvider>
                <SearchProvider>
                  <BrowserRouter>
                    <Toaster />
                    <Sonner />
                    <AppContent />
                  </BrowserRouter>
                </SearchProvider>
              </AuthProvider>
            </CartProvider>
          </UserRewardProvider>
        </GuestProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
