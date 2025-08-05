import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
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
}: ProductCardProps) => {
    const { isAuthenticated, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const isLiked = user?.wishlist?.includes(id);

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

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
            navigate('/login');
            return;
        }

        addToCart({
            id,
            name,
            price,
            image,
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
                            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                                New
                            </span>
                        )}
                        {isSale && (
                            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                                Sale
                            </span>
                        )}
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white shadow-sm" onClick={handleLikeClick}>
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white shadow-sm" onClick={handleAddToCart}>
                            <ShoppingBag className="h-4 w-4 text-gray-600" />
                        </Button>
                    </div>
                </div>

                <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="text-sm text-gray-500 mb-1 font-medium">{category}</div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 flex-grow text-base leading-tight">{name}</h3>

                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.floor(rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">({reviews})</span>
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-lg text-orange-600">{formatRupees(price)}</span>
                            {volume && (
                                <span className="text-sm text-gray-500 font-medium">/ {volume}</span>
                            )}
                        </div>
                        {originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                                {formatRupees(originalPrice)}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ProductCard;