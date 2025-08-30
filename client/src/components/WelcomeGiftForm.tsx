import React, { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/MultiSelect";
import {
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

// Schema and Types
const welcomeGiftSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, "Title contains invalid characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description cannot exceed 200 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?()%₹]+$/,
      "Description contains invalid characters"
    ),
  icon: z.enum([
    "Percent",
    "Truck",
    "Gift",
    "Star",
    "DollarSign",
    "Clock",
    "Heart",
    "Shield",
    "Zap",
    "Award",
  ]),
  color: z
    .string()
    .regex(
      /^text-(green|blue|purple|yellow|red|indigo|pink|orange)-600$/,
      "Invalid color format"
    ),
  bgColor: z
    .string()
    .regex(
      /^bg-(green|blue|purple|yellow|red|indigo|pink|orange)-50 hover:bg-(green|blue|purple|yellow|red|indigo|pink|orange)-100$/,
      "Invalid background color format"
    ),
  reward: z
    .string()
    .min(1, "Reward text is required")
    .max(100, "Reward text cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?()%₹]+$/,
      "Reward text contains invalid characters"
    ),
  couponCode: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code cannot exceed 20 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Coupon code must be uppercase letters and numbers only"
    ),
  rewardType: z.enum(["percentage", "fixed_amount", "buy_one_get_one"]),
  rewardValue: z
    .number()
    .min(0, "Reward value cannot be negative")
    .max(100000, "Reward value is too high"),
  maxDiscount: z
    .number()
    .min(0, "Max discount cannot be negative")
    .max(100000, "Max discount is too high")
    .nullable()
    .optional(),
  minOrderAmount: z
    .number()
    .min(0, "Min order amount cannot be negative")
    .max(100000, "Min order amount is too high"),
  isActive: z.boolean(),
  buyQuantity: z
    .number()
    .int()
    .min(1, "Buy quantity must be at least 1")
    .optional(),
  getQuantity: z
    .number()
    .int()
    .min(1, "Get quantity must be at least 1")
    .optional(),
  applicableCategories: z.array(z.string()).optional(),
});

export type WelcomeGiftFormValues = z.infer<typeof welcomeGiftSchema>;

export interface WelcomeGift extends WelcomeGiftFormValues {
  _id: string;
  usageCount: number;
  lastUsed?: string;
}

// Props Interface
interface WelcomeGiftFormProps {
  onSubmit: (data: WelcomeGiftFormValues) => void;
  onCancel: () => void;
  editingGift: WelcomeGift | null;
  categories: { _id: string; name: string }[];
}

// Constants
const iconOptions = [
  { value: "Percent", label: "Percent", icon: <Percent className="w-4 h-4" /> },
  { value: "Truck", label: "Truck", icon: <Truck className="w-4 h-4" /> },
  { value: "Gift", label: "Gift", icon: <Gift className="w-4 h-4" /> },
  { value: "Star", label: "Star", icon: <Star className="w-4 h-4" /> },
  {
    value: "DollarSign",
    label: "Dollar Sign",
    icon: <DollarSign className="w-4 h-4" />,
  },
  { value: "Clock", label: "Clock", icon: <Clock className="w-4 h-4" /> },
  { value: "Heart", label: "Heart", icon: <Heart className="w-4 h-4" /> },
  { value: "Shield", label: "Shield", icon: <Shield className="w-4 h-4" /> },
  { value: "Zap", label: "Zap", icon: <Zap className="w-4 h-4" /> },
  { value: "Award", label: "Award", icon: <Award className="w-4 h-4" /> },
];

const colorOptions = [
  {
    value: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    label: "Green",
    swatch: "bg-green-500",
  },
  {
    value: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    label: "Blue",
    swatch: "bg-blue-500",
  },
  {
    value: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    label: "Purple",
    swatch: "bg-purple-500",
  },
  {
    value: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    label: "Yellow",
    swatch: "bg-yellow-500",
  },
  {
    value: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    label: "Red",
    swatch: "bg-red-500",
  },
  {
    value: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    label: "Indigo",
    swatch: "bg-indigo-500",
  },
  {
    value: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    label: "Pink",
    swatch: "bg-pink-500",
  },
  {
    value: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    label: "Orange",
    swatch: "bg-orange-500",
  },
];

const rewardTypeOptions = [
  {
    value: "percentage",
    label: "Percentage Discount",
    description: "e.g., 10% off",
  },
  {
    value: "fixed_amount",
    label: "Fixed Amount Discount",
    description: "e.g., ₹100 off",
  },
  {
    value: "buy_one_get_one",
    label: "Buy One Get One Free",
    description: "BOGO offer on products",
  },
];

export const WelcomeGiftForm: React.FC<WelcomeGiftFormProps> = ({
  onSubmit,
  onCancel,
  editingGift,
  categories,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WelcomeGiftFormValues>({
    resolver: zodResolver(welcomeGiftSchema),
    defaultValues: editingGift
      ? {
          ...editingGift,
          couponCode: editingGift.couponCode || "",
          rewardType: editingGift.rewardType || "percentage",
          rewardValue: editingGift.rewardValue || 10,
          maxDiscount: editingGift.maxDiscount,
          minOrderAmount: editingGift.minOrderAmount || 0,
          isActive: editingGift.isActive,
          buyQuantity: editingGift.buyQuantity || 1,
          getQuantity: editingGift.getQuantity || 1,
          applicableCategories: editingGift.applicableCategories || [],
        }
      : {
          title: "",
          description: "",
          icon: "Gift",
          color: "text-blue-600",
          bgColor: "bg-blue-50 hover:bg-blue-100",
          reward: "",
          couponCode: "",
          rewardType: "percentage",
          rewardValue: 10,
          maxDiscount: undefined,
          minOrderAmount: 0,
          isActive: true,
          buyQuantity: 1,
          getQuantity: 1,
          applicableCategories: [],
        },
  });

  const rewardType = watch("rewardType");
  const selectedColor = watch("color");

  useEffect(() => {
    if (rewardType === "buy_one_get_one") {
      setValue("rewardValue", 0);
      setValue("maxDiscount", undefined);
    }
  }, [rewardType, setValue]);

  const handleColorChange = (colorValue: string) => {
    const selected = colorOptions.find((c) => c.value === colorValue);
    if (selected) {
      setValue("color", selected.value, { shouldValidate: true });
      setValue("bgColor", selected.bgColor, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>How the gift will look to the user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
                )}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={handleColorChange} value={field.value}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            colorOptions.find((c) => c.value === field.value)
                              ?.swatch
                          }`}
                        ></div>
                        {
                          colorOptions.find((c) => c.value === field.value)
                            ?.label
                        }
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${option.swatch}`}
                            ></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Details</CardTitle>
          <CardDescription>
            Define the reward and how it's redeemed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reward">Reward Text</Label>
            <Input
              id="reward"
              {...register("reward")}
              placeholder="e.g., 'Get 10% OFF your first order!'"
            />
            {errors.reward && (
              <p className="text-red-500 text-xs mt-1">
                {errors.reward.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="couponCode">Coupon Code</Label>
            <Input
              id="couponCode"
              {...register("couponCode")}
              placeholder="e.g., WELCOME10"
            />
            {errors.couponCode && (
              <p className="text-red-500 text-xs mt-1">
                {errors.couponCode.message}
              </p>
            )}
          </div>
          <div>
            <Label>Reward Type</Label>
            <Controller
              name="rewardType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-gray-500">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {rewardType !== "buy_one_get_one" && (
        <Card>
          <CardHeader>
            <CardTitle>Discount Conditions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rewardValue">
                Reward Value ({rewardType === "percentage" ? "%" : "₹"})
              </Label>
              <Input
                id="rewardValue"
                type="number"
                {...register("rewardValue", { valueAsNumber: true })}
              />
              {errors.rewardValue && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.rewardValue.message}
                </p>
              )}
            </div>
            {rewardType === "percentage" && (
              <div>
                <Label htmlFor="maxDiscount">Max Discount (₹) - Optional</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  {...register("maxDiscount", { valueAsNumber: true })}
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
          </CardContent>
        </Card>
      )}

      {rewardType === "buy_one_get_one" && (
        <Card>
          <CardHeader>
            <CardTitle>BOGO Settings</CardTitle>
            <CardDescription>
              Configure the rules for your Buy One Get One offer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyQuantity">Buy Quantity</Label>
                <Input
                  id="buyQuantity"
                  type="number"
                  {...register("buyQuantity", { valueAsNumber: true })}
                />
                {errors.buyQuantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.buyQuantity.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="getQuantity">Get Quantity (Free)</Label>
                <Input
                  id="getQuantity"
                  type="number"
                  {...register("getQuantity", { valueAsNumber: true })}
                />
                {errors.getQuantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.getQuantity.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Applicable Categories (optional)</Label>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{editingGift ? "Update" : "Create"} Gift</Button>
      </div>
    </form>
  );
};
