import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useCart } from './CartContext'; // Import useCart
import { useGuest } from './GuestContext'; // Import useGuest

interface User {
  _id: string;
  name: string;
  email: string;
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
    throw new Error('useAuth must be used within an AuthProvider');
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
  const { fetchUserCart, clearCart } = useCart(); // Get cart functions
  const { guestCart, guestWishlist, clearGuestData } = useGuest(); // Get guest functions

  const checkAuthStatus = async () => {
    try {
      setLoading(true);

      const accessToken = localStorage.getItem('accesstoken');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

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
        localStorage.removeItem('shimmer_cart');
        setIsAuthenticated(true);
        setUser(response.data.data);
        await fetchUserCart(); // Fetch cart if user is authenticated

        // Merge guest data if any exists
        if (guestCart.length > 0 || guestWishlist.length > 0) {
          try {
            // Merge guest cart
            if (guestCart.length > 0) {
              await Axios.post(SummaryApi.mergeCart.url, { localCart: guestCart });
            }

            // Merge guest wishlist
            if (guestWishlist.length > 0) {
              for (const item of guestWishlist) {
                await Axios.post(SummaryApi.toggleWishlist.url, { productId: item.id });
              }
            }

            // Clear guest data after successful merge
            clearGuestData();
          } catch (error) {
            console.error('Error merging guest data:', error);
          }
        }
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accesstoken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await Axios({
        method: SummaryApi.logout.method,
        url: SummaryApi.logout.url,
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accesstoken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('shimmer_cart'); // Clear cart on logout
      setIsAuthenticated(false);
      setUser(null);
      clearCart(); // Clear cart context state
      window.dispatchEvent(new Event('logoutStateChange'));
      window.dispatchEvent(new Event('cartClear')); // Notify cart context to clear state
    }
  };

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

    window.addEventListener('loginStateChange', handleLoginStateChange);
    window.addEventListener('logoutStateChange', handleLogoutStateChange);

    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange);
      window.removeEventListener('logoutStateChange', handleLogoutStateChange);
    };
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};