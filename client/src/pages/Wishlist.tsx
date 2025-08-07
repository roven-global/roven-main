import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { Link } from 'react-router-dom';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    images: Array<{ url: string }>;
    ratings: {
        average: number;
        numOfReviews: number;
    };
    category: {
        _id: string;
        name: string;
    };
    brand: string;
    createdAt: string;
    specifications?: Record<string, string>;
    benefits?: string[];
}

const Wishlist = () => {
    const { isAuthenticated, user, updateUser } = useAuth();
    const { guestWishlist, removeFromGuestWishlist } = useGuest();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWishlist = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await Axios.get(SummaryApi.getWishlist.url);
            if (response.data.success) {
                setWishlist(response.data.wishlist);
            } else {
                throw new Error('Failed to fetch wishlist.');
            }
        } catch (err) {
            setError('Could not load your wishlist. Please try again later.');
            console.error('Error fetching wishlist:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [isAuthenticated]);

    const handleRemoveFromWishlist = async (productId: string) => {
        try {
            const response = await Axios.post(SummaryApi.toggleWishlist.url, { productId });
            if (response.data.success && user) {
                // Update user context
                updateUser({ ...user, wishlist: response.data.wishlist });
                // Update local state to reflect removal instantly
                setWishlist(prev => prev.filter(p => p._id !== productId));
                toast({
                    title: "Removed from Wishlist",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove item.",
                variant: "destructive",
            });
        }
    };


    // Use guest wishlist if not authenticated
    const displayWishlist = isAuthenticated ? wishlist : guestWishlist;
    const displayLoading = isAuthenticated ? loading : false;
    const displayError = isAuthenticated ? error : null;

    return (
        <div className="min-h-screen flex flex-col bg-muted/20">
            <Navigation />
            <main className="flex-grow">
                <section className="py-12 bg-rose-50/50">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900">
                            My Wishlist
                        </h1>
                    </div>
                </section>

                <section className="py-16">
                    <div className="container mx-auto px-4">
                        {displayLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="space-y-4">
                                        <Skeleton className="h-64 w-full rounded-lg" />
                                        <Skeleton className="h-4 w-2/3 rounded" />
                                        <Skeleton className="h-4 w-1/2 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : displayError ? (
                            <div className="text-center text-destructive py-10">{displayError}</div>
                        ) : displayWishlist.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {displayWishlist.map((product) => {
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                    const isNew = isAuthenticated ? new Date(product.createdAt) > thirtyDaysAgo : false;

                                    return (
                                        <div key={product._id || product.id} className="relative group">
                                            <ProductCard
                                                id={product._id || product.id}
                                                slug={product.slug}
                                                name={product.name}
                                                price={product.price}
                                                originalPrice={product.originalPrice}
                                                image={isAuthenticated ? product.images[0]?.url || '' : product.image}
                                                rating={isAuthenticated ? product.ratings.average : 0}
                                                reviews={isAuthenticated ? product.ratings.numOfReviews : 0}
                                                category={isAuthenticated ? product.category.name : 'Product'}
                                                volume={isAuthenticated ? product.specifications?.volume : undefined}
                                                benefits={isAuthenticated ? product.benefits : undefined}
                                                isSale={!!(product.originalPrice && product.originalPrice > product.price)}
                                                isNew={isNew}
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                onClick={() => isAuthenticated ? handleRemoveFromWishlist(product._id) : removeFromGuestWishlist(product.id)}
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove from Wishlist</span>
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="text-center text-muted-foreground py-20 shadow-none border-dashed">
                                <Heart className="mx-auto h-16 w-16 text-rose-300 mb-4" />
                                <h3 className="text-2xl font-semibold mb-2 text-foreground">Your Wishlist is Empty</h3>
                                <p className="mb-6">Looks like you haven’t added anything to your wishlist yet.</p>
                                <Button asChild>
                                    <Link to="/shop">Continue Shopping</Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Wishlist;