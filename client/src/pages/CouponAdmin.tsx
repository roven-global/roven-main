import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { formatRupees } from '@/lib/currency';

interface Coupon {
    _id: string;
    code: string;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscount?: number;
    minOrderAmount: number;
    maxOrderAmount?: number;
    usageLimit: number;
    usedCount: number;
    perUserLimit: number;
    validFrom: string;
    validTo: string;
    firstTimeUserOnly: boolean;
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
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        maxDiscount: 0,
        minOrderAmount: 0,
        maxOrderAmount: 0,
        usageLimit: 1,
        perUserLimit: 1,
        validFrom: '',
        validTo: '',
        firstTimeUserOnly: false,
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                search: searchTerm,
            });

            // Only add status filter if it's not "all"
            if (statusFilter && statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await Axios.get(`${SummaryApi.getAllCoupons.url}?${params}`);
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

    const handleCreateCoupon = async () => {
        try {
            const response = await Axios.post(SummaryApi.createCoupon.url, formData);
            if (response.data.success) {
                toast({
                    title: "Coupon created successfully",
                    description: "The coupon has been added to your system",
                });
                setIsCreateDialogOpen(false);
                resetForm();
                fetchCoupons();
            }
        } catch (error: any) {
            toast({
                title: "Error creating coupon",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleUpdateCoupon = async () => {
        if (!selectedCoupon) return;
        try {
            const url = SummaryApi.updateCoupon.url.replace(':id', selectedCoupon._id);
            const response = await Axios.put(url, formData);
            if (response.data.success) {
                toast({
                    title: "Coupon updated successfully",
                    description: "The coupon has been updated",
                });
                setIsEditDialogOpen(false);
                resetForm();
                fetchCoupons();
            }
        } catch (error: any) {
            toast({
                title: "Error updating coupon",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const url = SummaryApi.deleteCoupon.url.replace(':id', couponId);
            const response = await Axios.delete(url);
            if (response.data.success) {
                toast({
                    title: "Coupon deleted successfully",
                    description: "The coupon has been removed",
                });
                fetchCoupons();
            }
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
            const url = SummaryApi.toggleCouponStatus.url.replace(':id', couponId);
            const response = await Axios.patch(url);
            if (response.data.success) {
                toast({
                    title: "Coupon status updated",
                    description: response.data.message,
                });
                fetchCoupons();
            }
        } catch (error: any) {
            toast({
                title: "Error updating status",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setFormData({
            code: coupon.code,
            name: coupon.name,
            description: coupon.description || '',
            type: coupon.type,
            value: coupon.value,
            maxDiscount: coupon.maxDiscount || 0,
            minOrderAmount: coupon.minOrderAmount,
            maxOrderAmount: coupon.maxOrderAmount || 0,
            usageLimit: coupon.usageLimit,
            perUserLimit: coupon.perUserLimit,
            validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
            validTo: new Date(coupon.validTo).toISOString().split('T')[0],
            firstTimeUserOnly: coupon.firstTimeUserOnly,
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            type: 'percentage',
            value: 0,
            maxDiscount: 0,
            minOrderAmount: 0,
            maxOrderAmount: 0,
            usageLimit: 1,
            perUserLimit: 1,
            validFrom: '',
            validTo: '',
            firstTimeUserOnly: false,
        });
        setSelectedCoupon(null);
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
        if (coupon.type === 'percentage') {
            return `${coupon.value}%${coupon.maxDiscount ? ` (max ${formatRupees(coupon.maxDiscount)})` : ''}`;
        }
        return formatRupees(coupon.value);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-deep-forest">Coupon Management</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-sage hover:bg-forest text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Coupon</DialogTitle>
                            <DialogDescription>
                                Add a new promotional coupon to your system
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="code">Coupon Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., WELCOME10"
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Coupon Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Welcome Discount"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the coupon offer..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Discount Type</Label>
                                <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="value">Discount Value</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                                />
                            </div>
                            {formData.type === 'percentage' && (
                                <div>
                                    <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                                    <Input
                                        id="maxDiscount"
                                        type="number"
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                                        placeholder="500"
                                    />
                                </div>
                            )}
                            <div>
                                <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                                <Input
                                    id="minOrderAmount"
                                    type="number"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                                    placeholder="100"
                                />
                            </div>
                            <div>
                                <Label htmlFor="maxOrderAmount">Max Order Amount (₹)</Label>
                                <Input
                                    id="maxOrderAmount"
                                    type="number"
                                    value={formData.maxOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, maxOrderAmount: parseFloat(e.target.value) || 0 })}
                                    placeholder="10000 (optional)"
                                />
                            </div>
                            <div>
                                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                                <Input
                                    id="usageLimit"
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 1 })}
                                    placeholder="1000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="perUserLimit">Per User Limit</Label>
                                <Input
                                    id="perUserLimit"
                                    type="number"
                                    value={formData.perUserLimit}
                                    onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 1 })}
                                    placeholder="1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="validFrom">Valid From</Label>
                                <Input
                                    id="validFrom"
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="validTo">Valid To</Label>
                                <Input
                                    id="validTo"
                                    type="date"
                                    value={formData.validTo}
                                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="firstTimeUserOnly"
                                        checked={formData.firstTimeUserOnly}
                                        onChange={(e) => setFormData({ ...formData, firstTimeUserOnly: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="firstTimeUserOnly">First-time users only</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateCoupon} className="bg-sage hover:bg-forest">
                                Create Coupon
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

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
                <div className="space-y-4">
                    {coupons.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">No coupons found. Create your first coupon to get started.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        coupons.map((coupon) => (
                            <Card key={coupon._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg text-deep-forest">{coupon.name}</h3>
                                                {getStatusBadge(coupon)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-forest mb-3">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{coupon.code}</span>
                                                <span className="flex items-center gap-1">
                                                    {coupon.type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                                    {getDiscountDisplay(coupon)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Min: {formatRupees(coupon.minOrderAmount)}
                                                </span>
                                            </div>
                                            {coupon.description && (
                                                <p className="text-sm text-forest mb-3">{coupon.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {coupon.usedCount}/{coupon.usageLimit} used
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validTo).toLocaleDateString()}
                                                </span>
                                                {coupon.firstTimeUserOnly && (
                                                    <Badge variant="outline" className="text-xs">First-time only</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleStatus(coupon._id)}
                                            >
                                                {coupon.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-forest">
                        Page {currentPage} of {totalPages} ({totalItems} total)
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Coupon</DialogTitle>
                        <DialogDescription>
                            Update the coupon details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-code">Coupon Code</Label>
                            <Input
                                id="edit-code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-name">Coupon Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-type">Discount Type</Label>
                            <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-value">Discount Value</Label>
                            <Input
                                id="edit-value"
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        {formData.type === 'percentage' && (
                            <div>
                                <Label htmlFor="edit-maxDiscount">Max Discount (₹)</Label>
                                <Input
                                    id="edit-maxDiscount"
                                    type="number"
                                    value={formData.maxDiscount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="edit-minOrderAmount">Min Order Amount (₹)</Label>
                            <Input
                                id="edit-minOrderAmount"
                                type="number"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-maxOrderAmount">Max Order Amount (₹)</Label>
                            <Input
                                id="edit-maxOrderAmount"
                                type="number"
                                value={formData.maxOrderAmount}
                                onChange={(e) => setFormData({ ...formData, maxOrderAmount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-usageLimit">Total Usage Limit</Label>
                            <Input
                                id="edit-usageLimit"
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-perUserLimit">Per User Limit</Label>
                            <Input
                                id="edit-perUserLimit"
                                type="number"
                                value={formData.perUserLimit}
                                onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-validFrom">Valid From</Label>
                            <Input
                                id="edit-validFrom"
                                type="date"
                                value={formData.validFrom}
                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-validTo">Valid To</Label>
                            <Input
                                id="edit-validTo"
                                type="date"
                                value={formData.validTo}
                                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="edit-firstTimeUserOnly"
                                    checked={formData.firstTimeUserOnly}
                                    onChange={(e) => setFormData({ ...formData, firstTimeUserOnly: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="edit-firstTimeUserOnly">First-time users only</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateCoupon} className="bg-sage hover:bg-forest">
                            Update Coupon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CouponAdmin;
