import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  GripVertical,
  Save,
  X,
  Percent,
  Truck,
  Gift,
  Star,
  DollarSign,
  Clock,
  Heart,
  Shield,
  Zap,
  Award,
  ChevronsUpDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MultiSelect } from '@/components/ui/MultiSelect';


const welcomeGiftSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, "Title contains invalid characters"),
  description: z.string().min(1, "Description is required").max(200, "Description cannot exceed 200 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!?()%₹]+$/, "Description contains invalid characters"),
  icon: z.enum(["Percent", "Truck", "Gift", "Star", "DollarSign", "Clock", "Heart", "Shield", "Zap", "Award"]),
  color: z.string().regex(/^text-(green|blue|purple|yellow|red|indigo|pink|orange)-600$/, "Invalid color format"),
  bgColor: z.string().regex(/^bg-(green|blue|purple|yellow|red|indigo|pink|orange)-50 hover:bg-(green|blue|purple|yellow|red|indigo|pink|orange)-100$/, "Invalid background color format"),
  reward: z.string().min(1, "Reward text is required").max(100, "Reward text cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!?()%₹]+$/, "Reward text contains invalid characters"),
  couponCode: z.string().min(3, "Coupon code must be at least 3 characters").max(20, "Coupon code cannot exceed 20 characters")
    .regex(/^[A-Z0-9]+$/, "Coupon code must be uppercase letters and numbers only"),
  rewardType: z.enum(["percentage", "fixed_amount", "buy_one_get_one"]),
  rewardValue: z.number().min(0, "Reward value cannot be negative").max(100000, "Reward value is too high"),
  maxDiscount: z.number().min(0, "Max discount cannot be negative").max(100000, "Max discount is too high").nullable().optional(),
  minOrderAmount: z.number().min(0, "Min order amount cannot be negative").max(100000, "Min order amount is too high"),
  order: z.number().int().min(1, "Order must be between 1 and 6").max(6, "Order must be between 1 and 6"),
  isActive: z.boolean(),
  // BOGO fields
  buyQuantity: z.number().int().min(1, "Buy quantity must be at least 1").optional(),
  getQuantity: z.number().int().min(1, "Get quantity must be at least 1").optional(),
  applicableCategories: z.array(z.string()).optional(),
});

type WelcomeGiftFormValues = z.infer<typeof welcomeGiftSchema>;

interface WelcomeGift extends WelcomeGiftFormValues {
  _id: string;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalGifts: number;
  activeGifts: number;
  totalUsage: number;
  gifts: Array<{
    id: string;
    title: string;
    usageCount: number;
    lastUsed?: string;
    isActive: boolean;
  }>;
}

const iconOptions = [
  { value: 'Percent', label: 'Percent', icon: <Percent className="w-4 h-4" /> },
  { value: 'Truck', label: 'Truck', icon: <Truck className="w-4 h-4" /> },
  { value: 'Gift', label: 'Gift', icon: <Gift className="w-4 h-4" /> },
  { value: 'Star', label: 'Star', icon: <Star className="w-4 h-4" /> },
  { value: 'DollarSign', label: 'Dollar Sign', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'Clock', label: 'Clock', icon: <Clock className="w-4 h-4" /> },
  { value: 'Heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  { value: 'Shield', label: 'Shield', icon: <Shield className="w-4 h-4" /> },
  { value: 'Zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
  { value: 'Award', label: 'Award', icon: <Award className="w-4 h-4" /> },
];

const colorOptions = [
  { value: 'text-green-600', label: 'Green' },
  { value: 'text-blue-600', label: 'Blue' },
  { value: 'text-purple-600', label: 'Purple' },
  { value: 'text-yellow-600', label: 'Yellow' },
  { value: 'text-red-600', label: 'Red' },
  { value: 'text-indigo-600', label: 'Indigo' },
  { value: 'text-pink-600', label: 'Pink' },
  { value: 'text-orange-600', label: 'Orange' },
];

const bgColorOptions = [
  { value: 'bg-green-50 hover:bg-green-100', label: 'Green' },
  { value: 'bg-blue-50 hover:bg-blue-100', label: 'Blue' },
  { value: 'bg-purple-50 hover:bg-purple-100', label: 'Purple' },
  { value: 'bg-yellow-50 hover:bg-yellow-100', label: 'Yellow' },
  { value: 'bg-red-50 hover:bg-red-100', label: 'Red' },
  { value: 'bg-indigo-50 hover:bg-indigo-100', label: 'Indigo' },
  { value: 'bg-pink-50 hover:bg-pink-100', label: 'Pink' },
  { value: 'bg-orange-50 hover:bg-orange-100', label: 'Orange' },
];

const rewardTypeOptions = [
  { value: 'percentage', label: 'Percentage Discount', description: 'e.g., 10% off' },
  { value: 'fixed_amount', label: 'Fixed Amount Discount', description: 'e.g., ₹100 off' },
  { value: 'buy_one_get_one', label: 'Buy One Get One Free', description: 'BOGO offer on products' },
];

const WelcomeGiftAdmin = () => {
  const [gifts, setGifts] = useState<WelcomeGift[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingGift, setEditingGift] = useState<WelcomeGift | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          Axios.get(SummaryApi.getAllProducts.url),
          Axios.get(SummaryApi.getAllCategories.url)
        ]);
        if (productsResponse.data.success && Array.isArray(productsResponse.data.data)) {
          setProducts(productsResponse.data.data);
        } else {
          setProducts([]); // Ensure products is always an array
        }
        if (categoriesResponse.data.success && Array.isArray(categoriesResponse.data.data)) {
          setCategories(categoriesResponse.data.data);
        } else {
          setCategories([]); // Ensure categories is always an array
        }
      } catch (error) {
        console.error("Error fetching products or categories", error);
        toast({ title: 'Error fetching data for form', description: 'Could not load products or categories.', variant: 'destructive' });
        setProducts([]); // Also set to empty array on error
        setCategories([]);
      }
    };
    fetchProductsAndCategories();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    control,
    watch,
  } = useForm<WelcomeGiftFormValues>({
    resolver: zodResolver(welcomeGiftSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: 'Gift',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      reward: '',
      couponCode: '',
      rewardType: 'percentage',
      rewardValue: 10,
      maxDiscount: undefined,
      minOrderAmount: 0,
      order: 1,
      isActive: true,
      buyQuantity: 1,
      getQuantity: 1,
      applicableCategories: [],
    },
  });

  useEffect(() => {
    fetchGifts();
    fetchAnalytics();
  }, []);

  const fetchGifts = async () => {
    try {
      const response = await Axios.get(SummaryApi.getAllWelcomeGiftsAdmin.url);
      if (response.data.success) {
        setGifts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
      toast({ title: 'Error fetching gifts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await Axios.get(SummaryApi.getWelcomeGiftsAnalytics.url);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const resetForm = () => {
    reset({
      title: '',
      description: '',
      icon: 'Gift',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      reward: '',
      couponCode: '',
      rewardType: 'percentage',
      rewardValue: 10,
      maxDiscount: undefined,
      minOrderAmount: 0,
      order: 1,
      isActive: true,
    });
    setEditingGift(null);
  };

  const onSubmit = async (data: WelcomeGiftFormValues) => {
    try {
      if (editingGift) {
        const url = SummaryApi.updateWelcomeGift.url.replace(':id', editingGift._id);
        const response = await Axios.put(url, data);
        if (response.data.success) {
          toast({ title: 'Welcome gift updated successfully!' });
          fetchGifts();
          fetchAnalytics();
        }
      } else {
        const response = await Axios.post(SummaryApi.createWelcomeGift.url, data);
        if (response.data.success) {
          toast({ title: 'Welcome gift created successfully!' });
          fetchGifts();
          fetchAnalytics();
        }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('couponCode')) {
          setError('couponCode', { type: 'manual', message: errorMessage });
        } else if (errorMessage.includes('order')) {
          setError('order', { type: 'manual', message: errorMessage });
        }
      }
      toast({
        title: 'Error saving welcome gift',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (gift: WelcomeGift) => {
    setEditingGift(gift);
    reset({
      title: gift.title,
      description: gift.description,
      icon: gift.icon,
      color: gift.color,
      bgColor: gift.bgColor,
      reward: gift.reward,
      couponCode: gift.couponCode || '',
      rewardType: gift.rewardType || 'percentage',
      rewardValue: gift.rewardValue || 10,
      maxDiscount: gift.maxDiscount,
      minOrderAmount: gift.minOrderAmount || 0,
      order: gift.order,
      isActive: gift.isActive,
      buyQuantity: gift.buyQuantity || 1,
      getQuantity: gift.getQuantity || 1,
      applicableCategories: gift.applicableCategories || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (giftId: string) => {
    try {
      const url = SummaryApi.deleteWelcomeGift.url.replace(':id', giftId);
      const response = await Axios.delete(url);
      if (response.data.success) {
        toast({ title: 'Welcome gift deleted successfully!' });
        fetchGifts();
        fetchAnalytics();
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting welcome gift',
        description: error.response?.data?.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (giftId: string) => {
    try {
      const url = SummaryApi.toggleWelcomeGiftStatus.url.replace(':id', giftId);
      const response = await Axios.patch(url);
      if (response.data.success) {
        toast({ title: 'Welcome gift status updated!' });
        fetchGifts();
        fetchAnalytics();
      }
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.response?.data?.message,
        variant: 'destructive'
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Percent: <Percent className="w-4 h-4" />,
      Truck: <Truck className="w-4 h-4" />,
      Gift: <Gift className="w-4 h-4" />,
      Star: <Star className="w-4 h-4" />,
      DollarSign: <DollarSign className="w-4 h-4" />,
      Clock: <Clock className="w-4 h-4" />,
      Heart: <Heart className="w-4 h-4" />,
      Shield: <Shield className="w-4 h-4" />,
      Zap: <Zap className="w-4 h-4" />,
      Award: <Award className="w-4 h-4" />,
    };
    return iconMap[iconName] || <Gift className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-deep-forest">Welcome Gift Management</h1>
          <p className="text-gray-600">Manage the 6 welcome gift options for first-time visitors</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAnalytics(!showAnalytics)} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Gift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGift ? 'Edit Welcome Gift' : 'Add New Welcome Gift'}
                </DialogTitle>
                <DialogDescription>
                  {editingGift ? 'Update the details of this welcome gift.' : 'Create a new welcome gift for users. Fill in the details below.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...register("title")} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="order">Order (1-6)</Label>
                    <Input id="order" type="number" {...register("order", { valueAsNumber: true })} />
                    {errors.order && <p className="text-red-500 text-xs mt-1">{errors.order.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Icon</Label>
                    <Controller
                      name="icon"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">{option.icon}{option.label}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.icon && <p className="text-red-500 text-xs mt-1">{errors.icon.message}</p>}
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <Controller
                      name="bgColor"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {bgColorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.bgColor && <p className="text-red-500 text-xs mt-1">{errors.bgColor.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reward">Reward Text</Label>
                  <Input id="reward" {...register("reward")} />
                  {errors.reward && <p className="text-red-500 text-xs mt-1">{errors.reward.message}</p>}
                </div>

                <div>
                  <Label htmlFor="couponCode">Coupon Code</Label>
                  <Input id="couponCode" {...register("couponCode")} />
                  {errors.couponCode && <p className="text-red-500 text-xs mt-1">{errors.couponCode.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reward Type</Label>
                    <Controller
                      name="rewardType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {rewardTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-xs text-gray-500">{option.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.rewardType && <p className="text-red-500 text-xs mt-1">{errors.rewardType.message}</p>}
                  </div>
                  {watch("rewardType") !== 'buy_one_get_one' && (
                  <div>
                    <Label htmlFor="rewardValue">Reward Value</Label>
                    <Input id="rewardValue" type="number" {...register("rewardValue", { valueAsNumber: true })} />
                    {errors.rewardValue && <p className="text-red-500 text-xs mt-1">{errors.rewardValue.message}</p>}
                  </div>
                  )}
                </div>

                {watch("rewardType") !== 'buy_one_get_one' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxDiscount">Max Discount (₹) - Optional</Label>
                    <Input id="maxDiscount" type="number" {...register("maxDiscount", { valueAsNumber: true })} />
                    {errors.maxDiscount && <p className="text-red-500 text-xs mt-1">{errors.maxDiscount.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                    <Input id="minOrderAmount" type="number" {...register("minOrderAmount", { valueAsNumber: true })} />
                    {errors.minOrderAmount && <p className="text-red-500 text-xs mt-1">{errors.minOrderAmount.message}</p>}
                  </div>
                </div>
                )}

                {watch("rewardType") === 'buy_one_get_one' && (
                  <Card className="bg-slate-50/50">
                    <CardHeader>
                      <CardTitle className="text-base">Buy One Get One Settings</CardTitle>
                      <DialogDescription className="text-sm">Configure the rules for your BOGO offer.</DialogDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="buyQuantity">Buy Quantity</Label>
                          <Input id="buyQuantity" type="number" {...register("buyQuantity", { valueAsNumber: true })} />
                          {errors.buyQuantity && <p className="text-red-500 text-xs mt-1">{errors.buyQuantity.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor="getQuantity">Get Quantity (Free)</Label>
                          <Input id="getQuantity" type="number" {...register("getQuantity", { valueAsNumber: true })} />
                          {errors.getQuantity && <p className="text-red-500 text-xs mt-1">{errors.getQuantity.message}</p>}
                        </div>
                      </div>
                      <div>
                        <Label>Applicable Categories (optional)</Label>
                        <Controller
                          name="applicableCategories"
                          control={control}
                          render={({ field }) => (
                            <MultiSelect
                              options={categories.map(c => ({ value: c._id, label: c.name }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              placeholder="Select categories..."
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center space-x-2">
                    <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="isActive"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingGift ? 'Update' : 'Create'} Gift
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome Gifts Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalGifts}</div>
                <div className="text-sm text-gray-600">Total Gifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.activeGifts}</div>
                <div className="text-sm text-gray-600">Active Gifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalUsage}</div>
                <div className="text-sm text-gray-600">Total Claims</div>
              </div>
            </div>
            <div className="space-y-2">
              {analytics.gifts.map((gift) => (
                <div key={gift.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{gift.title}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{gift.usageCount} claims</span>
                    <Badge variant={gift.isActive ? "default" : "secondary"}>
                      {gift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gifts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gifts.map((gift) => (
          <Card key={gift._id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${gift.bgColor}`}>
                    <div className={gift.color}>
                      {getIconComponent(gift.icon)}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{gift.title}</CardTitle>
                    <Badge variant="outline">Order {gift.order}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={gift.isActive}
                    onCheckedChange={() => handleToggleStatus(gift._id)}
                  />
                  <Badge variant={gift.isActive ? "default" : "secondary"}>
                    {gift.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{gift.description}</p>
              <div className="p-2 bg-gray-50 rounded text-sm font-mono">
                {gift.reward}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{gift.usageCount} claims</span>
                {gift.lastUsed && (
                  <span>Last: {new Date(gift.lastUsed).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(gift)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Welcome Gift</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{gift.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(gift._id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gifts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No welcome gifts found. Create your first gift to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WelcomeGiftAdmin;
