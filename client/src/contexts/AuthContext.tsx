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
  const { fetchUserCart, clearCart, fetchAndApplyMigratedGift } = useCart(); // Get cart functions
  const { guestCart, guestWishlist, clearGuestData } = useGuest(); // Get guest functions

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      console.log('AuthContext: checkAuthStatus called');

      const accessToken = localStorage.getItem('accesstoken');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      console.log('AuthContext: accessToken exists:', !!accessToken);
      console.log('AuthContext: isLoggedIn:', isLoggedIn);

      if (!accessToken || !isLoggedIn) {
        console.log('AuthContext: No access token or not logged in, setting unauthenticated');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      console.log('AuthContext: Making API call to userDetails');
      const response = await Axios({
        method: SummaryApi.userDetails.method,
        url: SummaryApi.userDetails.url,
      });

      console.log('AuthContext: userDetails response:', response.data);

      if (response.data.success) {
        localStorage.removeItem('shimmer_cart');
        setIsAuthenticated(true);
        setUser(response.data.data);
        console.log('AuthContext: User authenticated, user data:', response.data.data);

        await fetchUserCart(); // Fetch cart if user is authenticated

        // Fetch and apply migrated welcome gift if exists
        try {
          if (fetchAndApplyMigratedGift) {
            await fetchAndApplyMigratedGift();
          }
        } catch (error) {
          console.error('Error applying migrated gift:', error);
        }

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

        // Clear anonymous gift data after successful authentication
        // This ensures the gift is now properly associated with the user account
        localStorage.removeItem('anonymousId');
        localStorage.removeItem('eligibilityCheckCompleted');

        // Migrate anonymous welcome gift if exists
        const anonymousId = localStorage.getItem('anonymousId');
        if (anonymousId) {
          try {
            console.log('AuthContext: Attempting to migrate anonymous gift for anonymousId:', anonymousId);
            const migrationResponse = await Axios.post('/api/welcome-gifts/migrate-anonymous', { anonymousId });

            if (migrationResponse.data.success) {
              console.log('AuthContext: Migration response received:', migrationResponse.data.data);

              if (migrationResponse.data.data.migrated) {
                console.log('AuthContext: Anonymous welcome gift migrated successfully');
                localStorage.removeItem('anonymousId'); // Clean up after successful migration
                localStorage.removeItem('rewardClaimed'); // Clean up old reward data
                localStorage.removeItem('claimedRewardDetails'); // Clean up old reward details

                // Refresh user data to get updated rewardClaimed status
                await checkAuthStatus();
              } else {
                console.log('AuthContext: No migration needed - user already has a gift or no anonymous gift found');
                localStorage.removeItem('anonymousId'); // Clean up anyway
                localStorage.removeItem('rewardClaimed'); // Clean up old reward data
                localStorage.removeItem('claimedRewardDetails'); // Clean up old reward details
              }
            } else {
              console.log('AuthContext: Migration response indicates failure');
              localStorage.removeItem('anonymousId'); // Clean up anyway
            }
          } catch (error: any) {
            console.error('AuthContext: Error migrating anonymous welcome gift:', error);

            // If migration fails, clean up the anonymousId to prevent future attempts
            if (error.response?.status === 400 || error.response?.status === 500) {
              console.log('AuthContext: Migration failed - cleaning up localStorage');
              localStorage.removeItem('anonymousId');
              localStorage.removeItem('rewardClaimed');
              localStorage.removeItem('claimedRewardDetails');
            }
          }
        }
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      console.log('🔐 AuthContext: Clearing tokens due to error');
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
      localStorage.removeItem('rewardClaimed'); // Clear reward data on logout
      localStorage.removeItem('claimedRewardDetails'); // Clear reward details on logout
      localStorage.removeItem('anonymousId'); // Clear anonymous ID on logout
      setIsAuthenticated(false);
      setUser(null);
      clearCart(); // Clear cart context state
      window.dispatchEvent(new Event('logoutStateChange'));
      window.dispatchEvent(new Event('cartClear')); // Notify cart context to clear state
      // Dispatch event to reset eligibility check
      window.dispatchEvent(new Event('resetEligibilityCheck'));
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
    // Only check auth status once on mount, not on every render
    const hasCheckedAuth = localStorage.getItem('authStatusChecked');
    if (!hasCheckedAuth) {
      localStorage.setItem('authStatusChecked', 'true');
      checkAuthStatus();
    }
  }, []); // FIXED: Run only once on mount

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