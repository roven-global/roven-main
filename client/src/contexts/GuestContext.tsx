import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

interface GuestWishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    slug: string;
}

interface GuestCartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface GuestContextType {
    guestWishlist: GuestWishlistItem[];
    guestCart: GuestCartItem[];
    addToGuestWishlist: (item: GuestWishlistItem) => void;
    removeFromGuestWishlist: (id: string) => void;
    addToGuestCart: (item: GuestCartItem) => void;
    removeFromGuestCart: (id: string) => void;
    updateGuestCartQuantity: (id: string, quantity: number) => void;
    clearGuestData: () => void;
    guestCartCount: number;
    isInGuestWishlist: (id: string) => boolean;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const useGuest = () => {
    const context = useContext(GuestContext);
    if (!context) {
        throw new Error('useGuest must be used within a GuestProvider');
    }
    return context;
};

export const GuestProvider = ({ children }: { children: ReactNode }) => {
    const [guestWishlist, setGuestWishlist] = useState<GuestWishlistItem[]>([]);
    const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);

    // Load guest data from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('shimmer_guest_wishlist');
        const savedCart = localStorage.getItem('shimmer_guest_cart');

        if (savedWishlist) {
            try {
                setGuestWishlist(JSON.parse(savedWishlist));
            } catch (error) {
                console.error('Error parsing guest wishlist:', error);
                localStorage.removeItem('shimmer_guest_wishlist');
            }
        }

        if (savedCart) {
            try {
                setGuestCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error parsing guest cart:', error);
                localStorage.removeItem('shimmer_guest_cart');
            }
        }
    }, []);

    // Save guest data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('shimmer_guest_wishlist', JSON.stringify(guestWishlist));
    }, [guestWishlist]);

    useEffect(() => {
        localStorage.setItem('shimmer_guest_cart', JSON.stringify(guestCart));
    }, [guestCart]);

    const addToGuestWishlist = (item: GuestWishlistItem) => {
        setGuestWishlist(prev => {
            const exists = prev.find(wishlistItem => wishlistItem.id === item.id);
            if (exists) {
                toast({
                    title: "Already in wishlist",
                    description: "This item is already in your wishlist.",
                });
                return prev;
            }
            const newWishlist = [...prev, item];
            toast({
                title: "Added to wishlist",
                description: `${item.name} has been added to your wishlist.`,
            });
            return newWishlist;
        });
    };

    const removeFromGuestWishlist = (id: string) => {
        setGuestWishlist(prev => {
            const item = prev.find(wishlistItem => wishlistItem.id === id);
            const newWishlist = prev.filter(wishlistItem => wishlistItem.id !== id);
            if (item) {
                toast({
                    title: "Removed from wishlist",
                    description: `${item.name} has been removed from your wishlist.`,
                });
            }
            return newWishlist;
        });
    };

    const addToGuestCart = (item: GuestCartItem) => {
        setGuestCart(prev => {
            const existingItem = prev.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                const newCart = prev.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                        : cartItem
                );
                toast({
                    title: "Cart updated",
                    description: `${item.name} quantity updated in your cart.`,
                });
                return newCart;
            } else {
                const newCart = [...prev, item];
                toast({
                    title: "Added to cart",
                    description: `${item.name} has been added to your cart.`,
                });
                return newCart;
            }
        });
    };

    const removeFromGuestCart = (id: string) => {
        setGuestCart(prev => {
            const item = prev.find(cartItem => cartItem.id === id);
            const newCart = prev.filter(cartItem => cartItem.id !== id);
            if (item) {
                toast({
                    title: "Removed from cart",
                    description: `${item.name} has been removed from your cart.`,
                });
            }
            return newCart;
        });
    };

    const updateGuestCartQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeFromGuestCart(id);
            return;
        }

        setGuestCart(prev =>
            prev.map(cartItem =>
                cartItem.id === id ? { ...cartItem, quantity } : cartItem
            )
        );
    };

    const clearGuestData = () => {
        setGuestWishlist([]);
        setGuestCart([]);
        localStorage.removeItem('shimmer_guest_wishlist');
        localStorage.removeItem('shimmer_guest_cart');
    };

    const isInGuestWishlist = (id: string) => {
        return guestWishlist.some(item => item.id === id);
    };

    const guestCartCount = guestCart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <GuestContext.Provider
            value={{
                guestWishlist,
                guestCart,
                addToGuestWishlist,
                removeFromGuestWishlist,
                addToGuestCart,
                removeFromGuestCart,
                updateGuestCartQuantity,
                clearGuestData,
                guestCartCount,
                isInGuestWishlist,
            }}
        >
            {children}
        </GuestContext.Provider>
    );
}; 