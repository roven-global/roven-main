import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useGuest } from '@/contexts/GuestContext';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { toast } from '@/hooks/use-toast';
import { formatRupees } from '@/lib/currency';

interface ProductCardProps {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating: number;
    reviews: number;
    category: string;
    volume?: string;
    isNew?: boolean;
    isSale?: boolean;
    benefits?: string[]; // Array of product benefits/features
}

const ProductCard = ({
    id,
    slug,
    name,
    price,
    originalPrice,
    image,
    rating,
    reviews,
    category,
    volume,
    isNew,
    isSale,
    benefits,
}: ProductCardProps) => {
    const { isAuthenticated, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToGuestWishlist, removeFromGuestWishlist, addToGuestCart, isInGuestWishlist } = useGuest();

    const isLiked = isAuthenticated ? user?.wishlist?.includes(id) : isInGuestWishlist(id);

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Handle guest wishlist
            if (isInGuestWishlist(id)) {
                removeFromGuestWishlist(id);
            } else {
                addToGuestWishlist({
                    id,
                    name,
                    price,
                    image,
                    slug,
                });
            }
            return;
        }

        // Handle authenticated user wishlist
        try {
            const response = await Axios.post(SummaryApi.toggleWishlist.url, { productId: id });
            if (response.data.success) {
                updateUser({ ...user, wishlist: response.data.wishlist });
                toast({
                    title: response.data.message,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong.",
                variant: "destructive",
            });
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Handle guest cart
            addToGuestCart({
                id,
                name,
                price,
                image,
                quantity: 1,
            });
            return;
        }

        // Handle authenticated user cart
        addToCart({
            productId: id,
            name,
            quantity: 1,
        });
    };

    return (
        <Link to={`/product/${slug}`}>
            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 overflow-hidden h-full flex flex-col bg-white rounded-xl">
                <div className="relative overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isNew && (
                            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
                                MUST TRY
                            </span>
                        )}
                        {isSale && (
                            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-md font-medium shadow-sm">
                                SALE
                            </span>
                        )}
                    </div>

                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white shadow-sm" onClick={handleLikeClick}>
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
                        </Button>
                    </div>
                </div>

                <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="text-sm text-gray-500 mb-2 font-medium">{category}</div>
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 flex-grow text-base leading-tight">{name}</h3>

                    {/* Product Benefits */}
                    <div className="flex flex-wrap gap-1 mb-3 text-sm justify-center">
                        {benefits && benefits.length > 0 ? (
                            benefits.map((benefit, index) => (
                                <React.Fragment key={index}>
                                    <span className="text-green-600 font-medium">{benefit}</span>
                                    {index < benefits.length - 1 && <span className="text-gray-400">|</span>}
                                </React.Fragment>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm">No benefits listed</span>
                        )}
                    </div>

                    {/* Volume */}
                    {volume && (
                        <div className="text-center mb-3">
                            <span className="text-sm text-gray-600 font-medium">{volume}</span>
                        </div>
                    )}

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-blue-500">✓</span>
                            <span className="text-sm text-gray-600">{reviews} Reviews</span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-2xl text-gray-900">{formatRupees(price)}</span>
                            {originalPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                    {formatRupees(originalPrice)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 group-hover:shadow-lg"
                        onClick={handleAddToCart}
                    >
                        ADD TO CART
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ProductCard;