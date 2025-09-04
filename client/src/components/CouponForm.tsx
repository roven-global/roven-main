import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/MultiSelect";

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

export const CouponForm: React.FC<CouponFormProps> = ({
  onSubmit,
  onCancel,
  editingCoupon,
  categories,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: editingCoupon
      ? {
          ...editingCoupon,
          validFrom: new Date(editingCoupon.validFrom)
            .toISOString()
            .split("T")[0],
          validTo: new Date(editingCoupon.validTo).toISOString().split("T")[0],
        }
      : {
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Coupon Details</CardTitle>
          <CardDescription className="text-muted-foreground">
            Basic information for the coupon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code" className="text-foreground">
                Coupon Code
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g., WELCOME10"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.code && (
                <p className="text-destructive text-xs mt-1">
                  {errors.code.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="name" className="text-foreground">
                Coupon Name
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Welcome Discount"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the coupon offer..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
            />
            {errors.description && (
              <p className="text-destructive text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Discount</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure the discount type and value.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">Discount Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-input border-border text-foreground focus:ring-ring">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem
                      value="percentage"
                      className="text-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      Percentage
                    </SelectItem>
                    <SelectItem
                      value="fixed"
                      className="text-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      Fixed Amount
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="value" className="text-foreground">
              Discount Value ({discountType === "percentage" ? "%" : "₹"})
            </Label>
            <Input
              id="value"
              type="number"
              {...register("value", { valueAsNumber: true })}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
            />
            {errors.value && (
              <p className="text-destructive text-xs mt-1">
                {errors.value.message}
              </p>
            )}
          </div>
          {discountType === "percentage" && (
            <div>
              <Label htmlFor="maxDiscount" className="text-foreground">
                Max Discount (₹) - Optional
              </Label>
              <Input
                id="maxDiscount"
                type="number"
                {...register("maxDiscount", { valueAsNumber: true })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.maxDiscount && (
                <p className="text-destructive text-xs mt-1">
                  {errors.maxDiscount.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Usage Rules & Conditions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Set the rules for how and when the coupon can be used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderAmount" className="text-foreground">
                Min Order Amount (₹)
              </Label>
              <Input
                id="minOrderAmount"
                type="number"
                {...register("minOrderAmount", { valueAsNumber: true })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.minOrderAmount && (
                <p className="text-destructive text-xs mt-1">
                  {errors.minOrderAmount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="maxOrderAmount" className="text-foreground">
                Max Order Amount (₹) - Optional
              </Label>
              <Input
                id="maxOrderAmount"
                type="number"
                {...register("maxOrderAmount", { valueAsNumber: true })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.maxOrderAmount && (
                <p className="text-destructive text-xs mt-1">
                  {errors.maxOrderAmount.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="usageLimit" className="text-foreground">
                Total Usage Limit
              </Label>
              <Input
                id="usageLimit"
                type="number"
                {...register("usageLimit", { valueAsNumber: true })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.usageLimit && (
                <p className="text-destructive text-xs mt-1">
                  {errors.usageLimit.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="perUserLimit" className="text-foreground">
                Per User Limit
              </Label>
              <Input
                id="perUserLimit"
                type="number"
                {...register("perUserLimit", { valueAsNumber: true })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
              />
              {errors.perUserLimit && (
                <p className="text-destructive text-xs mt-1">
                  {errors.perUserLimit.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-foreground">
              Applicable Categories (optional)
            </Label>
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
          <div className="flex items-center space-x-2 pt-2">
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
            <Label htmlFor="firstTimeUserOnly" className="text-foreground">
              For first-time users only
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Validity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set the dates the coupon is active.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="validFrom" className="text-foreground">
              Valid From
            </Label>
            <Input
              id="validFrom"
              type="date"
              {...register("validFrom")}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
            />
            {errors.validFrom && (
              <p className="text-destructive text-xs mt-1">
                {errors.validFrom.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="validTo" className="text-foreground">
              Valid To
            </Label>
            <Input
              id="validTo"
              type="date"
              {...register("validTo")}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
            />
            {errors.validTo && (
              <p className="text-destructive text-xs mt-1">
                {errors.validTo.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {editingCoupon ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
};
