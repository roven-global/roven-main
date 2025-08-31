import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { Link } from "react-router-dom";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images?: Array<{ url: string }>;
  image?: string;
  ratings?: {
    average: number;
    numOfReviews: number;
  };
  category?: {
    _id: string;
    name: string;
  };
  volume?: string;
  benefits?: string[];
  createdAt?: string;
  variants?: any[];
}

const Wishlist = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const { guestWishlist, removeFromGuestWishlist } = useGuest();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await Axios.get(SummaryApi.getWishlist.url);
        if (response.data.success) {
          setWishlist(response.data.wishlist);
        } else {
          throw new Error("Failed to fetch wishlist.");
        }
      } catch (err) {
        setError("Could not load your wishlist.");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      removeFromGuestWishlist(productId);
      toast({ title: "Removed from Wishlist" });
      return;
    }

    try {
      const response = await Axios.post(SummaryApi.toggleWishlist.url, {
        productId,
      });
      if (response.data.success && user) {
        updateUser({ ...user, wishlist: response.data.wishlist });
        setWishlist((prev) => prev.filter((p) => p._id !== productId));
        toast({ title: "Removed from Wishlist" });
      }
    } catch (error) {
      toast({ title: "Error removing item.", variant: "destructive" });
    }
  };

  const displayWishlist = isAuthenticated
    ? wishlist
    : guestWishlist.map((item) => ({ ...item, _id: item.id }));
  const displayLoading = isAuthenticated ? loading : false;
  const displayError = isAuthenticated ? error : null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-grow">
        <section className="py-8 sm:py-12 bg-white border-b border-border/50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              My Wishlist
            </h1>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            {displayLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                    <Skeleton className="h-72 w-full bg-primary/20 rounded-lg" />
                    <Skeleton className="h-4 w-5/6 bg-primary/20 rounded-md" />
                    <Skeleton className="h-4 w-1/2 bg-primary/20 rounded-md" />
                  </div>
                ))}
              </div>
            ) : displayError ? (
              <div className="text-center text-destructive py-10">
                {displayError}
              </div>
            ) : displayWishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                {displayWishlist.map((product) => (
                  <div key={product._id} className="relative group">
                    <ProductCard
                      id={product._id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={
                        isAuthenticated
                          ? product.images?.[0]?.url
                          : product.image
                      }
                      rating={isAuthenticated ? product.ratings?.average : 4.5} // Mock rating for guest
                      reviews={
                        isAuthenticated ? product.ratings?.numOfReviews : 0
                      }
                      category={
                        isAuthenticated
                          ? product.category?.name
                          : "Uncategorized"
                      }
                      volume={product.volume}
                      benefits={product.benefits}
                      isSale={
                        !!(
                          product.originalPrice &&
                          product.originalPrice > product.price
                        )
                      }
                      isNew={
                        product.createdAt
                          ? new Date(product.createdAt) >
                            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                          : false
                      }
                      variants={product.variants || []}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-20 bg-white shadow-md border-border/50">
                <Heart className="mx-auto h-16 w-16 text-primary/50 mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-foreground font-sans">
                  Your Wishlist is Empty
                </h3>
                <p className="mb-6 text-muted-brown">
                  Looks like you haven't added anything yet.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-white hover:bg-muted-brown rounded-full"
                >
                  <Link to="/shop">Discover Products</Link>
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
