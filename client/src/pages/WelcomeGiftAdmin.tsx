import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Save,
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import {
  WelcomeGiftForm,
  type WelcomeGiftFormValues,
  type WelcomeGift,
} from "@/components/WelcomeGiftForm";

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

const WelcomeGiftAdmin = () => {
  const [gifts, setGifts] = useState<WelcomeGift[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<WelcomeGift | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [activeGiftLimit, setActiveGiftLimit] = useState<number>(6);
  const [newLimit, setNewLimit] = useState<number>(6);

  const fetchSettings = async () => {
    try {
      const url = SummaryApi.getAdminSetting.url.replace(
        ":key",
        "activeWelcomeGiftLimit"
      );
      const response = await Axios.get(url);
      if (response.data.success) {
        const limit = Number(response.data.data.value);
        setActiveGiftLimit(limit);
        setNewLimit(limit);
      }
    } catch (error) {
      console.log("Could not fetch active gift limit setting, using default.");
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await Axios.get(SummaryApi.getAllWelcomeGiftsAdmin.url);
      if (response.data.success) {
        setGifts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching gifts:", error);
      toast({ title: "Error fetching gifts", variant: "destructive" });
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
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await Axios.get(SummaryApi.getAllCategories.url);
      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories", error);
      toast({ title: "Error fetching categories", variant: "destructive" });
      setCategories([]);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchGifts(),
        fetchAnalytics(),
        fetchSettings(),
        fetchCategories(),
      ]);
    };
    fetchInitialData();
  }, []);

  const openCreateForm = () => {
    setEditingGift(null);
    setIsDialogOpen(true);
  };

  const openEditForm = (gift: WelcomeGift) => {
    setEditingGift(gift);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: WelcomeGiftFormValues) => {
    try {
      const response = editingGift
        ? await Axios.put(
            SummaryApi.updateWelcomeGift.url.replace(":id", editingGift._id),
            data
          )
        : await Axios.post(SummaryApi.createWelcomeGift.url, data);

      if (response.data.success) {
        toast({
          title: `Welcome gift ${
            editingGift ? "updated" : "created"
          } successfully!`,
        });
        fetchGifts();
        fetchAnalytics();
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      toast({
        title: "Error saving welcome gift",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (giftId: string) => {
    try {
      const url = SummaryApi.deleteWelcomeGift.url.replace(":id", giftId);
      const response = await Axios.delete(url);
      if (response.data.success) {
        toast({ title: "Welcome gift deleted successfully!" });
        fetchGifts();
        fetchAnalytics();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting welcome gift",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (giftId: string) => {
    try {
      const url = SummaryApi.toggleWelcomeGiftStatus.url.replace(":id", giftId);
      const response = await Axios.patch(url);
      if (response.data.success) {
        toast({ title: "Welcome gift status updated!" });
        fetchGifts();
        fetchAnalytics();
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description:
          error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLimit = async () => {
    if (newLimit < 1 || newLimit > 20) {
      toast({
        title: "Invalid Limit",
        description: "Limit must be between 1 and 20.",
        variant: "destructive",
      });
      return;
    }
    try {
      const url = SummaryApi.updateAdminSetting.url.replace(
        ":key",
        "activeWelcomeGiftLimit"
      );
      const response = await Axios.put(url, { value: newLimit });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Active gift limit updated successfully!",
        });
        setActiveGiftLimit(newLimit);
      }
    } catch (error: any) {
      toast({
        title: "Error updating limit",
        description:
          error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
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
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">
            Welcome Gift Management
          </h1>
          <p className="text-muted-foreground">
            Manage welcome gift options for first-time visitors.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Analytics Dialog */}
          <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Welcome Gifts Analytics</DialogTitle>
              </DialogHeader>
              {analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics.totalGifts}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Gifts
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics.activeGifts}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Gifts
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics.totalUsage}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Claims
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <h3 className="font-medium">Gift Performance</h3>
                    {analytics.gifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex items-center justify-between p-2 bg-muted/10 rounded"
                      >
                        <span className="font-medium">{gift.title}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {gift.usageCount} claims
                          </span>
                          <Badge
                            variant={gift.isActive ? "default" : "secondary"}
                          >
                            {gift.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading analytics...</div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add Gift Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Gift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingGift ? "Edit Welcome Gift" : "Add New Welcome Gift"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingGift
                    ? "Update the details of this welcome gift."
                    : "Create a new welcome gift for users. Fill in the details below."}
                </DialogDescription>
              </DialogHeader>
              <WelcomeGiftForm
                onSubmit={onSubmit}
                onCancel={() => setIsDialogOpen(false)}
                editingGift={editingGift}
                categories={categories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Label htmlFor="activeGiftLimit">Active Gift Limit</Label>
          <Input
            id="activeGiftLimit"
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(Number(e.target.value))}
            className="w-24"
            min="1"
            max="20"
          />
          <Button onClick={handleUpdateLimit} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Limit
          </Button>
          {analytics && (
            <div className="ml-auto text-sm text-muted-foreground">
              <span className="font-bold">{analytics.activeGifts}</span> /{" "}
              {activeGiftLimit} active gifts
            </div>
          )}
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground">
                {gift.description}
              </p>
              <div className="p-2 bg-white rounded text-sm font-mono">
                {gift.reward}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{gift.usageCount} claims</span>
                {gift.lastUsed && (
                  <span>
                    Last: {new Date(gift.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditForm(gift)}
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
                        Are you sure you want to delete "{gift.title}"? This
                        action cannot be undone.
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
            <p className="text-gray-500">
              No welcome gifts found. Create your first gift to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WelcomeGiftAdmin;
