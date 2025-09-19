import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import UploadCategory from "./UploadCategory";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: {
    url: string;
    public_id: string;
  };
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategories?: Category[];
  isActive: boolean;
  productsCount?: number;
  categoryRanking?: number;
  brandCategoryRanking?: number | null;
  createdAt: string;
  updatedAt: string;
}

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterParent, setFilterParent] = useState<string>("all");
  const [editingRankings, setEditingRankings] = useState<
    Record<string, string>
  >({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [rankingError, setRankingError] = useState<{
    categoryId: string;
    message: string;
  } | null>(null);
  const [pendingEditChange, setPendingEditChange] = useState<{
    categoryId: string;
    newCategoryId: string;
  } | null>(null);

  // Brand Category Ranking state
  const [editingBrandRankings, setEditingBrandRankings] = useState<
    Record<string, string>
  >({});
  const [editingBrandCategoryId, setEditingBrandCategoryId] = useState<
    string | null
  >(null);
  const [brandRankingError, setBrandRankingError] = useState<{
    categoryId: string;
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        method: SummaryApi.getAllCategories.method,
        url: SummaryApi.getAllCategories.url,
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowUploadDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowUploadDialog(true);
  };

  const handleUploadSuccess = () => {
    fetchCategories();
    setShowUploadDialog(false);
    setEditingCategory(null);

    // Trigger home page refresh by updating localStorage
    localStorage.setItem("categoriesUpdated", Date.now().toString());
    window.dispatchEvent(new Event("categoriesUpdated"));
  };

  const handleUploadClose = () => {
    setShowUploadDialog(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await Axios({
        method: SummaryApi.deleteCategory.method,
        url: `${SummaryApi.deleteCategory.url}/${categoryId}`,
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        fetchCategories();

        // Trigger home page refresh by updating localStorage
        localStorage.setItem("categoriesUpdated", Date.now().toString());
        window.dispatchEvent(new Event("categoriesUpdated"));
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await Axios({
        method: SummaryApi.bulkDeleteCategories.method,
        url: SummaryApi.bulkDeleteCategories.url,
        data: { ids: selectedCategories },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setSelectedCategories([]);
        fetchCategories();
      }
    } catch (error: any) {
      console.error("Error bulk deleting categories:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete categories",
        variant: "destructive",
      });
    }
  };

  const parentCategories = categories.filter((cat) => !cat.parentCategory);

  const getVisibleCategories = () => {
    if (searchTerm === "" && filterParent === "all") {
      return categories.filter((c) => !c.parentCategory);
    }

    const visibleIds = new Set<string>();
    const categoriesById = new Map(categories.map((c) => [c._id, c]));

    categories.forEach((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterParent === "all" ||
        (filterParent === "main" && !category.parentCategory) ||
        (filterParent === "sub" && !!category.parentCategory);

      if (matchesSearch && matchesFilter) {
        let current = category;
        while (current) {
          visibleIds.add(current._id);
          current = current.parentCategory
            ? categoriesById.get(current.parentCategory._id)
            : null;
        }
      }
    });

    return categories.filter((c) => !c.parentCategory && visibleIds.has(c._id));
  };

  const visibleTopLevelCategories = getVisibleCategories();
  const allVisibleIds = new Set<string>();
  const addWithChildren = (category: Category) => {
    allVisibleIds.add(category._id);
    categories
      .filter((c) => c.parentCategory?._id === category._id)
      .forEach(addWithChildren);
  };
  visibleTopLevelCategories.forEach(addWithChildren);
  const allVisibleCategories = categories.filter((c) =>
    allVisibleIds.has(c._id)
  );

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedCategories(allVisibleCategories.map((c) => c._id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  // Category Ranking handlers (mimicking Featured Ranking behavior)
  const handleEditRanking = (categoryId: string, currentRanking: number) => {
    // If another category is already being edited, handle the transition
    if (editingCategoryId && editingCategoryId !== categoryId) {
      // Check if there are unsaved changes in the current edit
      const currentValue = editingRankings[editingCategoryId];
      const currentCategory = categories.find(
        (c) => c._id === editingCategoryId
      );
      const hasUnsavedChanges =
        currentValue !== undefined &&
        currentValue !== (currentCategory?.categoryRanking || "").toString();

      if (hasUnsavedChanges) {
        // Show confirmation dialog for unsaved changes
        setPendingEditChange({
          categoryId: editingCategoryId,
          newCategoryId: categoryId,
        });
        return;
      } else {
        // No unsaved changes, just cancel the current edit
        handleCancelEdit(editingCategoryId);
      }
    }

    // Set the editing state
    setEditingCategoryId(categoryId);

    // If current ranking is 0, suggest next available rank
    const suggestedRank =
      currentRanking === 0
        ? calculateNextAvailableCategoryRank()
        : currentRanking;

    setEditingRankings((prev) => ({
      ...prev,
      [categoryId]: suggestedRank.toString(),
    }));
    setRankingError(null);
  };

  const handleCancelEdit = (categoryId: string) => {
    setEditingCategoryId(null);
    setEditingRankings((prev) => {
      const newState = { ...prev };
      delete newState[categoryId];
      return newState;
    });
    setRankingError(null);
  };

  const handleCategoryRankingInput = (categoryId: string, value: string) => {
    // Update local state for immediate UI feedback
    setEditingRankings((prev) => ({
      ...prev,
      [categoryId]: value,
    }));

    // Clear any ranking errors when user starts typing
    if (rankingError?.categoryId === categoryId) {
      setRankingError(null);
    }
  };

  // Validation functions for Category Ranking
  const validateCategoryRankUniqueness = (
    categoryId: string,
    rank: number
  ): boolean => {
    // Allow rank 0 without validation
    if (rank === 0) {
      return true;
    }

    // Check if any other category has the same rank
    const duplicateCategory = categories.find(
      (category) =>
        category._id !== categoryId && category.categoryRanking === rank
    );

    return !duplicateCategory; // Return true if no duplicate found
  };

  const calculateNextAvailableCategoryRank = (): number => {
    // Get all categories with rankings > 0
    const categoriesWithRanks = categories.filter(
      (category) => category.categoryRanking && category.categoryRanking > 0
    );

    // If no categories with ranks exist, default to 1
    if (categoriesWithRanks.length === 0) {
      return 1;
    }

    // Find the highest rank number
    const maxRank = Math.max(
      ...categoriesWithRanks.map((c) => c.categoryRanking || 0)
    );

    // Return the next available rank (max + 1)
    return maxRank + 1;
  };

  const validateCategoryRanking = (
    categoryId: string,
    value: string
  ): boolean => {
    if (value === "") {
      setRankingError({
        categoryId,
        message: "Category ranking cannot be empty. Please enter a number.",
      });
      return false;
    }

    const numericValue = parseInt(value);
    if (isNaN(numericValue) || numericValue < 0) {
      setRankingError({
        categoryId,
        message: "Category ranking must be a non-negative integer.",
      });
      return false;
    }

    // Check for duplicate ranks (allow 0 without validation)
    if (
      numericValue > 0 &&
      !validateCategoryRankUniqueness(categoryId, numericValue)
    ) {
      setRankingError({
        categoryId,
        message: `Rank ${numericValue} is already used by another category. Please choose a different rank.`,
      });
      return false;
    }

    return true;
  };

  const handleCategoryRankingSubmit = async (
    categoryId: string,
    value: string
  ) => {
    if (!validateCategoryRanking(categoryId, value)) {
      return;
    }

    const newRanking = parseInt(value);
    const currentCategory = categories.find((c) => c._id === categoryId);

    if (!currentCategory) {
      setRankingError({
        categoryId,
        message: "Category not found.",
      });
      return;
    }

    const oldRanking = currentCategory.categoryRanking || 0;

    // If ranking hasn't changed, no need to update
    if (oldRanking === newRanking) {
      handleCancelEdit(categoryId);
      return;
    }

    try {
      const response = await Axios({
        method: SummaryApi.updateCategoryRanking.method,
        url: `${SummaryApi.updateCategoryRanking.url}/${categoryId}/ranking`,
        data: {
          categoryRanking: newRanking,
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Category ranking updated successfully",
        });
        fetchCategories();
        handleCancelEdit(categoryId);

        // Trigger home page refresh by updating localStorage
        localStorage.setItem("categoriesUpdated", Date.now().toString());
        window.dispatchEvent(new Event("categoriesUpdated"));
      }
    } catch (error: any) {
      console.error("Error updating category ranking:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update category ranking",
        variant: "destructive",
      });
    }
  };

  // Brand Category Ranking handlers
  const handleEditBrandRanking = (
    categoryId: string,
    currentRanking: number
  ) => {
    // If another category is already being edited, handle the transition
    if (editingBrandCategoryId && editingBrandCategoryId !== categoryId) {
      // Check if there are unsaved changes in the current edit
      const currentValue = editingBrandRankings[editingBrandCategoryId];
      const currentCategory = categories.find(
        (c) => c._id === editingBrandCategoryId
      );
      const hasUnsavedChanges =
        currentValue !== undefined &&
        currentValue !==
          (currentCategory?.brandCategoryRanking || "").toString();

      if (hasUnsavedChanges) {
        setPendingEditChange({
          categoryId: editingBrandCategoryId,
          newCategoryId: categoryId,
        });
        return;
      }
    }

    const nextAvailableRank = calculateNextAvailableBrandCategoryRank();
    setEditingBrandCategoryId(categoryId);
    setEditingBrandRankings((prev) => ({
      ...prev,
      [categoryId]: nextAvailableRank.toString(),
    }));
    setBrandRankingError(null);
  };

  const handleBrandCategoryRankingInput = (
    categoryId: string,
    value: string
  ) => {
    setEditingBrandRankings((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
    setBrandRankingError(null);
  };

  const handleCancelBrandEdit = (categoryId: string) => {
    setEditingBrandCategoryId(null);
    setEditingBrandRankings((prev) => {
      const newState = { ...prev };
      delete newState[categoryId];
      return newState;
    });
    setBrandRankingError(null);
  };

  const calculateNextAvailableBrandCategoryRank = () => {
    const existingRankings = categories
      .map((cat) => cat.brandCategoryRanking)
      .filter((rank) => rank !== null && rank !== undefined && rank > 0);

    if (existingRankings.length === 0) return 1;

    const maxRanking = Math.max(...existingRankings);
    return maxRanking + 1;
  };

  const handleBrandCategoryRankingSubmit = async (
    categoryId: string,
    newRanking: string
  ) => {
    try {
      setBrandRankingError(null);

      // Validate the ranking
      if (newRanking === "" || newRanking === "0") {
        // Set to null for unranked
        const newRankingValue = null;

        const response = await Axios({
          method: "PUT",
          url: `${SummaryApi.updateCategory.url}/${categoryId}`,
          data: {
            brandCategoryRanking: newRankingValue,
          },
        });

        if (response.data.success) {
          toast({
            title: "Success",
            description: "Brand category ranking updated successfully",
          });
          fetchCategories();
          handleCancelBrandEdit(categoryId);

          // Trigger home page refresh
          localStorage.setItem("categoriesUpdated", Date.now().toString());
          window.dispatchEvent(new Event("categoriesUpdated"));
        }
        return;
      }

      const newRankingValue = parseInt(newRanking);
      if (isNaN(newRankingValue) || newRankingValue < 0) {
        setBrandRankingError({
          categoryId,
          message: "Brand category ranking must be a non-negative integer",
        });
        return;
      }

      // Check for duplicate ranking
      const duplicateCategory = categories.find(
        (cat) =>
          cat._id !== categoryId && cat.brandCategoryRanking === newRankingValue
      );

      if (duplicateCategory) {
        setBrandRankingError({
          categoryId,
          message: `Brand category ranking ${newRankingValue} is already used by "${duplicateCategory.name}"`,
        });
        return;
      }

      const response = await Axios({
        method: "PUT",
        url: `${SummaryApi.updateCategory.url}/${categoryId}`,
        data: {
          brandCategoryRanking: newRankingValue,
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Brand category ranking updated successfully",
        });
        fetchCategories();
        handleCancelBrandEdit(categoryId);

        // Trigger home page refresh
        localStorage.setItem("categoriesUpdated", Date.now().toString());
        window.dispatchEvent(new Event("categoriesUpdated"));
      }
    } catch (error: any) {
      console.error("Error updating brand category ranking:", error);
      setBrandRankingError({
        categoryId,
        message:
          error.response?.data?.message ||
          "Failed to update brand category ranking",
      });
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update brand category ranking",
        variant: "destructive",
      });
    }
  };

  const renderCategoryRow = (category: Category, level: number) => (
    <React.Fragment key={category._id}>
      <TableRow
        data-state={selectedCategories.includes(category._id) && "selected"}
        className={`transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${
          editingCategoryId === category._id
            ? "bg-primary/5 ring-1 ring-primary/20"
            : selectedCategories.includes(category._id)
            ? "bg-blue-50"
            : ""
        }`}
      >
        <TableCell
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
          className="py-4"
        >
          <Checkbox
            checked={selectedCategories.includes(category._id)}
            onCheckedChange={(checked) =>
              handleSelectCategory(category._id, !!checked)
            }
            aria-label={`Select category ${category.name}`}
          />
        </TableCell>
        <TableCell className="w-[80px] text-center py-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50 mx-auto">
            <img
              src={category.image.url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        </TableCell>
        <TableCell className="font-semibold text-foreground min-w-[150px] py-4">
          <div className="flex items-center gap-2">
            <span className="text-base">{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="min-w-[120px] py-4">
          {category.parentCategory ? (
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 bg-blue-50 px-3 py-1"
            >
              {category.parentCategory.name}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 px-3 py-1"
            >
              Main Category
            </Badge>
          )}
        </TableCell>
        <TableCell className="w-[165px] h-[40px] py-4">
          <div
            className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg text-xs font-medium w-[145px] h-[30px] ${
              editingCategoryId === category._id
                ? "bg-primary/90 ring-2 ring-primary/30 shadow-sm"
                : category.categoryRanking === 0
                ? "bg-gray-400 hover:bg-gray-500 shadow-sm"
                : "bg-primary hover:bg-primary/90 shadow-sm"
            }`}
            role="group"
            aria-label={`Category ranking: ${
              category.categoryRanking || "unranked"
            }`}
          >
            {/* Category Badge */}
            <span className="text-primary-foreground font-semibold text-xs">
              Rank
            </span>

            {editingCategoryId === category._id ? (
              // Edit Mode: Input with OK/Cancel buttons
              <>
                <Input
                  type="number"
                  min="0"
                  value={
                    editingRankings[category._id] !== undefined
                      ? editingRankings[category._id]
                      : category.categoryRanking || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    handleCategoryRankingInput(category._id, value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCategoryRankingSubmit(
                        category._id,
                        editingRankings[category._id] || ""
                      );
                    } else if (e.key === "Escape") {
                      handleCancelEdit(category._id);
                    }
                  }}
                  className={`w-[45px] h-5 px-1 text-xs font-medium text-center bg-white/90 flex-shrink-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                    rankingError?.categoryId === category._id
                      ? "border-[#B0B4B8] focus:border-[#B0B4B8] focus:ring-1 focus:ring-[#B0B4B8]/30"
                      : "border-white/20 focus:border-white focus:ring-1 focus:ring-white/30 hover:bg-white"
                  }`}
                  placeholder="0"
                  autoFocus
                  aria-label="Edit category ranking number"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-white hover:text-primary hover:bg-white/90 flex-shrink-0"
                  onClick={() =>
                    handleCategoryRankingSubmit(
                      category._id,
                      editingRankings[category._id] || ""
                    )
                  }
                  title="Save changes"
                  aria-label="Save ranking changes"
                >
                  <Check className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-white hover:text-destructive hover:bg-white/90 flex-shrink-0"
                  onClick={() => handleCancelEdit(category._id)}
                  title="Cancel changes"
                  aria-label="Cancel ranking changes"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </>
            ) : (
              // Display Mode: Ranking number with Edit button
              <>
                <span
                  className={`font-bold text-xs w-[45px] h-5 text-center inline-flex items-center justify-center ${
                    category.categoryRanking === 0
                      ? "text-white opacity-90"
                      : "text-primary-foreground"
                  }`}
                >
                  {category.categoryRanking === 0
                    ? "0"
                    : category.categoryRanking || ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    editingCategoryId !== null &&
                    editingCategoryId !== category._id
                  }
                  className={`h-5 w-5 p-0 ${
                    editingCategoryId !== null &&
                    editingCategoryId !== category._id
                      ? "text-white/40 cursor-not-allowed"
                      : category.categoryRanking === 0
                      ? "text-white/80 hover:text-white hover:bg-white/20"
                      : "text-white/80 hover:text-white hover:bg-white/20"
                  }`}
                  onClick={() =>
                    handleEditRanking(
                      category._id,
                      category.categoryRanking || 0
                    )
                  }
                  title={
                    editingCategoryId !== null &&
                    editingCategoryId !== category._id
                      ? "Another category is being edited"
                      : `Edit ranking (Next available: ${calculateNextAvailableCategoryRank()})`
                  }
                  aria-label="Edit category ranking"
                >
                  <Edit className="h-2.5 w-2.5" />
                </Button>
              </>
            )}
          </div>
          {rankingError && rankingError.categoryId === category._id && (
            <div className="text-xs text-red-500 mt-1">
              {rankingError.message}
            </div>
          )}
        </TableCell>
        <TableCell className="w-[165px] h-[40px] py-4">
          <div
            className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg text-xs font-medium w-[145px] h-[30px] ${
              editingBrandCategoryId === category._id
                ? "bg-primary/90 ring-2 ring-primary/30 shadow-sm"
                : category.brandCategoryRanking === null ||
                  category.brandCategoryRanking === 0
                ? "bg-gray-400 hover:bg-gray-500 shadow-sm"
                : "bg-primary hover:bg-primary/90 shadow-sm"
            }`}
            role="group"
            aria-label={`Brand category ranking: ${
              category.brandCategoryRanking || "unranked"
            }`}
          >
            {/* Brand Category Badge */}
            <span className="text-primary-foreground font-semibold text-xs">
              Brand
            </span>

            {editingBrandCategoryId === category._id ? (
              // Edit Mode: Input with OK/Cancel buttons
              <>
                <Input
                  type="number"
                  min="0"
                  value={
                    editingBrandRankings[category._id] !== undefined
                      ? editingBrandRankings[category._id]
                      : category.brandCategoryRanking || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    handleBrandCategoryRankingInput(category._id, value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBrandCategoryRankingSubmit(
                        category._id,
                        editingBrandRankings[category._id] || ""
                      );
                    } else if (e.key === "Escape") {
                      handleCancelBrandEdit(category._id);
                    }
                  }}
                  className={`w-[45px] h-5 px-1 text-xs font-medium text-center bg-white/90 flex-shrink-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                    brandRankingError?.categoryId === category._id
                      ? "border-[#B0B4B8] focus:border-[#B0B4B8] focus:ring-1 focus:ring-[#B0B4B8]/30"
                      : "border-white/20 focus:border-white focus:ring-1 focus:ring-white/30 hover:bg-white"
                  }`}
                  placeholder="0"
                  autoFocus
                  aria-label="Edit brand category ranking number"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-white hover:text-primary hover:bg-white/90 flex-shrink-0"
                  onClick={() =>
                    handleBrandCategoryRankingSubmit(
                      category._id,
                      editingBrandRankings[category._id] || ""
                    )
                  }
                  title="Save changes"
                  aria-label="Save ranking changes"
                >
                  <Check className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-white hover:text-destructive hover:bg-white/90 flex-shrink-0"
                  onClick={() => handleCancelBrandEdit(category._id)}
                  title="Cancel changes"
                  aria-label="Cancel ranking changes"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </>
            ) : (
              // Display Mode: Show ranking with edit button
              <>
                <span
                  className={`font-bold text-xs w-[45px] h-5 text-center inline-flex items-center justify-center ${
                    category.brandCategoryRanking === 0 ||
                    category.brandCategoryRanking === null
                      ? "text-white opacity-90"
                      : "text-primary-foreground"
                  }`}
                >
                  {category.brandCategoryRanking === 0 ||
                  category.brandCategoryRanking === null
                    ? "0"
                    : category.brandCategoryRanking || ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    editingBrandCategoryId !== null &&
                    editingBrandCategoryId !== category._id
                  }
                  className={`h-5 w-5 p-0 ${
                    editingBrandCategoryId !== null &&
                    editingBrandCategoryId !== category._id
                      ? "text-white/40 cursor-not-allowed"
                      : category.brandCategoryRanking === 0 ||
                        category.brandCategoryRanking === null
                      ? "text-white/80 hover:text-white hover:bg-white/20"
                      : "text-white/80 hover:text-white hover:bg-white/20"
                  }`}
                  onClick={() =>
                    handleEditBrandRanking(
                      category._id,
                      category.brandCategoryRanking || 0
                    )
                  }
                  title={
                    editingBrandCategoryId !== null &&
                    editingBrandCategoryId !== category._id
                      ? "Another category is being edited"
                      : `Edit brand category ranking (Next available: ${calculateNextAvailableBrandCategoryRank()})`
                  }
                  aria-label="Edit brand category ranking"
                >
                  <Edit className="h-2.5 w-2.5" />
                </Button>
              </>
            )}
          </div>
          {brandRankingError &&
            brandRankingError.categoryId === category._id && (
              <div className="text-xs text-red-500 mt-1">
                {brandRankingError.message}
              </div>
            )}
        </TableCell>
        <TableCell className="min-w-[80px] text-center py-4">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 px-3 py-1 font-semibold"
          >
            {category.productsCount || 0}
          </Badge>
        </TableCell>
        <TableCell className="text-foreground min-w-[100px] text-sm py-4">
          <span className="text-gray-600">
            {new Date(category.createdAt).toLocaleDateString()}
          </span>
        </TableCell>
        <TableCell className="min-w-[120px] py-4">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditCategory(category)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">
                    Delete Category
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Are you sure you want to delete "{category.name}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteCategory(category._id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      {categories
        .filter((c) => c.parentCategory?._id === category._id)
        .map((subCat) => renderCategoryRow(subCat, level + 1))}
    </React.Fragment>
  );

  return (
    <>
      <PageHeader
        title="Category Management"
        description="Manage your product categories."
        buttonText="Add Category"
        onButtonClick={handleAddCategory}
      />
      <Card className="rounded-xl border border-admin-border bg-admin-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-semibold">
                <Filter className="h-5 w-5 text-blue-600" />
                Categories
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Manage your product categories and their hierarchy
              </CardDescription>
            </div>
            {selectedCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-admin-muted">
                  {selectedCategories.length} selected
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete Selected</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-admin-card border-admin-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-admin-text">
                        Are you sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-admin-muted">
                        This will permanently delete {selectedCategories.length}{" "}
                        categories. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-admin-border text-admin-text hover:bg-admin-accent hover:text-admin-text">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-6 border-t border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm h-10"
              />
            </div>
            <div className="flex gap-3 items-center">
              <Select value={filterParent} onValueChange={setFilterParent}>
                <SelectTrigger className="w-48 bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm h-10">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-gray-900 focus:bg-blue-50 focus:text-blue-900"
                  >
                    All Categories
                  </SelectItem>
                  <SelectItem
                    value="main"
                    className="text-gray-900 focus:bg-blue-50 focus:text-blue-900"
                  >
                    Main Categories
                  </SelectItem>
                  <SelectItem
                    value="sub"
                    className="text-gray-900 focus:bg-blue-50 focus:text-blue-900"
                  >
                    Subcategories
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading categories...</div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-gray-200">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="w-[60px]">
                      <Checkbox
                        checked={
                          allVisibleCategories.length > 0 &&
                          selectedCategories.length ===
                            allVisibleCategories.length
                            ? true
                            : selectedCategories.length > 0
                            ? "indeterminate"
                            : false
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold w-[80px] text-center py-4">
                      Image
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold min-w-[150px] py-4">
                      Name
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold min-w-[120px] py-4">
                      Parent
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold w-[165px] py-4">
                      Category Ranking
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold w-[165px] py-4">
                      Brand Category Ranking
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold min-w-[80px] text-center py-4">
                      Products
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold min-w-[100px] py-4">
                      Created
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold min-w-[120px] py-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {visibleTopLevelCategories.map((cat) =>
                    renderCategoryRow(cat, 0)
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadCategory
        open={showUploadDialog}
        onClose={handleUploadClose}
        onSuccess={handleUploadSuccess}
        editingCategory={editingCategory}
        parentCategories={parentCategories}
      />

      {/* Pending Edit Change Dialog */}
      {pendingEditChange && (
        <AlertDialog
          open={!!pendingEditChange}
          onOpenChange={() => setPendingEditChange(null)}
        >
          <AlertDialogContent className="max-w-[420px] min-w-[350px] mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-admin-text">
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription className="text-admin-muted">
                You have unsaved changes to the category ranking. Do you want to
                discard these changes and edit a different category?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setPendingEditChange(null)}
                className="border-admin-border text-admin-text hover:bg-admin-accent hover:text-admin-text"
              >
                Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingEditChange) {
                    handleCancelEdit(pendingEditChange.categoryId);
                    handleEditRanking(
                      pendingEditChange.newCategoryId,
                      categories.find(
                        (c) => c._id === pendingEditChange.newCategoryId
                      )?.categoryRanking || 0
                    );
                    setPendingEditChange(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default CategoryPage;
