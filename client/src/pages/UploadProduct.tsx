import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Plus, ArrowLeft, Save, Package, Image as ImageIcon, Tag,Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: {
    _id: string;
    name: string;
  };
}

interface ProductVariant {
  volume: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  lowStockThreshold: number;
  isActive: boolean;
}

interface Ingredient {
  name: string;
  description: string;
  imageFile?: File | null;
  imageUrl?: string; // For preview / editing
}

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  variants?: ProductVariant[];
  category: {
    _id: string;
    name: string;
  };
  brand: string;
  sku: string;
  volume?: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  specifications: Record<string, any>;
  ingredients?: Array<{ name: string; description: string; image?: { url: string; public_id?: string } }>;
  suitableFor?: string[];
  tags: string[];
  benefits?: string[];
  isActive: boolean;
  isFeatured: boolean;
  howToUse?: string[];
  relatedProducts?: any[];
}

interface ImagePreview {
  file: File;
  url: string;
  id: string;
}

const UploadProduct = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editProductId = searchParams.get('edit');
  const isEditing = Boolean(editProductId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [specifications, setSpecifications] = useState<Array<{ key: string, value: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [useVariants, setUseVariants] = useState(false);

  // New fields
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suitableFor, setSuitableFor] = useState<string[]>([]);
  const [newSuitableFor, setNewSuitableFor] = useState('');
  const [howToUse, setHowToUse] = useState<string[]>([]);
  const [newHowToUse, setNewHowToUse] = useState('');

  // State for Related Products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]); // Using any for simplicity here
  const [relatedProductSearch, setRelatedProductSearch] = useState('');
  const [relatedProductSearchResults, setRelatedProductSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    sku: '',
    volume: '',
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing && editProductId) {
      fetchProduct(editProductId);
    }
  }, [isEditing, editProductId]);

  const fetchCategories = async () => {
    try {
      const response = await Axios({
        method: SummaryApi.getAllCategories.method,
        url: SummaryApi.getAllCategories.url,
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await Axios({
        method: SummaryApi.getProductById.method,
        url: `${SummaryApi.getProductById.url}/${productId}`,
      });
      if (response.data.success) {
        const product: Product = response.data.data;
        setFormData({
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription || '',
          price: product.price.toString(),
          originalPrice: product.originalPrice?.toString() || '',
          category: product.category._id,
          brand: product.brand,
          sku: product.sku,
          volume: product.volume || '',
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        });

        // Set existing images
        const existingImages: ImagePreview[] = product.images.map((img, index) => ({
          file: new File([], `existing-${index}`),
          url: img.url,
          id: `existing-${index}`,
        }));
        setImageFiles(existingImages);

        // Set specifications (filter out suitableFor and ingredients as they are separate fields)
        const specs = Object.entries(product.specifications)
          .filter(([key]) => key.toLowerCase() !== 'suitablefor' && key.toLowerCase() !== 'ingredients')
          .map(([key, value]) => ({
            key,
            value: value.toString(),
          }));
        setSpecifications(specs);

        // Set tags
        setTags(product.tags);

        // Set benefits
        setBenefits(product.benefits || []);

        // Set variants
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants);
          setUseVariants(true);
        }

        // Set new fields
        if (product.ingredients) {
          const ingredientsData = product.ingredients.map((ing: any) => ({
            name: ing.name || '',
            description: ing.description || '',
            imageFile: null,
            imageUrl: ing.image?.url || ''
          }));
          setIngredients(ingredientsData);
        } else {
          setIngredients([]);
        }
        setSuitableFor(product.suitableFor || []);
        setHowToUse(product.howToUse || []);
        setRelatedProducts(product.relatedProducts || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imagePreview: ImagePreview = {
          file,
          url: e.target?.result as string,
          id: Date.now().toString() + Math.random(),
        };
        setImageFiles(prev => [...prev, imagePreview]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  };

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    // Prevent users from setting specification keys to reserved names
    if (field === 'key') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'suitablefor' || lowerValue === 'ingredients') {
        toast({
          title: "Invalid Specification Name",
          description: "'suitableFor' and 'ingredients' are reserved field names and cannot be used as specification keys.",
          variant: "destructive",
        });
        return;
      }
    }

    setSpecifications(prev => prev.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    ));
  };



  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setBenefits(benefits.filter(benefit => benefit !== benefitToRemove));
  };

  // Ingredient management functions
  const addIngredient = () => {
    setIngredients(prev => [...prev, { name: "", description: "", imageFile: null, imageUrl: "" }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const handleIngredientImageChange = (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ingredient image must be less than 10MB",
        variant: "destructive"
      });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updateIngredient(index, "imageFile", file);
    updateIngredient(index, "imageUrl", previewUrl);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Helper functions for new fields
  const addListItem = (listSetter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value.trim()) {
      listSetter(prev => [...prev, value.trim()]);
    }
  };

  const removeListItem = (listSetter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    listSetter(prev => prev.filter(item => item !== value));
  };

  // --- Related Products Functions ---
  const handleRelatedProductSearch = async () => {
    if (!relatedProductSearch.trim()) {
      setRelatedProductSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await Axios.get(`${SummaryApi.searchProducts.url}?search=${relatedProductSearch}&limit=5`);
      if (response.data.success) {
        // Filter out the current product and already added related products
        const currentAndAddedIds = new Set([editProductId, ...relatedProducts.map(p => p._id)]);
        setRelatedProductSearchResults(response.data.data.products.filter((p: any) => !currentAndAddedIds.has(p._id)));
      }
    } catch (error) {
      console.error("Failed to search for products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addRelatedProduct = (product: any) => {
    setRelatedProducts(prev => [...prev, product]);
    setRelatedProductSearchResults(prev => prev.filter(p => p._id !== product._id));
  };

  const removeRelatedProduct = (productId: string) => {
    setRelatedProducts(prev => prev.filter(p => p._id !== productId));
  };


  // Variant management functions
  const addVariant = () => {
    const newVariant: ProductVariant = {
      volume: '',
      price: 0,
      originalPrice: 0,
      stock: 0,
      sku: '',
      lowStockThreshold: 5,
      isActive: true,
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const validateVariants = () => {
    if (!useVariants) return true;

    if (variants.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one variant when using variants.",
        variant: "destructive",
      });
      return false;
    }

    const skus = variants.map(v => v.sku).filter(sku => sku.trim() !== '');
    const uniqueSkus = new Set(skus);

    if (skus.length !== uniqueSkus.size) {
      toast({
        title: "Validation Error",
        description: "All variants must have unique SKUs.",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.volume.trim()) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Volume is required.`,
          variant: "destructive",
        });
        return false;
      }
      if (variant.price <= 0) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Price must be greater than 0.`,
          variant: "destructive",
        });
        return false;
      }
      if (!variant.sku.trim()) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: SKU is required.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!formData.name || !formData.description || !formData.category || !formData.brand || !formData.sku) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Price validation based on variant usage
    if (!useVariants && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast({
        title: "Error",
        description: "Price is required and must be greater than 0 for single products.",
        variant: "destructive",
      });
      return;
    }

    // Validate variants if using variants
    if (!validateVariants()) {
      return;
    }

    // Additional check to ensure we have proper data for the backend
    if (useVariants && variants.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one variant or disable the variant option.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Ensure we have the right data structure based on variant usage
      const isUsingVariants = useVariants && variants.length > 0;

      // Add basic product data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('shortDescription', formData.shortDescription);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('isFeatured', formData.isFeatured.toString());

      // Handle price, original price, and volume based on variant usage
      if (isUsingVariants) {
        // When using variants, set base price to 0, but still send volume if needed
        formDataToSend.append('price', '0');
        formDataToSend.append('volume', formData.volume || '');
        if (formData.originalPrice) formDataToSend.append('originalPrice', '0');
      } else {
        // When not using variants, ensure price is valid and send volume
        const price = parseFloat(formData.price) || 0;
        if (price <= 0) {
          toast({
            title: "Error",
            description: "Price must be greater than 0 for single products.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        formDataToSend.append('price', formData.price);
        formDataToSend.append('volume', formData.volume || '');
        if (formData.originalPrice) formDataToSend.append('originalPrice', formData.originalPrice);
      }


      // Add specifications (excluding suitableFor and ingredients as they are separate fields)
      const specsObject = specifications.reduce((acc, spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          // Filter out any specifications that might be named 'suitableFor' or 'ingredients'
          if (spec.key.toLowerCase() !== 'suitablefor' && spec.key.toLowerCase() !== 'ingredients') {
            acc[spec.key] = spec.value;
          }
        }
        return acc;
      }, {} as Record<string, any>);
      formDataToSend.append('specifications', JSON.stringify(specsObject));

      // Add ingredients as JSON without images
      const ingredientsData = ingredients.map(ing => ({
        name: ing.name,
        description: ing.description
      }));
      formDataToSend.append('ingredients', JSON.stringify(ingredientsData));

      // Add ingredient images separately
      ingredients.forEach((ing, index) => {
        if (ing.imageFile) {
          formDataToSend.append(`ingredientImages[${index}]`, ing.imageFile);
        }
      });

      // Add tags
      formDataToSend.append('tags', JSON.stringify(tags));

      // Add benefits
      formDataToSend.append('benefits', JSON.stringify(benefits));

      // Add How to Use
      formDataToSend.append('howToUse', JSON.stringify(howToUse));

      // Add related products
      formDataToSend.append('relatedProducts', JSON.stringify(relatedProducts.map(p => p._id)));

      // Handle variants - be very explicit about the data structure
      if (isUsingVariants) {
        formDataToSend.append('variants', JSON.stringify(variants));
        formDataToSend.append('hasVariants', 'true');
        formDataToSend.append('productType', 'variant');
      } else {
        formDataToSend.append('variants', JSON.stringify([]));
        formDataToSend.append('hasVariants', 'false');
        formDataToSend.append('productType', 'single');
        // Ensure we have a valid single product structure
        if (!formData.price || parseFloat(formData.price) <= 0) {
          toast({
            title: "Error",
            description: "Price is required and must be greater than 0 for single products.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Debug: Log what we're sending
      console.log('Form data being sent:', {
        useVariants,
        variantsCount: variants.length,
        isUsingVariants,
        price: formData.price,
        hasVariants: isUsingVariants ? 'true' : 'false'
      });

      // Add images (only new ones for editing)
      const newImages = imageFiles.filter(img => !img.id.startsWith('existing-'));
      newImages.forEach(img => {
        formDataToSend.append('images', img.file);
      });

      let response;
      if (isEditing) {
        response = await Axios({
          method: SummaryApi.updateProduct.method,
          url: `${SummaryApi.updateProduct.url}/${editProductId}`,
          data: formDataToSend,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await Axios({
          method: SummaryApi.createProduct.method,
          url: SummaryApi.createProduct.url,
          data: formDataToSend,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.data.success) {
        toast({
          title: "Success",
          description: isEditing ? "Product updated successfully" : "Product created successfully",
        });
        navigate('/admin/product');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="font-sans text-3xl font-bold tracking-tight text-deep-forest">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update the product details below."
              : "Fill in the form to add a new product."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/admin/product">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details of your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief description for product listings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.parentCategory ? `${category.parentCategory.name} > ${category.name}` : category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    placeholder="e.g., 100ml, 250ml, 1L"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card - UPDATED */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="font-bold text-xl">₹</span>
                Pricing (INR)
              </CardTitle>
              <CardDescription>
                Set the pricing for your product in Indian Rupees (₹)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="1,499.00"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (₹) (Optional)</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="1,999.00"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Variants
              </CardTitle>
              <CardDescription>
                Add multiple sizes/volumes for this product (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-variants"
                  checked={useVariants}
                  onCheckedChange={setUseVariants}
                />
                <Label htmlFor="use-variants">Enable product variants</Label>
              </div>

              {useVariants && variants.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Action Required:</strong> You've enabled variants but haven't added any yet.
                    Click "Add Variant" below to create your first variant, or disable the variant option above.
                  </p>
                </div>
              )}

              {useVariants && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    When variants are enabled, the base price and volume fields above will be ignored.
                    <strong className="text-red-600"> You must add at least one variant below.</strong>
                  </div>

                  {variants.map((variant, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Variant {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Volume *</Label>
                          <Input
                            placeholder="e.g., 100ml, 200ml"
                            value={variant.volume}
                            onChange={(e) => updateVariant(index, 'volume', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Price (₹) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Original Price (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variant.originalPrice || ''}
                            onChange={(e) => updateVariant(index, 'originalPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Stock Quantity *</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>SKU *</Label>
                          <Input
                            placeholder="Unique SKU"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Low Stock Threshold</Label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={variant.lowStockThreshold}
                            onChange={(e) => updateVariant(index, 'lowStockThreshold', parseInt(e.target.value) || 5)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`variant-active-${index}`}
                          checked={variant.isActive}
                          onCheckedChange={(checked) => updateVariant(index, 'isActive', checked)}
                        />
                        <Label htmlFor={`variant-active-${index}`}>Active</Label>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images
              </CardTitle>
              <CardDescription>
                Upload product images (max 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageFiles.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={image.url}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <Label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Upload Images</span>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>
                Add product specifications and features (Note: "suitableFor" and "ingredients" are handled separately)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Specification name"
                    value={spec.key}
                    onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Specification value"
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSpecification}>
                <Plus className="mr-2 h-4 w-4" />
                Add Specification
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>
                Add tags to help customers find your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Benefits
              </CardTitle>
              <CardDescription>
                Add key benefits of your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="flex items-center gap-1">
                    {benefit}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeBenefit(benefit)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a benefit"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" variant="outline" onClick={addBenefit}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hero Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Hero Ingredients
              </CardTitle>
              <CardDescription>
                Add key ingredients with description and image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ing, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={e => updateIngredient(index, "name", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Ingredient description"
                    value={ing.description}
                    onChange={e => updateIngredient(index, "description", e.target.value)}
                  />
                  <div>
                    {ing.imageUrl && (
                      <img src={ing.imageUrl} alt="Ingredient preview" className="h-24 object-cover mb-2" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files?.[0]) handleIngredientImageChange(index, e.target.files[0]);
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addIngredient}>
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
              </Button>
            </CardContent>
          </Card>

          {/* Suitable For */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Suitable For
              </CardTitle>
              <CardDescription>
                Add skin types, concerns, or demographics this product is suitable for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {suitableFor.map((item) => (
                  <Badge key={item} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeListItem(setSuitableFor, item)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add suitable for"
                  value={newSuitableFor}
                  onChange={(e) => setNewSuitableFor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addListItem(setSuitableFor, newSuitableFor), setNewSuitableFor(''))}
                />
                <Button type="button" variant="outline" onClick={() => { addListItem(setSuitableFor, newSuitableFor); setNewSuitableFor(''); }}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How to Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                How to Use
              </CardTitle>
              <CardDescription>
                Add step-by-step instructions for using your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {howToUse.map((step, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    Step {index + 1}: {step}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeListItem(setHowToUse, step)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a how-to-use step"
                  value={newHowToUse}
                  onChange={(e) => setNewHowToUse(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addListItem(setHowToUse, newHowToUse), setNewHowToUse(''))}
                />
                <Button type="button" variant="outline" onClick={() => { addListItem(setHowToUse, newHowToUse); setNewHowToUse(''); }}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Related Products
              </CardTitle>
              <CardDescription>
                Manually select products to show in the "You May Also Like" section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search for products to add</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, brand, or tag..."
                    value={relatedProductSearch}
                    onChange={(e) => setRelatedProductSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleRelatedProductSearch())}
                  />
                  <Button type="button" onClick={handleRelatedProductSearch} disabled={isSearching}>
                    {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {relatedProductSearchResults.length > 0 && (
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  {relatedProductSearchResults.map(product => (
                    <div key={product._id} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center gap-2">
                        <img src={product.images[0]?.url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => addRelatedProduct(product)}>Add</Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Current Related Products</Label>
                {relatedProducts.length > 0 ? (
                  <div className="space-y-2">
                    {relatedProducts.map(product => (
                      <div key={product._id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <img src={product.images[0]?.url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                        </div>
                        <Button type="button" size="sm" variant="destructive" onClick={() => removeRelatedProduct(product._id)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No related products selected. The section will automatically show products from the same category.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure product visibility and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this product visible to customers
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Show this product in featured sections
                  </p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link to="/admin/product">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-luxury"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UploadProduct;
