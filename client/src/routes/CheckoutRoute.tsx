import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { toast } from '@/hooks/use-toast';

const CheckoutRoute = ({ children }: { children: React.ReactNode }) => {
    const { cartItems, isQuoteLoading } = useCart();

    if (isQuoteLoading) {
        return <FullPageLoader />;
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
