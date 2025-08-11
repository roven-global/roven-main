import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Award
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';

interface WelcomeGift {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  reward: string;
  rewardType: string;
  rewardValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  isActive: boolean;
  order: number;
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
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'fixed_amount', label: 'Fixed Amount Discount' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'buy_one_get_one', label: 'Buy One Get One Free' },
];

const WelcomeGiftAdmin = () => {
  const [gifts, setGifts] = useState<WelcomeGift[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingGift, setEditingGift] = useState<WelcomeGift | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Gift',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    reward: '',
    rewardType: 'percentage',
    rewardValue: 10,
    maxDiscount: null as number | null,
    minOrderAmount: 0,
    order: 1,
    isActive: true
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'Gift',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      reward: '',
      rewardType: 'percentage',
      rewardValue: 10,
      maxDiscount: null,
      minOrderAmount: 0,
      order: 1,
      isActive: true
    });
    setEditingGift(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGift) {
        const url = SummaryApi.updateWelcomeGift.url.replace(':id', editingGift._id);
        const response = await Axios.put(url, formData);
        if (response.data.success) {
          toast({ title: 'Welcome gift updated successfully!' });
          fetchGifts();
          fetchAnalytics();
        }
      } else {
        const response = await Axios.post(SummaryApi.createWelcomeGift.url, formData);
        if (response.data.success) {
          toast({ title: 'Welcome gift created successfully!' });
          fetchGifts();
          fetchAnalytics();
        }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error saving welcome gift',
        description: error.response?.data?.message,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (gift: WelcomeGift) => {
    setEditingGift(gift);
    setFormData({
      title: gift.title,
      description: gift.description,
      icon: gift.icon,
      color: gift.color,
      bgColor: gift.bgColor,
      reward: gift.reward,
      rewardType: gift.rewardType || 'percentage',
      rewardValue: gift.rewardValue || 10,
      maxDiscount: gift.maxDiscount,
      minOrderAmount: gift.minOrderAmount || 0,
      order: gift.order,
      isActive: gift.isActive
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
          <h1 className="text-2xl font-bold">Welcome Gift Management</h1>
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
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="order">Order (1-6)</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.order}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => handleSelectChange('icon', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {option.icon}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Text Color</Label>
                    <Select value={formData.color} onValueChange={(value) => handleSelectChange('color', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bgColor">Background Color</Label>
                    <Select value={formData.bgColor} onValueChange={(value) => handleSelectChange('bgColor', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bgColorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reward">Reward Text</Label>
                  <Input
                    id="reward"
                    name="reward"
                    value={formData.reward}
                    onChange={handleInputChange}
                    placeholder="e.g., Use code: WELCOME10"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
