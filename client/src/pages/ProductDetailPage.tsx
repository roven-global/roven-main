// ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, ShoppingBag, Minus, Plus, ChevronRight, CheckCircle } from 'lucide-react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useGuest } from '@/contexts/GuestContext';
import { toast } from '@/hooks/use-toast';
import { formatRupees } from '@/lib/currency';
import { cn } from '@/lib/utils';
import SizeSelector from '@/components/SizeSelector';

interface ProductVariant {
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
    lowStockThreshold: number;
    isActive: boolean;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    originalPrice?: number;
    variants?: ProductVariant[];
    images: Array<{ url: string; public_id: string }>;
    category: { _id: string; name: string; slug: string };
    brand: string;
    ratings: { average: number; numOfReviews: number };
    specifications: Record<string, any>;
    ingredients?: Array<{ name: string; description: string; image?: { url: string; public_id?: string } }>;
    suitableFor?: string[];
    tags: string[];
    benefits: string[];
    slug: string;
    howToUse?: string[];
}

const ProductDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { isAuthenticated, user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToGuestWishlist, removeFromGuestWishlist, addToGuestCart, isInGuestWishlist } = useGuest();

    const isLiked = isAuthenticated
        ? user?.wishlist?.includes(product?._id)
        : isInGuestWishlist(product?._id || '');

    useEffect(() => {
        if (!slug) return;

        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await Axios.get(`${SummaryApi.getProductById.url}/${slug}`);
                if (response.data.success) {
                    const productData = response.data.data;
                    setProduct(productData);
                    setSelectedImage(productData.images[0]?.url || '');
                    if (productData.variants && productData.variants.length > 0) {
                        const defaultVariant =
                            productData.variants.find(
                                (v: ProductVariant) => v.isActive && v.stock > 0
                            ) || productData.variants[0];
                        setSelectedVariant(defaultVariant);
                    }
                } else {
                    throw new Error('Product not found.');
                }
            } catch (err) {
                setError('Could not load the product. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    const handleLikeClick = async () => {
        if (!product) return;

        if (!isAuthenticated) {
            if (isInGuestWishlist(product._id)) {
                removeFromGuestWishlist(product._id);
            } else {
                addToGuestWishlist({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0]?.url || '',
                    slug: product.slug,
                });
            }
            toast({
                title: isInGuestWishlist(product._id) ? 'Removed from Wishlist' : 'Added to Wishlist',
                description: product.name,
            });
            return;
        }

        try {
            const response = await Axios.post(SummaryApi.toggleWishlist.url, {
                productId: product._id,
            });
            if (response.data.success) {
                updateUser({ ...user, wishlist: response.data.wishlist });
                toast({ title: response.data.message });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (product.variants && product.variants.length > 0 && !selectedVariant) {
            toast({
                title: 'Please select a size',
                variant: 'destructive',
            });
            return;
        }

        const variantToAdd =
            selectedVariant ||
            (product.variants && product.variants.length === 1
                ? product.variants[0]
                : null);

        if (variantToAdd && variantToAdd.stock === 0) {
            toast({
                title: 'Out of Stock',
                variant: 'destructive',
            });
            return;
        }

        const cartItem = {
            id: product._id,
            name: variantToAdd
                ? `${product.name} - ${variantToAdd.volume}`
                : product.name,
            price: variantToAdd ? variantToAdd.price : product.price,
            image: product.images[0]?.url || '',
            quantity,
            variant: variantToAdd
                ? { volume: variantToAdd.volume, sku: variantToAdd.sku }
                : undefined,
        };

        if (!isAuthenticated) {
            addToGuestCart(cartItem);
        } else {
            addToCart({
                productId: cartItem.id,
                name: cartItem.name,
                quantity: cartItem.quantity,
                variant: cartItem.variant,
            });
        }
    };

    if (loading) {
        return (
            <div className="bg-warm-cream">
                <Navigation />
                <div className="container mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <Skeleton className="w-full h-96 rounded-lg bg-soft-beige" />
                            <div className="flex gap-4 mt-4">
                                <Skeleton className="w-20 h-20 rounded-lg bg-soft-beige" />
                                <Skeleton className="w-20 h-20 rounded-lg bg-soft-beige" />
                                <Skeleton className="w-20 h-20 rounded-lg bg-soft-beige" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-1/4 bg-soft-beige" />
                            <Skeleton className="h-12 w-3/4 bg-soft-beige" />
                            <Skeleton className="h-6 w-1/2 bg-soft-beige" />
                            <Skeleton className="h-10 w-1/3 bg-soft-beige" />
                            <Skeleton className="h-20 w-full bg-soft-beige" />
                            <Skeleton className="h-12 w-full bg-soft-beige" />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="bg-warm-cream">
                <Navigation />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-2xl font-semibold text-destructive">
                        {error || 'Product not found.'}
                    </h2>
                    <Link to="/shop">
                        <Button variant="outline" className="mt-4">
                            Go back to Shop
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const currentPrice = selectedVariant?.price ?? product.price;
    const originalPrice = selectedVariant?.originalPrice ?? product.originalPrice;

    return (
        <div className="bg-warm-cream min-h-screen">
            <Navigation />
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-forest mb-8">
                    <Link to="/" className="hover:text-sage">
                        Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link to="/shop" className="hover:text-sage">
                        Shop
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-deep-forest font-medium">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Image Gallery */}
                    <div className="sticky top-24">
                        <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-4 bg-white">
                            <img
                                src={selectedImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {product.images.map((image) => (
                                <button
                                    key={image.public_id}
                                    onClick={() => setSelectedImage(image.url)}
                                    className={cn(
                                        'w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                                        selectedImage === image.url
                                            ? 'border-sage'
                                            : 'border-transparent hover:border-sage/50'
                                    )}
                                >
                                    <img
                                        src={image.url}
                                        alt={`${product.name} thumbnail`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                        <h1 className="font-playfair text-4xl font-bold text-deep-forest">
                            {product.name}
                        </h1>
                        {product.shortDescription && (
                            <p className="text-forest text-lg leading-relaxed">
                                {product.shortDescription}
                            </p>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Star className="h-5 w-5 text-gold-accent fill-current" />
                                <span className="font-semibold text-deep-forest">
                                    {product.ratings.average.toFixed(1)}
                                </span>
                            </div>
                            <span className="text-forest">
                                ({product.ratings.numOfReviews} Reviews)
                            </span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="font-playfair text-4xl font-bold text-deep-forest">
                                {formatRupees(currentPrice)}
                            </span>
                            {originalPrice && (
                                <span className="text-xl text-warm-taupe line-through">
                                    {formatRupees(originalPrice)}
                                </span>
                            )}
                        </div>
                        <p className="text-forest leading-relaxed">
                            {product.description.split('.')[0]}.
                        </p>

                        {product.variants && product.variants.length > 0 && (
                            <SizeSelector
                                variants={product.variants}
                                selectedVariant={selectedVariant}
                                onVariantChange={(variant) => {
                                    const fullVariant = product.variants?.find(
                                        (v) => v.volume === variant.volume && v.sku === variant.sku
                                    );
                                    setSelectedVariant(fullVariant || null);
                                }}
                            />
                        )}

                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-warm-taupe rounded-full p-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center font-semibold">
                                    {quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() =>
                                        setQuantity((q) =>
                                            Math.min(selectedVariant?.stock ?? 10, q + 1)
                                        )
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                size="lg"
                                className="flex-1 bg-forest text-white hover:bg-deep-forest rounded-full font-semibold"
                                onClick={handleAddToCart}
                                disabled={selectedVariant?.stock === 0}
                            >
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full border-warm-taupe"
                                onClick={handleLikeClick}
                            >
                                <Heart
                                    className={cn(
                                        'h-5 w-5 text-deep-forest',
                                        isLiked && 'fill-current text-sage'
                                    )}
                                />
                            </Button>
                        </div>

                        <div className="text-sm text-forest flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-sage" />
                            {selectedVariant?.stock
                                ? `${selectedVariant.stock} units available`
                                : 'In Stock'}
                        </div>
                    </div>
                </div>

                {/* Extended Product Info Section - Amazon style (no tabs, all sections visible) */}
                <div className="mt-16 border-t border-warm-taupe/30 pt-12 space-y-12">
                    {/* Description */}
                    <Card className="border-warm-taupe/30 bg-warm-cream/50">
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-4">Description</h2>
                            <p className="text-forest leading-relaxed">{product.description}</p>
                        </CardContent>
                    </Card>

                    {/* Hero Ingredients */}
                    {product.ingredients && product.ingredients.length > 0 && (
                        <Card className="border-warm-taupe/30 bg-warm-cream/50">
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-6">Hero Ingredients</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {product.ingredients.map((ingredient: any, i: number) => (
                                        <div
                                            key={i}
                                            className="bg-white rounded-xl shadow-md overflow-hidden border border-warm-taupe/20 hover:shadow-lg transition-shadow"
                                        >
                                            {ingredient.image && (
                                                <div className="w-full h-48 bg-warm-cream overflow-hidden">
                                                    <img
                                                        src={ingredient.image.url}
                                                        alt={ingredient.name || `Ingredient ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4 space-y-2">
                                                {ingredient.name && (
                                                    <h3 className="font-semibold text-lg text-deep-forest">
                                                        {ingredient.name}
                                                    </h3>
                                                )}
                                                {ingredient.description && (
                                                    <p className="text-sm text-forest leading-relaxed">
                                                        {ingredient.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* How to Use */}
                    {product.howToUse && product.howToUse.length > 0 && (
                        <Card className="border-warm-taupe/30 bg-warm-cream/50">
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-4">How to Use</h2>
                                <ol className="list-decimal pl-5 space-y-2 text-forest leading-relaxed">
                                    {product.howToUse.map((step: string, i: number) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    )}

                    {/* Suitable For */}
                    {product.specifications?.suitableFor && product.specifications.suitableFor.length > 0 && (
                        <Card className="border-warm-taupe/30 bg-warm-cream/50">
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-4">Suitable For</h2>
                                <ul className="list-disc pl-5 space-y-2 text-forest leading-relaxed">
                                    {product.specifications.suitableFor.map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Benefits */}
                    {product.benefits && product.benefits.length > 0 && (
                        <Card className="border-warm-taupe/30 bg-warm-cream/50">
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-4">Benefits</h2>
                                <ul className="list-disc pl-5 space-y-2 text-forest leading-relaxed">
                                    {product.benefits.map((benefit, i) => (
                                        <li key={i}>{benefit}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Specifications */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <Card className="border-warm-taupe/30 bg-warm-cream/50">
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-playfair font-bold text-deep-forest mb-4">Specifications</h2>
                                <dl className="divide-y divide-warm-taupe/20">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div key={key} className="flex py-3">
                                            <dt className="w-1/3 font-semibold text-deep-forest capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                            </dt>
                                            <dd className="w-2/3 text-forest">
                                                {Array.isArray(value) ? value.join(', ') : value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetailPage;
