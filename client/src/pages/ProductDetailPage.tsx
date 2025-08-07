import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Heart, ShoppingBag, Minus, Plus, ChevronRight } from 'lucide-react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext'; // Import useCart
import { useGuest } from '@/contexts/GuestContext'; // Import useGuest
import { toast } from '@/hooks/use-toast';
import { formatRupees } from '@/lib/currency'; // Import the new currency formatter

// Define interfaces for type safety
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
    price: number;
    originalPrice?: number;
    variants?: ProductVariant[];
    images: Array<{ url: string; public_id: string }>;
    category: { _id: string; name: string; slug: string };
    brand: string;
    ratings: { average: number; numOfReviews: number };
    specifications: Record<string, string>;
    tags: string[];
    slug: string;
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

    const isLiked = isAuthenticated ? user?.wishlist?.includes(product?._id) : isInGuestWishlist(product?._id || '');

    // Get current price based on selected variant
    const getCurrentPrice = () => {
        if (selectedVariant) {
            return selectedVariant.price;
        }
        return product?.price || 0;
    };

    // Get current original price based on selected variant
    const getCurrentOriginalPrice = () => {
        if (selectedVariant) {
            return selectedVariant.originalPrice;
        }
        return product?.originalPrice;
    };

    // Get stock status for selected variant
    const getStockStatus = () => {
        if (!selectedVariant) return 'Select Size';
        
        if (selectedVariant.stock === 0) return 'Out of Stock';
        if (selectedVariant.stock <= selectedVariant.lowStockThreshold) return 'Low Stock';
        return 'In Stock';
    };

    // Get stock status color
    const getStockStatusColor = () => {
        const status = getStockStatus();
        if (status === 'Out of Stock') return 'text-red-500';
        if (status === 'Low Stock') return 'text-yellow-500';
        if (status === 'In Stock') return 'text-green-500';
        return 'text-gray-500';
    };

    // Calculate price per ml if volume contains 'ml'
    const getPricePerUnit = (variant: ProductVariant) => {
        const volumeMatch = variant.volume.match(/(\d+)\s*ml/i);
        if (volumeMatch) {
            const ml = parseInt(volumeMatch[1]);
            return `₹${(variant.price / ml).toFixed(2)}/ml`;
        }
        return '';
    };

    const handleLikeClick = async () => {
        if (!product) return;

        if (!isAuthenticated) {
            // Handle guest wishlist
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
            return;
        }

        // Handle authenticated user wishlist
        try {
            const response = await Axios.post(SummaryApi.toggleWishlist.url, { productId: product._id });
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

    const handleAddToCart = () => {
        if (!product) return;

        if (!isAuthenticated) {
            // Handle guest cart
            addToGuestCart({
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.images[0]?.url || '',
                quantity: quantity,
            });
            return;
        }

        // Handle authenticated user cart
        addToCart({
            productId: product._id,
            name: product.name,
            quantity: quantity,
        });
    };

    useEffect(() => {
        if (!slug) return;

        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await Axios.get(`${SummaryApi.getProductById.url}/${slug}`);
                if (response.data.success) {
                    setProduct(response.data.data);
                    setSelectedImage(response.data.data.images[0]?.url || '');
                } else {
                    throw new Error('Product not found.');
                }
            } catch (err) {
                setError('Could not load the product. Please try again later.');
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="container mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <Skeleton className="w-full h-96 rounded-lg" />
                            <div className="flex gap-4 mt-4">
                                <Skeleton className="w-20 h-20 rounded-lg" />
                                <Skeleton className="w-20 h-20 rounded-lg" />
                                <Skeleton className="w-20 h-20 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-10 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Navigation />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-2xl font-semibold text-destructive">{error || 'Product not found.'}</h2>
                    <Link to="/shop">
                        <Button variant="outline" className="mt-4">Go back to Shop</Button>
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-rose-50/20">
            <Navigation />
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-6 gap-1">
                    <Link to="/" className="hover:text-primary">Home</Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link to={`/category/${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground font-medium break-all">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Image Gallery */}
                    <div className="static md:sticky md:top-24">
                        <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-4 bg-white">
                            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
                            {product.images.map((image) => (
                                <div
                                    key={image.public_id}
                                    onClick={() => setSelectedImage(image.url)}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === image.url ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                                >
                                    <img src={image.url} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4 md:space-y-6">
                        <Badge variant="secondary">{product.brand}</Badge>
                        <h1 className="font-playfair text-2xl md:text-4xl font-bold text-foreground break-words">{product.name}</h1>

                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.ratings.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <span className="text-muted-foreground text-sm">({product.ratings.numOfReviews} reviews)</span>
                        </div>

                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed break-words">{product.description.split('.')[0]}.</p>

                        <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                            <span className="text-2xl md:text-4xl font-bold text-primary">{formatRupees(product.price)}</span>
                            {product.originalPrice && (
                                <span className="text-lg md:text-xl text-muted-foreground line-through">{formatRupees(product.originalPrice)}</span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                            <div className="flex items-center border rounded-lg w-max mx-auto sm:mx-0">
                                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 md:w-12 text-center font-semibold">{quantity}</span>
                                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button size="lg" className="flex-1 bg-gradient-luxury" onClick={handleAddToCart}>
                                <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleLikeClick}>
                                <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </Button>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="description">
                                <AccordionTrigger>Full Description</AccordionTrigger>
                                <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                                    {product.description}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="specifications">
                                <AccordionTrigger>Specifications</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <li key={key}>
                                                <span className="font-semibold text-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {value}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetailPage;