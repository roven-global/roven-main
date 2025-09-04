import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { formatRupees } from "@/lib/currency";
import { CouponForm } from "@/components/CouponForm";
import type { CouponFormValues, Coupon } from "@/components/CouponForm";

interface CouponAdmin extends Coupon {
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const CouponAdmin = () => {
  const [coupons, setCoupons] = useState<CouponAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
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
    const fetchCategories = async () => {
      try {
        const res = await Axios.get(SummaryApi.getAllCategories.url);
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        toast({
          title: "Error fetching categories",
          variant: "destructive",
        });
      }
    };
    fetchCategories();
  }, []);

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
      const response = editingCoupon
        ? await Axios.put(
            SummaryApi.updateCoupon.url.replace(":id", editingCoupon._id),
            data
          )
        : await Axios.post(SummaryApi.createCoupon.url, data);

      if (response.data.success) {
        toast({
          title: `Coupon ${
            editingCoupon ? "updated" : "created"
          } successfully!`,
        });
        fetchCoupons();
        setIsDialogOpen(false);
        setEditingCoupon(null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
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
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCoupon(null);
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
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground">
          Coupon Management
        </h2>
        <div className="flex items-center gap-2">
          <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  if (!analytics) fetchAnalytics();
                }}
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Coupon Analytics
                </DialogTitle>
              </DialogHeader>
              {analyticsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <h4 className="text-2xl font-bold">
                        {analytics.totalCoupons}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Total Coupons
                      </p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">
                        {analytics.activeCoupons}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Active Coupons
                      </p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">
                        {formatRupees(analytics.totalDiscountGiven)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Total Discount Given
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <h3 className="font-medium">Most Used Coupons</h3>
                    {analytics.mostUsedCoupons.map((coupon: any) => (
                      <div
                        key={coupon.couponId}
                        className="flex justify-between items-center bg-muted/10 p-2 rounded"
                      >
                        <span className="font-medium">
                          {coupon.name} ({coupon.code})
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {coupon.totalUsage} uses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Could not load analytics data.
                </p>
              )}
            </DialogContent>
          </Dialog>

          <Button
            onClick={openCreateDialog}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 w-4 h-4" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-input border-border text-foreground focus:ring-ring">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem
                  value="all"
                  className="text-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  value="active"
                  className="text-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="inactive"
                  className="text-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          {coupons.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No coupons found. Create your first coupon to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Coupon</TableHead>
                    <TableHead className="text-foreground">Discount</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Usage</TableHead>
                    <TableHead className="text-foreground">Validity</TableHead>
                    <TableHead className="text-right text-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <div className="font-medium">{coupon.name}</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted/20 px-1 rounded w-min">
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
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
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
                            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalItems} total)
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingCoupon
                ? "Update the coupon details."
                : "Add a new promotional coupon to your system."}
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            onSubmit={onSubmit}
            onCancel={() => setIsDialogOpen(false)}
            editingCoupon={editingCoupon}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponAdmin;
