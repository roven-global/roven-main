import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { toast } from '@/hooks/use-toast';

const CheckoutRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { cartItems, isQuoteLoading } = useCart();
    const location = useLocation();

    if (authLoading || isQuoteLoading) {
        return <FullPageLoader />;
    }

    if (!isAuthenticated) {
        toast({
            title: 'Login Required',
            description: 'Please login to access the checkout page.',
            variant: 'destructive',
        });
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (cartItems.length === 0) {
        toast({
            title: 'Your Cart is Empty',
            description: 'Please add items to your cart before proceeding to checkout.',
            variant: 'destructive',
        });
        return <Navigate to="/cart" replace />;
    }

    return <>{children}</>;
};

export default CheckoutRoute;
