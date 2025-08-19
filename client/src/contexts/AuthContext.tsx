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
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuthStatus: () => Promise<void>;
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
  const { fetchUserCart, clearCart } = useCart();
  const { guestCart, guestWishlist, clearGuestData } = useGuest();

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accesstoken");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      if (!accessToken || !isLoggedIn) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await Axios({
        method: SummaryApi.userDetails.method,
        url: SummaryApi.userDetails.url,
      });

      if (response.data.success) {
        setIsAuthenticated(true);
        setUser(response.data.data);
        await fetchUserCart();

        if (guestCart.length > 0 || guestWishlist.length > 0) {
          try {
            if (guestCart.length > 0) {
              await Axios.post(SummaryApi.mergeCart.url, {
                localCart: guestCart,
              });
            }
            if (guestWishlist.length > 0) {
              for (const item of guestWishlist) {
                await Axios.post(SummaryApi.toggleWishlist.url, {
                  productId: item.id,
                });
              }
            }
            clearGuestData();
          } catch (error) {
            console.error("Error merging guest data:", error);
          }
        }

        const anonymousId = localStorage.getItem("anonymousId");
        if (anonymousId) {
          try {
            const rewardDetails = localStorage.getItem("claimedRewardDetails");
            const parsedReward = rewardDetails
              ? JSON.parse(rewardDetails)
              : null;
            const migrationResponse = await Axios.post(
              "/api/welcome-gifts/migrate-anonymous",
              { anonymousId, couponCode: parsedReward?.couponCode }
            );

            if (
              migrationResponse.data.success &&
              migrationResponse.data.data.migrated
            ) {
              const userResponse = await Axios(SummaryApi.userDetails);
              if (userResponse.data.success) {
                setUser(userResponse.data.data);
                await fetchUserCart();
              }
              window.dispatchEvent(new Event("migrationComplete"));
              localStorage.removeItem("anonymousId");
              localStorage.removeItem("rewardClaimed");
              localStorage.removeItem("claimedRewardDetails");
            } else {
              localStorage.removeItem("anonymousId");
            }
          } catch (error) {
            console.error("Error migrating anonymous welcome gift:", error);
            localStorage.removeItem("anonymousId");
          }
        }
        localStorage.removeItem("eligibilityCheckCompleted");
      } else {
        throw new Error("Invalid session");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserCart, guestCart, guestWishlist, clearGuestData]);

  const login = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    window.dispatchEvent(new Event("loginStateChange"));
  };

  const logout = useCallback(async () => {
    try {
      await Axios({
        method: SummaryApi.logout.method,
        url: SummaryApi.logout.url,
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("shimmer_cart");
      localStorage.removeItem("rewardClaimed");
      localStorage.removeItem("claimedRewardDetails");
      localStorage.removeItem("anonymousId");
      setIsAuthenticated(false);
      setUser(null);
      clearCart();
      window.dispatchEvent(new Event("logoutStateChange"));
      window.dispatchEvent(new Event("cartClear"));
      window.dispatchEvent(new Event("resetEligibilityCheck"));
    }
  }, [clearCart]);

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  useEffect(() => {
    const handleLoginStateChange = () => {
      checkAuthStatus();
    };
    const handleLogoutStateChange = () => {
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener("loginStateChange", handleLoginStateChange);
    window.addEventListener("logoutStateChange", handleLogoutStateChange);

    return () => {
      window.removeEventListener("loginStateChange", handleLoginStateChange);
      window.removeEventListener("logoutStateChange", handleLogoutStateChange);
    };
  }, [checkAuthStatus]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
