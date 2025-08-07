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
    variants?: Array<{
        volume: string;
        price: number;
        originalPrice?: number;
        stock: number;
        sku: string;
    }>;
    isNew?: boolean;
    isSale?: boolean;
    benefits?: string[];
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
    variants,
    isNew,
    isSale,
}: ProductCardProps) => {
    const { isAuthenticated, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToGuestWishlist, removeFromGuestWishlist, addToGuestCart, isInGuestWishlist } = useGuest();

    const isLiked = isAuthenticated ? user?.wishlist?.includes(id) : isInGuestWishlist(id);

    const getDisplayPrice = () => {
        if (variants && variants.length > 0) {
            return Math.min(...variants.map(v => v.price));
        }
        return price;
    };

    const getDisplayOriginalPrice = () => {
        if (variants && variants.length > 0) {
            const variantsWithOriginal = variants.filter(v => v.originalPrice);
            if (variantsWithOriginal.length > 0) {
                return Math.min(...variantsWithOriginal.map(v => v.originalPrice!));
            }
        }
        return originalPrice;
    };

    const getTotalStock = () => {
        if (variants && variants.length > 0) {
            return variants.reduce((total, v) => total + v.stock, 0);
        }
        return null;
    };

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            if (isInGuestWishlist(id)) {
                removeFromGuestWishlist(id);
            } else {
                addToGuestWishlist({ id, name, price, image, slug });
            }
            toast({
                title: isInGuestWishlist(id) ? "Removed from Wishlist" : "Added to Wishlist",
                description: name,
            });
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

        if (variants && variants.length > 1) {
            navigate(`/product/${slug}`);
            return;
        }

        const selectedVariant = variants && variants.length === 1 ? variants[0] : null;

        if (selectedVariant && selectedVariant.stock === 0) {
            return;
        }

        if (!isAuthenticated) {
            addToGuestCart({
                id,
                name: selectedVariant ? `${name} - ${selectedVariant.volume}` : name,
                price: selectedVariant ? selectedVariant.price : price,
                image,
                quantity: 1,
                variant: selectedVariant ? { volume: selectedVariant.volume, sku: selectedVariant.sku } : undefined,
            });
            return;
        }

        addToCart({
            productId: id,
            name: selectedVariant ? `${name} - ${selectedVariant.volume}` : name,
            quantity: 1,
            variant: selectedVariant ? { volume: selectedVariant.volume, sku: selectedVariant.sku } : undefined,
        });
    };

    return (
        <Card className="group relative w-full h-full flex flex-col bg-white border border-transparent hover:border-warm-taupe/50 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
            <Link to={`/product/${slug}`} className="flex flex-col h-full">
                <div className="relative overflow-hidden rounded-t-lg">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isNew && (
                            <span className="bg-sage/90 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm backdrop-blur-sm">
                                NEW
                            </span>
                        )}
                        {isSale && (
                            <span className="bg-gold-accent/90 text-deep-forest text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm backdrop-blur-sm">
                                SALE
                            </span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full shadow-md w-9 h-9" onClick={handleLikeClick}>
                        <Heart className={`h-4 w-4 transition-all ${isLiked ? 'fill-sage text-sage' : 'text-deep-forest'}`} />
                    </Button>
                </div>

                <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-forest font-medium">{category}</span>
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-gold-accent fill-current" />
                            <span className="font-semibold text-deep-forest">{rating.toFixed(1)}</span>
                            <span className="text-forest/70">({reviews})</span>
                        </div>
                    </div>
                    <h3 className="font-playfair font-bold text-lg text-deep-forest mb-3 line-clamp-2 flex-grow">{name}</h3>

                    <div className="flex justify-center items-baseline gap-2 text-center mt-auto mb-4">
                        {variants && variants.length > 1 && <span className="text-sm text-forest">From</span>}
                        <span className="font-bold text-2xl text-deep-forest">{formatRupees(getDisplayPrice())}</span>
                        {getDisplayOriginalPrice() && (
                            <span className="text-base text-warm-taupe line-through">
                                {formatRupees(getDisplayOriginalPrice())}
                            </span>
                        )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            variant="default"
                            className="w-full bg-forest text-white hover:bg-deep-forest font-semibold py-3 rounded-lg transition-all duration-300"
                            onClick={handleAddToCart}
                            disabled={getTotalStock() === 0}
                        >
                            {getTotalStock() === 0 ? 'OUT OF STOCK' :
                                variants && variants.length > 1 ? 'SELECT OPTIONS' : 'ADD TO CART'}
                        </Button>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};

export default ProductCard;