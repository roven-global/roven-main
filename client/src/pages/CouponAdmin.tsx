import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { formatRupees } from "@/lib/currency";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiSelect } from "@/components/ui/MultiSelect";

const couponSchema = z
  .object({
    code: z
      .string()
      .min(1, "Coupon code is required")
      .max(20, "Code cannot exceed 20 characters")
      .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers"),
    name: z
      .string()
      .min(1, "Coupon name is required")
      .max(100, "Name cannot exceed 100 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0, "Value must be positive"),
    maxDiscount: z.preprocess(
      (val) =>
        String(val).trim() === "" || isNaN(Number(val)) ? null : Number(val),
      z.number().min(0).optional().nullable()
    ),
    minOrderAmount: z.number().min(0),
    maxOrderAmount: z.preprocess(
      (val) =>
        String(val).trim() === "" || isNaN(Number(val)) ? null : Number(val),
      z.number().min(0).optional().nullable()
    ),
    usageLimit: z.number().int().min(1, "Usage limit must be at least 1"),
    perUserLimit: z.number().int().min(1, "Per user limit must be at least 1"),
    validFrom: z.string().min(1, "Valid from date is required"),
    validTo: z.string().min(1, "Valid to date is required"),
    firstTimeUserOnly: z.boolean(),
    applicableCategories: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "percentage") {
        return data.value > 0 && data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage value must be between 1 and 100",
      path: ["value"],
    }
  )
  .refine((data) => new Date(data.validTo) > new Date(data.validFrom), {
    message: "End date must be after start date",
    path: ["validTo"],
  });

type CouponFormValues = z.infer<typeof couponSchema>;

interface Coupon extends CouponFormValues {
  _id: string;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const CouponAdmin = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await Axios.get(SummaryApi.getCouponAnalytics.url);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      toast({ title: "Error fetching analytics", variant: "destructive" });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          Axios.get(SummaryApi.getAllProducts.url),
          Axios.get(SummaryApi.getAllCategories.url),
        ]);
        if (productsRes.data.success) {
          setProducts(productsRes.data.data.products);
        }
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }
      } catch (error) {
        toast({
          title: "Error fetching products/categories",
          variant: "destructive",
        });
      }
    };
    fetchProductsAndCategories();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      maxDiscount: undefined,
      minOrderAmount: 0,
      maxOrderAmount: undefined,
      usageLimit: 100,
      perUserLimit: 1,
      validFrom: "",
      validTo: "",
      firstTimeUserOnly: false,
      applicableCategories: [],
    },
  });

  const discountType = watch("type");

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await Axios.get(
        `${SummaryApi.getAllCoupons.url}?${params}`
      );
      if (response.data.success) {
        setCoupons(response.data.data.coupons);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching coupons",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, searchTerm, statusFilter]);

  const onSubmit = async (data: CouponFormValues) => {
    try {
      if (editingCoupon) {
        const url = SummaryApi.updateCoupon.url.replace(
          ":id",
          editingCoupon._id
        );
        const response = await Axios.put(url, data);
        if (response.data.success) {
          toast({ title: "Coupon updated successfully" });
        }
      } else {
        const response = await Axios.post(SummaryApi.createCoupon.url, data);
        if (response.data.success) {
          toast({ title: "Coupon created successfully" });
        }
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      if (typeof errorMessage === "string" && errorMessage.includes("code")) {
        setError("code", { type: "manual", message: errorMessage });
      }
      toast({
        title: "Error saving coupon",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const url = SummaryApi.deleteCoupon.url.replace(":id", couponId);
      await Axios.delete(url);
      toast({ title: "Coupon deleted successfully" });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error deleting coupon",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (couponId: string) => {
    try {
      const url = SummaryApi.toggleCouponStatus.url.replace(":id", couponId);
      const response = await Axios.patch(url);
      toast({
        title: "Coupon status updated",
        description: response.data.message,
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      ...coupon,
      validFrom: new Date(coupon.validFrom).toISOString().split("T")[0],
      validTo: new Date(coupon.validTo).toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCoupon(null);
    reset({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      maxDiscount: undefined,
      minOrderAmount: 0,
      maxOrderAmount: undefined,
      usageLimit: 100,
      perUserLimit: 1,
      validFrom: "",
      validTo: "",
      firstTimeUserOnly: false,
      applicableCategories: [],
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);
    const isExpired = now > validTo;
    const isNotStarted = now < validFrom;
    const isExhausted = coupon.usedCount >= coupon.usageLimit;

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isNotStarted) {
      return <Badge variant="outline">Not Started</Badge>;
    }
    if (isExhausted) {
      return <Badge variant="destructive">Exhausted</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}%${
        coupon.maxDiscount ? ` (max ${formatRupees(coupon.maxDiscount)})` : ""
      }`;
    }
    return formatRupees(coupon.value);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-sans text-3xl font-bold tracking-tight text-deep-forest">
          Coupon Management
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowAnalytics(!showAnalytics);
              if (!analytics) fetchAnalytics();
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={openCreateDialog}
            className="bg-sage hover:bg-forest text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Coupon Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="text-2xl font-bold">
                      {analytics.totalCoupons}
                    </h4>
                    <p className="text-sm text-gray-600">Total Coupons</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="text-2xl font-bold">
                      {analytics.activeCoupons}
                    </h4>
                    <p className="text-sm text-gray-600">Active Coupons</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="text-2xl font-bold">
                      {formatRupees(analytics.totalDiscountGiven)}
                    </h4>
                    <p className="text-sm text-gray-600">Total Discount Given</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Most Used Coupons</h4>
                  <div className="space-y-2">
                    {analytics.mostUsedCoupons.map((coupon: any) => (
                      <div
                        key={coupon.couponId}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <span className="font-medium">
                          {coupon.name} ({coupon.code})
                        </span>
                        <span className="text-sm text-gray-600">
                          {coupon.totalUsage} uses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">
                Could not load analytics data.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        </div>
      ) : (
        <div>
          {coupons.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No coupons found. Create your first coupon to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <div className="font-medium">{coupon.name}</div>
                        <div className="text-sm text-gray-500 font-mono bg-gray-100 px-1 rounded w-min">
                          {coupon.code}
                        </div>
                      </TableCell>
                      <TableCell>{getDiscountDisplay(coupon)}</TableCell>
                      <TableCell>{getStatusBadge(coupon)}</TableCell>
                      <TableCell>
                        {coupon.usedCount}/{coupon.usageLimit}
                      </TableCell>
                      <TableCell>
                        {new Date(coupon.validFrom).toLocaleDateString()} -{" "}
                        {new Date(coupon.validTo).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(coupon._id)}
                          >
                            {coupon.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-forest">
            Page {currentPage} of {totalPages} ({totalItems} total)
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? "Update the coupon details."
                : "Add a new promotional coupon to your system."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4 py-4"
          >
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g., WELCOME10"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.code.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Coupon Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Welcome Discount"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the coupon offer..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Separator className="col-span-2" />
            <h4 className="col-span-2 font-medium text-sm text-gray-700">
              Restrictions
            </h4>

            <div className="col-span-2">
              <Label>Applicable Categories</Label>
              <Controller
                name="applicableCategories"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={categories.map((c) => ({
                      value: c._id,
                      label: c.name,
                    }))}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="All categories"
                  />
                )}
              />
            </div>

            <Separator className="col-span-2" />

            <div>
              <Label>Discount Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="value">Discount Value</Label>
              <Input
                id="value"
                type="number"
                {...register("value", { valueAsNumber: true })}
              />
              {errors.value && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.value.message}
                </p>
              )}
            </div>
            {discountType === "percentage" && (
              <div>
                <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  {...register("maxDiscount", { valueAsNumber: true })}
                  placeholder="Optional"
                />
                {errors.maxDiscount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.maxDiscount.message}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                {...register("minOrderAmount", { valueAsNumber: true })}
              />
              {errors.minOrderAmount && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.minOrderAmount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="maxOrderAmount">Max Order Amount (₹)</Label>
              <Input
                id="maxOrderAmount"
                type="number"
                {...register("maxOrderAmount", { valueAsNumber: true })}
                placeholder="Optional"
              />
              {errors.maxOrderAmount && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.maxOrderAmount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="usageLimit">Total Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                {...register("usageLimit", { valueAsNumber: true })}
              />
              {errors.usageLimit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.usageLimit.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="perUserLimit">Per User Limit</Label>
              <Input
                id="perUserLimit"
                type="number"
                {...register("perUserLimit", { valueAsNumber: true })}
              />
              {errors.perUserLimit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.perUserLimit.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" type="date" {...register("validFrom")} />
              {errors.validFrom && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.validFrom.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="validTo">Valid To</Label>
              <Input id="validTo" type="date" {...register("validTo")} />
              {errors.validTo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.validTo.message}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="firstTimeUserOnly"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="firstTimeUserOnly"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="firstTimeUserOnly">First-time users only</Label>
              </div>
              {errors.firstTimeUserOnly && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.firstTimeUserOnly.message}
                </p>
              )}
            </div>
            <DialogFooter className="col-span-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-sage hover:bg-forest">
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponAdmin;
