import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestProvider } from "@/contexts/GuestContext";
import { UserRewardProvider } from "@/contexts/UserRewardContext";
import { SearchProvider, useSearch } from "@/contexts/SearchContext";
import SearchDropdown from "@/components/ui/SearchDropdown";
import { AdminLayout } from "./components/Layout";
import AdminRoute from "./AdminRoute";
import RewardPopup from "@/components/RewardPopup";
import { useRewardPopup } from "@/hooks/useRewardPopup";
import FullPageLoader from "./components/ui/FullPageLoader";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
const CouponAdmin = lazy(() => import("./pages/CouponAdmin"));
const WelcomeGiftAdmin = lazy(() => import("./pages/WelcomeGiftAdmin"));
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
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/category/:slug" element={<CategoryProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
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
              <Route path="coupons" element={<CouponAdmin />} />
              <Route path="welcome-gifts" element={<WelcomeGiftAdmin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        {/* Search Overlay */}
        <SearchDropdown open={isSearchOpen} onClose={closeSearch} />
      </BrowserRouter>

      {/* Reward Popup for First-Time Visitors */}
      <RewardPopup isOpen={isRewardPopupOpen} onClose={closeRewardPopup} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GuestProvider>
        <UserRewardProvider>
          <CartProvider>
            <AuthProvider>
              <SearchProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </SearchProvider>
            </AuthProvider>
          </CartProvider>
        </UserRewardProvider>
      </GuestProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
