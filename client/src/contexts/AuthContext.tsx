import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useCart } from "./CartContext"; // Import useCart
import { useGuest } from "./GuestContext"; // Import useGuest
import { useUserReward } from "./UserRewardContext"; // Import useUserReward
import { toast } from "@/hooks/use-toast";

interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  verify_email: boolean;
  status: string;
  role?: string;
  wishlist?: string[];
  rewardClaimed?: boolean;
  rewardUsed?: boolean;
  reward?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  loginUser: (credentials: any) => Promise<boolean>; // Modified login function
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchUserCart, clearCart } = useCart();
  const { guestCart, guestWishlist, clearGuestData } = useGuest();
  const { fetchUserReward, clearUserReward } = useUserReward();

  const clearError = () => setError(null);

  const _handleGuestDataMigration = useCallback(async () => {
    if (guestCart.length === 0 && guestWishlist.length === 0) return;
    try {
      if (guestCart.length > 0) {
        await Axios.post(SummaryApi.mergeCart.url, { localCart: guestCart });
      }
      if (guestWishlist.length > 0) {
        for (const item of guestWishlist) {
          await Axios.post(SummaryApi.toggleWishlist.url, { productId: item.id });
        }
      }
      clearGuestData();
      console.log("Guest data migrated successfully.");
    } catch (error) {
      console.error("Error merging guest data:", error);
    }
  }, [guestCart, guestWishlist, clearGuestData]);

  const _handleRewardMigration = useCallback(async () => {
    const anonymousId = localStorage.getItem("anonymousId");
    if (!anonymousId) return;

    try {
      const migrationResponse = await Axios.post(
        "/api/welcome-gifts/migrate-anonymous",
        { anonymousId }
      );

      const responseData = migrationResponse.data.data;
      if (migrationResponse.data.success && responseData.migrated) {
        toast({
          title: "Welcome Back!",
          description: "We've linked your previously claimed welcome gift to your account.",
        });
        if (responseData.user) {
          setUser(responseData.user);
        }
        window.dispatchEvent(new Event("migrationComplete"));
      }
    } catch (error) {
      console.error("Error migrating anonymous welcome gift:", error);
    } finally {
      localStorage.removeItem("anonymousId");
      localStorage.removeItem("rewardClaimed");
    }
  }, []);

  const checkAuthStatus = useCallback(async (isLoginEvent: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accesstoken");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      if (!accessToken || !isLoggedIn) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await Axios.get(SummaryApi.userDetails.url);

      if (response.data.success) {
        setIsAuthenticated(true);
        setUser(response.data.data);

        // Only run migrations on a direct login event
        if (isLoginEvent) {
          await _handleGuestDataMigration();
          await _handleRewardMigration();
        }

        await fetchUserCart();
        await fetchUserReward();
        localStorage.removeItem("eligibilityCheckCompleted");
      } else {
        throw new Error("Invalid session");
      }
    } catch (err: any) {
      console.error("Auth check failed:", err);
      // If it's a network error, don't log out, just show an error.
      if (!err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        // For other errors (like 401 Unauthorized), log the user out.
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        setIsAuthenticated(false);
        setUser(null);
        setError("Your session has expired. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserCart, _handleGuestDataMigration, _handleRewardMigration]);

  const loginUser = async (credentials: any) => {
    try {
      const response = await Axios.post(SummaryApi.login.url, credentials);
      if (response.data.success) {
        localStorage.setItem("accesstoken", response.data.data.accessToken);
        localStorage.setItem("isLoggedIn", "true");
        // Explicitly trigger migrations after successful login
        await checkAuthStatus(true);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await Axios({ method: SummaryApi.logout.method, url: SummaryApi.logout.url });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("shimmer_cart");
      localStorage.removeItem("rewardClaimed");
      localStorage.removeItem("anonymousId");
      setIsAuthenticated(false);
      setUser(null);
      clearCart();
      clearUserReward(); // Clear user reward on logout
      // Dispatch custom events for other parts of the app that need to react to logout
      window.dispatchEvent(new Event("cartClear"));
      window.dispatchEvent(new Event("resetEligibilityCheck"));
    }
  }, [clearCart, clearUserReward]);

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    error,
    loginUser,
    logout,
    updateUser,
    checkAuthStatus,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
