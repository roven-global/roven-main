import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from '@/components/ui/MultiSelect';

// Schema and Types
export const couponSchema = z
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

export type CouponFormValues = z.infer<typeof couponSchema>;

export interface Coupon extends CouponFormValues {
  _id: string;
  usedCount: number;
  isActive: boolean;
}

// Props Interface
interface CouponFormProps {
  onSubmit: (data: CouponFormValues) => void;
  onCancel: () => void;
  editingCoupon: Coupon | null;
  categories: { _id: string; name: string }[];
}

export const CouponForm: React.FC<CouponFormProps> = ({ onSubmit, onCancel, editingCoupon, categories }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: editingCoupon ? {
      ...editingCoupon,
      validFrom: new Date(editingCoupon.validFrom).toISOString().split("T")[0],
      validTo: new Date(editingCoupon.validTo).toISOString().split("T")[0],
    } : {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>Basic information for the coupon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input id="code" {...register("code")} placeholder="e.g., WELCOME10" />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <Label htmlFor="name">Coupon Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Welcome Discount" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Describe the coupon offer..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discount</CardTitle>
          <CardDescription>Configure the discount type and value.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Discount Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="value">Discount Value ({discountType === 'percentage' ? '%' : '₹'})</Label>
            <Input id="value" type="number" {...register("value", { valueAsNumber: true })} />
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
          </div>
          {discountType === "percentage" && (
            <div>
              <Label htmlFor="maxDiscount">Max Discount (₹) - Optional</Label>
              <Input id="maxDiscount" type="number" {...register("maxDiscount", { valueAsNumber: true })} />
              {errors.maxDiscount && <p className="text-red-500 text-xs mt-1">{errors.maxDiscount.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Rules & Conditions</CardTitle>
          <CardDescription>Set the rules for how and when the coupon can be used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                    <Input id="minOrderAmount" type="number" {...register("minOrderAmount", { valueAsNumber: true })} />
                    {errors.minOrderAmount && <p className="text-red-500 text-xs mt-1">{errors.minOrderAmount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="maxOrderAmount">Max Order Amount (₹) - Optional</Label>
                    <Input id="maxOrderAmount" type="number" {...register("maxOrderAmount", { valueAsNumber: true })} />
                    {errors.maxOrderAmount && <p className="text-red-500 text-xs mt-1">{errors.maxOrderAmount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input id="usageLimit" type="number" {...register("usageLimit", { valueAsNumber: true })} />
                    {errors.usageLimit && <p className="text-red-500 text-xs mt-1">{errors.usageLimit.message}</p>}
                </div>
                <div>
                    <Label htmlFor="perUserLimit">Per User Limit</Label>
                    <Input id="perUserLimit" type="number" {...register("perUserLimit", { valueAsNumber: true })} />
                    {errors.perUserLimit && <p className="text-red-500 text-xs mt-1">{errors.perUserLimit.message}</p>}
                </div>
            </div>
            <div>
                <Label>Applicable Categories (optional)</Label>
                <Controller
                    name="applicableCategories"
                    control={control}
                    render={({ field }) => (
                    <MultiSelect
                        options={categories.map((c) => ({ value: c._id, label: c.name }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="All categories"
                    />
                    )}
                />
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <Controller
                    name="firstTimeUserOnly"
                    control={control}
                    render={({ field }) => ( <Checkbox id="firstTimeUserOnly" checked={field.value} onCheckedChange={field.onChange} /> )}
                />
                <Label htmlFor="firstTimeUserOnly">For first-time users only</Label>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Validity</CardTitle>
            <CardDescription>Set the dates the coupon is active.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" type="date" {...register("validFrom")} />
              {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom.message}</p>}
            </div>
            <div>
              <Label htmlFor="validTo">Valid To</Label>
              <Input id="validTo" type="date" {...register("validTo")} />
              {errors.validTo && <p className="text-red-500 text-xs mt-1">{errors.validTo.message}</p>}
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-sage hover:bg-forest">
          {editingCoupon ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
};
