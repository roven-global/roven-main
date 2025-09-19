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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Check,
  X,
  Star,
  Package,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { formatRupees } from "@/lib/currency";
import PageHeader from "@/components/ui/PageHeader";

interface ProductVariant {
  volume: string;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  variants?: ProductVariant[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  brand: string;
  sku: string;
  volume?: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  ranking: number;
  ranking_featured: number;
  products_ranking: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ProductAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("products_ranking");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [featuredPagination, setFeaturedPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [categories, setCategories] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [editingFeaturedRankings, setEditingFeaturedRankings] = useState<
    Record<string, string>
  >({});
  const [editingProductsRankings, setEditingProductsRankings] = useState<
    Record<string, string>
  >({});
  const [editingFeaturedProductId, setEditingFeaturedProductId] = useState<
    string | null
  >(null);
  const [editingProductsProductId, setEditingProductsProductId] = useState<
    string | null
  >(null);
  const [featuredRankingError, setFeaturedRankingError] = useState<{
    productId: string;
    message: string;
  } | null>(null);
  const [productsRankingError, setProductsRankingError] = useState<{
    productId: string;
    message: string;
  } | null>(null);
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(
    new Set()
  );
  const navigate = useNavigate();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchFeaturedProductsCount(); // Fetch featured products count on initial load
    fetchFeaturedProducts(); // Also fetch featured products to ensure sync
  }, [
    currentPage,
    searchTerm,
    categoryFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (activeTab === "featured") {
      fetchFeaturedProducts();
    }
  }, [featuredPage, activeTab]);

  useEffect(() => {
    setSelectedProducts([]);
  }, [products]);

  // Listen for product updates to refresh featured count
  useEffect(() => {
    const handleProductUpdate = () => {
      fetchFeaturedProductsCount();
    };

    window.addEventListener("productUpdated", handleProductUpdate);

    return () => {
      window.removeEventListener("productUpdated", handleProductUpdate);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await Axios({
        method: SummaryApi.getAllCategories.method,
        url: SummaryApi.getAllCategories.url,
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
        admin: "true", // Admin requests should see all products including rank 0
      });

      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);

      const response = await Axios({
        method: SummaryApi.getAllProducts.method,
        url: `${SummaryApi.getAllProducts.url}?${params.toString()}`,
      });

      if (response.data.success) {
        setProducts(response.data.data.products);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProductsCount = async () => {
    try {
      const response = await Axios({
        method: SummaryApi.getFeaturedProducts.method,
        url: `${SummaryApi.getFeaturedProducts.url}?page=1&limit=1&sortBy=ranking_featured&sortOrder=asc&admin=true`,
      });

      if (response.data.success) {
        setFeaturedPagination((prev) => ({
          ...prev,
          totalProducts: response.data.data.pagination.totalProducts,
        }));
      }
    } catch (error) {
      console.error("Error fetching featured products count:", error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);
      const params = new URLSearchParams({
        page: featuredPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: "ranking_featured",
        sortOrder: "asc",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);

      // Add admin parameter to bypass setting check
      params.append("admin", "true");

      const response = await Axios({
        method: SummaryApi.getFeaturedProducts.method,
        url: `${SummaryApi.getFeaturedProducts.url}?${params.toString()}`,
      });

      if (response.data.success) {
        setFeaturedProducts(response.data.data.products);
        setFeaturedPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch featured products",
        variant: "destructive",
      });
    } finally {
      setFeaturedLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await Axios({
        method: SummaryApi.deleteProduct.method,
        url: `${SummaryApi.deleteProduct.url}/${productId}`,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts();
      }
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await Axios({
        method: SummaryApi.bulkDeleteProducts.method,
        url: SummaryApi.bulkDeleteProducts.url,
        data: { ids: selectedProducts },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setSelectedProducts([]);
        fetchProducts();
        fetchFeaturedProductsCount(); // Refresh featured count
        if (activeTab === "featured") {
          fetchFeaturedProducts();
        }
      }
    } catch (error: any) {
      console.error("Error bulk deleting products:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete products",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (
    productId: string,
    currentFeaturedStatus: boolean
  ) => {
    // Prevent multiple rapid clicks
    if (togglingProducts.has(productId)) return;

    const newFeaturedStatus = !currentFeaturedStatus;
    // For new featured products, backend will assign rank 1 and shift existing ranks
    // For unfeatured products, set rank to 0
    const newRanking = newFeaturedStatus ? 1 : 0;

    // Store original state for potential rollback
    const originalProduct = products.find((p) => p._id === productId);
    if (!originalProduct) return;

    // Add to toggling set
    setTogglingProducts((prev) => new Set(prev).add(productId));

    try {
      // Update local state immediately for instant UI feedback
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === productId
            ? {
                ...product,
                isFeatured: newFeaturedStatus,
                ranking_featured: newRanking,
              }
            : product
        )
      );

      // Update featured products list immediately with proper sorting
      setFeaturedProducts((prevFeatured) => {
        if (newFeaturedStatus) {
          // Add to featured products if not already there
          const exists = prevFeatured.some((p) => p._id === productId);
          if (!exists) {
            const updatedProduct = {
              ...originalProduct,
              isFeatured: newFeaturedStatus,
              ranking_featured: newRanking,
            };

            // Add the product and sort by ranking_featured
            const newFeaturedList = [...prevFeatured, updatedProduct];
            return newFeaturedList.sort((a, b) => {
              const rankA = a.ranking_featured || 0;
              const rankB = b.ranking_featured || 0;
              return rankA - rankB;
            });
          }
        } else {
          // Remove from featured products
          return prevFeatured.filter((p) => p._id !== productId);
        }
        return prevFeatured;
      });

      // Update pagination counts immediately
      setFeaturedPagination((prev) => ({
        ...prev,
        totalProducts: newFeaturedStatus
          ? prev.totalProducts + 1
          : Math.max(0, prev.totalProducts - 1),
      }));

      // Make API call
      console.log(
        `Sending API request for product ${productId}: isFeatured=${newFeaturedStatus} (type: ${typeof newFeaturedStatus}), ranking_featured=${newRanking}`
      );

      const response = await Axios({
        method: SummaryApi.updateProduct.method,
        url: `${SummaryApi.updateProduct.url}/${productId}`,
        data: {
          isFeatured: newFeaturedStatus,
          ranking_featured: newRanking,
        },
      });

      if (response.data.success) {
        const updatedProduct = response.data.data;
        const actualRanking = updatedProduct.ranking_featured || 0;

        toast({
          title: "Success",
          description: `Product ${
            newFeaturedStatus ? "added to" : "removed from"
          } featured products${
            newFeaturedStatus ? ` with rank ${actualRanking}` : ""
          }`,
        });

        // Update local state with the actual ranking from backend
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId
              ? {
                  ...product,
                  isFeatured: newFeaturedStatus,
                  ranking_featured: actualRanking,
                }
              : product
          )
        );

        // Refresh data from server to ensure consistency
        fetchProducts();
        fetchFeaturedProductsCount(); // Refresh featured count

        // Always refresh featured products to ensure sync, regardless of current tab
        fetchFeaturedProducts();

        // Dispatch event to refresh featured products on homepage
        console.log("Dispatching productUpdated event from ProductAdmin...");
        window.dispatchEvent(new CustomEvent("productUpdated"));
      } else {
        // Revert to original state if API call failed
        revertToOriginalState(originalProduct);
        toast({
          title: "Error",
          description: "Failed to update featured status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error toggling featured status:", error);

      // Revert to original state on error
      revertToOriginalState(originalProduct);

      // Dispatch event to refresh featured products on homepage
      window.dispatchEvent(new CustomEvent("productUpdated"));

      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    } finally {
      // Remove from toggling set
      setTogglingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Helper function to revert state to original values
  const revertToOriginalState = (originalProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product._id === originalProduct._id ? originalProduct : product
      )
    );

    setFeaturedProducts((prevFeatured) => {
      if (originalProduct.isFeatured) {
        // Add back to featured products if it was originally featured
        const exists = prevFeatured.some((p) => p._id === originalProduct._id);
        if (!exists) {
          const newFeaturedList = [...prevFeatured, originalProduct];
          // Sort by ranking_featured to maintain proper order
          return newFeaturedList.sort((a, b) => {
            const rankA = a.ranking_featured || 0;
            const rankB = b.ranking_featured || 0;
            return rankA - rankB;
          });
        }
      } else {
        // Remove from featured products if it wasn't originally featured
        return prevFeatured.filter((p) => p._id !== originalProduct._id);
      }
      return prevFeatured;
    });

    setFeaturedPagination((prev) => ({
      ...prev,
      totalProducts: originalProduct.isFeatured
        ? prev.totalProducts + 1
        : Math.max(0, prev.totalProducts - 1),
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedProducts(products.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) =>
      checked ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  const generatePaginationItems = () => {
    const items = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pagination.totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const handleFeaturedRankingChange = async (
    productId: string,
    newRanking: number
  ) => {
    try {
      // Find the current product to get old ranking
      const currentProduct = products.find((p) => p._id === productId);
      if (!currentProduct) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        });
        return;
      }

      const oldRanking = currentProduct.ranking_featured || 0;

      // If ranking hasn't changed, no need to update
      if (oldRanking === newRanking) {
        return;
      }

      // Prepare ranking shift data
      const rankingShiftData = {
        productId,
        oldRanking,
        newRanking,
        shiftType: newRanking < oldRanking ? "shift_down" : "shift_up",
      };

      const response = await Axios({
        method: SummaryApi.updateProductFeaturedRanking.method,
        url: `${SummaryApi.updateProductFeaturedRanking.url}/${productId}/featured-ranking`,
        data: {
          ranking_featured: newRanking,
          ranking_shift: rankingShiftData,
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Featured ranking updated successfully",
        });

        // Refresh both product lists to maintain correct sorting
        fetchProducts();
        if (activeTab === "featured") {
          fetchFeaturedProducts();
        }

        // Dispatch event to refresh featured products on homepage
        window.dispatchEvent(new CustomEvent("productUpdated"));
      }
    } catch (error: any) {
      console.error("Error updating featured ranking:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update featured ranking",
        variant: "destructive",
      });
    }
  };

  const handleProductsRankingChange = async (
    productId: string,
    newRanking: number
  ) => {
    try {
      // Find the current product to get old ranking
      const currentProduct = products.find((p) => p._id === productId);
      if (!currentProduct) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        });
        return;
      }

      const oldRanking = currentProduct.products_ranking || 0;

      // If ranking hasn't changed, no need to update
      if (oldRanking === newRanking) {
        return;
      }

      // Prepare ranking shift data
      const rankingShiftData = {
        productId,
        oldRanking,
        newRanking,
        shiftType: newRanking < oldRanking ? "shift_down" : "shift_up",
      };

      const response = await Axios({
        method: SummaryApi.updateProductsRanking.method,
        url: `${SummaryApi.updateProductsRanking.url}/${productId}/products-ranking`,
        data: {
          products_ranking: newRanking,
          ranking_shift: rankingShiftData,
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Products ranking updated successfully",
        });

        // Refresh both product lists to maintain correct sorting
        fetchProducts();
        if (activeTab === "featured") {
          fetchFeaturedProducts();
        }

        // Dispatch event to refresh products on shop page
        window.dispatchEvent(new CustomEvent("productUpdated"));
      }
    } catch (error: any) {
      console.error("Error updating products ranking:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update products ranking",
        variant: "destructive",
      });
    }
  };

  const handleFeaturedRankingInput = (productId: string, value: string) => {
    // Update local state for immediate UI feedback
    setEditingFeaturedRankings((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleProductsRankingInput = (productId: string, value: string) => {
    // Update local state for immediate UI feedback
    setEditingProductsRankings((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleEditFeaturedRanking = (
    productId: string,
    currentRanking: number
  ) => {
    // If another product is already being edited, handle the transition
    if (editingFeaturedProductId && editingFeaturedProductId !== productId) {
      // Check if there are unsaved changes in the current edit
      const currentValue = editingFeaturedRankings[editingFeaturedProductId];
      const currentProduct = featuredProducts.find(
        (p) => p._id === editingFeaturedProductId
      );
      const hasUnsavedChanges =
        currentValue !== undefined &&
        currentValue !== (currentProduct?.ranking_featured || "").toString();

      if (hasUnsavedChanges) {
        // Just cancel the current edit and start the new one
        handleCancelFeaturedEdit(editingFeaturedProductId);
      }
    }

    // Calculate the next available rank as a smart suggestion
    const nextAvailableRank = calculateNextAvailableFeaturedRank();

    // Enter edit mode for this product with the suggested next available rank
    setEditingFeaturedProductId(productId);
    setEditingFeaturedRankings((prev) => ({
      ...prev,
      [productId]: nextAvailableRank.toString(),
    }));
  };

  const handleEditProductsRanking = (
    productId: string,
    currentRanking: number
  ) => {
    // If another product is already being edited, handle the transition
    if (editingProductsProductId && editingProductsProductId !== productId) {
      // Check if there are unsaved changes in the current edit
      const currentValue = editingProductsRankings[editingProductsProductId];
      const currentProduct = products.find(
        (p) => p._id === editingProductsProductId
      );
      const hasUnsavedChanges =
        currentValue !== undefined &&
        currentValue !== (currentProduct?.products_ranking || "").toString();

      if (hasUnsavedChanges) {
        // Just cancel the current edit and start the new one
        handleCancelProductsEdit(editingProductsProductId);
      }
    }

    // Calculate the next available rank as a smart suggestion
    const nextAvailableRank = calculateNextAvailableProductsRank();

    // Enter edit mode for this product with smart suggestion
    setEditingProductsProductId(productId);
    setEditingProductsRankings((prev) => ({
      ...prev,
      [productId]: nextAvailableRank.toString(),
    }));
  };

  const handleCancelFeaturedEdit = (productId: string) => {
    // Exit edit mode and clear editing state
    setEditingFeaturedProductId(null);
    setEditingFeaturedRankings((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
    // Clear any ranking errors
    setFeaturedRankingError(null);
  };

  const handleCancelProductsEdit = (productId: string) => {
    // Exit edit mode and clear editing state
    setEditingProductsProductId(null);
    setEditingProductsRankings((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
    // Clear any ranking errors
    setProductsRankingError(null);
  };

  const validateFeaturedRankingUniqueness = (
    productId: string,
    newRank: number
  ): boolean => {
    // Check if the new rank already exists for another featured product
    // Use the products array to get the most up-to-date data
    const duplicateProduct = products.find(
      (product) =>
        product._id !== productId &&
        product.isFeatured &&
        product.ranking_featured === newRank
    );

    return !duplicateProduct; // Return true if no duplicate found
  };

  const validateProductsRankingUniqueness = (
    productId: string,
    newRank: number
  ): boolean => {
    // Only check for duplicates if rank > 0 (rank 0 can be used multiple times)
    if (newRank <= 0) {
      return true; // Always allow rank 0 or negative ranks
    }

    // Check if the new rank already exists for another product
    const duplicateProduct = products.find(
      (product) =>
        product._id !== productId && product.products_ranking === newRank
    );

    return !duplicateProduct; // Return true if no duplicate found
  };

  const validateRankingUniqueness = (
    productId: string,
    newRank: number
  ): boolean => {
    // Check if the new rank already exists for another featured product
    const duplicateProduct = products.find(
      (product) =>
        product._id !== productId &&
        product.isFeatured &&
        product.ranking_featured === newRank
    );

    return !duplicateProduct; // Return true if no duplicate found
  };

  const calculateNextAvailableFeaturedRank = (): number => {
    // Get all featured products with rankings >= 0 (include rank 0)
    const featuredProductsWithRanks = featuredProducts.filter(
      (product) =>
        product.ranking_featured !== undefined && product.ranking_featured >= 0
    );

    // If no featured products with ranks exist, default to 1
    if (featuredProductsWithRanks.length === 0) {
      return 1;
    }

    // Find the highest rank number
    const maxRank = Math.max(
      ...featuredProductsWithRanks.map((p) => p.ranking_featured || 0)
    );

    // Return the next available rank (Rmax + 1)
    return maxRank + 1;
  };

  const calculateNextAvailableProductsRank = (): number => {
    // Get all products with rankings > 0 (excluding rank 0 since it can be used multiple times)
    const productsWithRanks = products.filter(
      (product) => product.products_ranking && product.products_ranking > 0
    );

    // If no products with ranks > 0 exist, suggest rank 1
    if (productsWithRanks.length === 0) {
      return 1;
    }

    // Find the highest existing rank and suggest the next one (ignore gaps)
    const maxRank = Math.max(
      ...productsWithRanks.map((p) => p.products_ranking || 0)
    );

    return maxRank + 1;
  };

  const handleFeaturedRankingSubmit = async (
    productId: string,
    value: string
  ) => {
    // Clear any previous errors
    setFeaturedRankingError(null);

    // Allow empty string for clearing
    if (value === "") {
      handleCancelFeaturedEdit(productId);
      return;
    }

    const numericValue = parseInt(value);

    // Validate: must be non-negative integer (0 or greater)
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Invalid Input",
        description: "Ranking must be a non-negative integer (0 or greater)",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate ranks (only for ranks > 0, rank 0 can be used multiple times)
    if (
      numericValue > 0 &&
      !validateFeaturedRankingUniqueness(productId, numericValue)
    ) {
      setFeaturedRankingError({
        productId,
        message: `Rank ${numericValue} is already assigned to another featured product. Please choose a unique rank.`,
      });
      return; // Don't proceed with the API call
    }

    // Submit the ranking change
    await handleFeaturedRankingChange(productId, numericValue);

    // Exit edit mode after successful submission
    setEditingFeaturedProductId(null);
    setEditingFeaturedRankings((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleProductsRankingSubmit = async (
    productId: string,
    value: string
  ) => {
    // Clear any previous errors
    setProductsRankingError(null);

    // Allow empty string for clearing
    if (value === "") {
      handleCancelProductsEdit(productId);
      return;
    }

    const numericValue = parseInt(value);

    // Validate: must be non-negative integer (0 or greater)
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Invalid Input",
        description: "Ranking must be a non-negative integer (0 or greater)",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate ranks (only for ranks > 0, rank 0 can be used multiple times)
    if (
      numericValue > 0 &&
      !validateProductsRankingUniqueness(productId, numericValue)
    ) {
      setProductsRankingError({
        productId,
        message: `Rank ${numericValue} is already assigned to another product. Please choose a unique rank.`,
      });
      return; // Don't proceed with the API call
    }

    // Submit the ranking change
    await handleProductsRankingChange(productId, numericValue);

    // Exit edit mode after successful submission
    setEditingProductsProductId(null);
    setEditingProductsRankings((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSelectedProducts([]); // Clear selections when switching tabs

    // Load featured products when switching to featured tab
    if (newTab === "featured") {
      // Always refresh featured products to ensure sync with current state
      fetchFeaturedProducts();
    }
  };

  // Reusable ProductTable component
  const ProductTable = ({
    products,
    loading,
    pagination,
    currentPage,
    setCurrentPage,
    showFeaturedToggle = true,
  }: {
    products: Product[];
    loading: boolean;
    pagination: PaginationData;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    showFeaturedToggle?: boolean;
  }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      selectedProducts.length > 0 &&
                      selectedProducts.length === products.length
                        ? true
                        : selectedProducts.length > 0
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                {!showFeaturedToggle && <TableHead>Featured</TableHead>}
                {showFeaturedToggle && (
                  <TableHead className="w-[165px]">Featured Ranking</TableHead>
                )}
                {!showFeaturedToggle && (
                  <TableHead className="w-[165px]">Products Ranking</TableHead>
                )}
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product._id}
                  data-state={
                    selectedProducts.includes(product._id) && "selected"
                  }
                  className={`group transition-all duration-200 ${
                    editingFeaturedProductId === product._id ||
                    editingProductsProductId === product._id
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product._id)}
                      onCheckedChange={(checked) =>
                        handleSelectProduct(product._id, !!checked)
                      }
                      aria-label={`Select product ${product.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border">
                        <img
                          src={product.images[0]?.url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.brand}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {product.variants && product.variants.length > 0
                          ? `From ${formatRupees(product.price)}`
                          : formatRupees(product.price)}
                      </span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatRupees(product.originalPrice)}
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {product.variants && product.variants.length > 0
                        ? "Multiple"
                        : product.specifications?.volume || "Not specified"}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? "default" : "destructive"}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {!showFeaturedToggle && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.isFeatured}
                          onCheckedChange={() =>
                            handleToggleFeatured(
                              product._id,
                              product.isFeatured
                            )
                          }
                          disabled={togglingProducts.has(product._id)}
                          className={`data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                            togglingProducts.has(product._id)
                              ? "opacity-50"
                              : ""
                          }`}
                        />
                        <span
                          className={`text-sm font-medium transition-colors duration-200 ${
                            product.isFeatured
                              ? "text-primary"
                              : "text-muted-foreground"
                          } ${
                            togglingProducts.has(product._id)
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          {togglingProducts.has(product._id)
                            ? "Updating..."
                            : product.isFeatured
                            ? "Featured"
                            : "Regular"}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {showFeaturedToggle && (
                    <TableCell className="w-[165px] h-[40px] py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg text-xs font-medium w-[145px] h-[30px] ${
                          editingFeaturedProductId === product._id
                            ? "bg-primary/90 ring-2 ring-primary/30 shadow-sm"
                            : product.ranking_featured === 0
                            ? "bg-gray-400 hover:bg-gray-500 shadow-sm"
                            : "bg-primary hover:bg-primary/90 shadow-sm"
                        }`}
                        role="group"
                        aria-label={`Featured ranking: ${
                          product.ranking_featured || "unranked"
                        }`}
                      >
                        {/* Featured Badge */}
                        <span className="text-primary-foreground font-semibold text-xs">
                          Rank
                        </span>

                        {editingFeaturedProductId === product._id ? (
                          // Edit Mode: Input with OK/Cancel buttons
                          <>
                            <Input
                              type="number"
                              min="0"
                              value={
                                editingFeaturedRankings[product._id] !==
                                undefined
                                  ? editingFeaturedRankings[product._id]
                                  : product.ranking_featured || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                handleFeaturedRankingInput(product._id, value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleFeaturedRankingSubmit(
                                    product._id,
                                    editingFeaturedRankings[product._id] || ""
                                  );
                                } else if (e.key === "Escape") {
                                  handleCancelFeaturedEdit(product._id);
                                }
                              }}
                              className={`w-[45px] h-5 px-1 text-xs font-medium text-center bg-white/90 flex-shrink-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                                featuredRankingError?.productId === product._id
                                  ? "border-[#B0B4B8] focus:border-[#B0B4B8] focus:ring-1 focus:ring-[#B0B4B8]/30"
                                  : "border-white/20 focus:border-white focus:ring-1 focus:ring-white/30 hover:bg-white"
                              }`}
                              placeholder="0"
                              autoFocus
                              aria-label="Edit featured ranking number"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-white hover:text-primary hover:bg-white/90 flex-shrink-0"
                              onClick={() =>
                                handleFeaturedRankingSubmit(
                                  product._id,
                                  editingFeaturedRankings[product._id] || ""
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
                              onClick={() =>
                                handleCancelFeaturedEdit(product._id)
                              }
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
                                product.ranking_featured === 0
                                  ? "text-white opacity-90"
                                  : "text-primary-foreground"
                              }`}
                            >
                              {product.ranking_featured === 0
                                ? "0"
                                : product.ranking_featured || ""}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                editingFeaturedProductId !== null &&
                                editingFeaturedProductId !== product._id
                              }
                              className={`h-5 w-5 p-0 ${
                                editingFeaturedProductId !== null &&
                                editingFeaturedProductId !== product._id
                                  ? "text-white/40 cursor-not-allowed"
                                  : product.ranking_featured === 0
                                  ? "text-white/80 hover:text-white hover:bg-white/20"
                                  : "text-white/80 hover:text-white hover:bg-white/20"
                              }`}
                              onClick={() =>
                                handleEditFeaturedRanking(
                                  product._id,
                                  product.ranking_featured || 0
                                )
                              }
                              title={
                                editingFeaturedProductId !== null &&
                                editingFeaturedProductId !== product._id
                                  ? "Another product is being edited"
                                  : `Edit ranking (Next available: ${calculateNextAvailableFeaturedRank()})`
                              }
                              aria-label="Edit featured ranking"
                            >
                              <Edit className="h-2.5 w-2.5" />
                            </Button>
                          </>
                        )}
                      </div>
                      {featuredRankingError &&
                        featuredRankingError.productId === product._id && (
                          <div className="text-xs text-red-500 mt-1">
                            {featuredRankingError.message}
                          </div>
                        )}
                    </TableCell>
                  )}
                  {!showFeaturedToggle && (
                    <TableCell className="w-[165px] h-[40px] py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg text-xs font-medium w-[145px] h-[30px] ${
                          editingProductsProductId === product._id
                            ? "bg-primary/90 ring-2 ring-primary/30 shadow-sm"
                            : product.products_ranking === 0
                            ? "bg-gray-400 hover:bg-gray-500 shadow-sm"
                            : "bg-primary hover:bg-primary/90 shadow-sm"
                        }`}
                        role="group"
                        aria-label={`Products ranking: ${
                          product.products_ranking || "unranked"
                        }`}
                      >
                        {/* Products Badge */}
                        <span className="text-primary-foreground font-semibold text-xs">
                          Rank
                        </span>

                        {editingProductsProductId === product._id ? (
                          // Edit Mode: Input with OK/Cancel buttons
                          <>
                            <Input
                              type="number"
                              min="0"
                              value={
                                editingProductsRankings[product._id] !==
                                undefined
                                  ? editingProductsRankings[product._id]
                                  : product.products_ranking || ""
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                handleProductsRankingInput(product._id, value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleProductsRankingSubmit(
                                    product._id,
                                    editingProductsRankings[product._id] || ""
                                  );
                                } else if (e.key === "Escape") {
                                  handleCancelProductsEdit(product._id);
                                }
                              }}
                              className={`w-[45px] h-5 px-1 text-xs font-medium text-center bg-white/90 flex-shrink-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                                productsRankingError?.productId === product._id
                                  ? "border-[#B0B4B8] focus:border-[#B0B4B8] focus:ring-1 focus:ring-[#B0B4B8]/30"
                                  : "border-white/20 focus:border-white focus:ring-1 focus:ring-white/30 hover:bg-white"
                              }`}
                              placeholder="0"
                              autoFocus
                              aria-label="Edit products ranking number"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-white hover:text-primary hover:bg-white/90 flex-shrink-0"
                              onClick={() =>
                                handleProductsRankingSubmit(
                                  product._id,
                                  editingProductsRankings[product._id] || ""
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
                              onClick={() =>
                                handleCancelProductsEdit(product._id)
                              }
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
                                product.products_ranking === 0
                                  ? "text-white opacity-90"
                                  : "text-primary-foreground"
                              }`}
                            >
                              {product.products_ranking === 0
                                ? "0"
                                : product.products_ranking || ""}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                editingProductsProductId !== null &&
                                editingProductsProductId !== product._id
                              }
                              className={`h-5 w-5 p-0 ${
                                editingProductsProductId !== null &&
                                editingProductsProductId !== product._id
                                  ? "text-white/40 cursor-not-allowed"
                                  : product.products_ranking === 0
                                  ? "text-white/80 hover:text-white hover:bg-white/20"
                                  : "text-white/80 hover:text-white hover:bg-white/20"
                              }`}
                              onClick={() =>
                                handleEditProductsRanking(
                                  product._id,
                                  product.products_ranking || 0
                                )
                              }
                              title={
                                editingProductsProductId !== null &&
                                editingProductsProductId !== product._id
                                  ? "Another product is being edited"
                                  : `Edit ranking (Next available: ${calculateNextAvailableProductsRank()})`
                              }
                              aria-label="Edit products ranking"
                            >
                              <Edit className="h-2.5 w-2.5" />
                            </Button>
                          </>
                        )}
                      </div>
                      {productsRankingError &&
                        productsRankingError.productId === product._id && (
                          <div className="text-xs text-red-500 mt-1">
                            {productsRankingError.message}
                          </div>
                        )}
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link to={`/admin/product/upload?edit=${product._id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product._id)}
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
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={`cursor-pointer ${
                      !pagination.hasPrev && "opacity-50 cursor-not-allowed"
                    }`}
                  />
                </PaginationItem>
                {generatePaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage(
                        Math.min(pagination.totalPages, currentPage + 1)
                      )
                    }
                    className={`cursor-pointer ${
                      !pagination.hasNext && "opacity-50 cursor-not-allowed"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeader
        title="Product Management"
        description="Manage your product catalog with separate views for all products and featured products."
        buttonText="Add Product"
        onButtonClick={() => navigate("/admin/product/upload")}
      />

      <Card className="rounded-xl border border-admin-border bg-admin-card shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Management
              </CardTitle>
              <CardDescription>
                Manage your product inventory, featured products, and details
              </CardDescription>
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.length} selected
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete Selected</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {selectedProducts.length}{" "}
                        products. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center pt-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </form>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ranking-asc">Ranking (Low-High)</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                All Products
                <Badge variant="secondary" className="ml-2">
                  {pagination.totalProducts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="featured" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Featured Products
                <Badge variant="secondary" className="ml-2">
                  {featuredPagination.totalProducts}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ProductTable
                products={products}
                loading={loading}
                pagination={pagination}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                showFeaturedToggle={false}
              />
            </TabsContent>

            <TabsContent value="featured" className="space-y-4">
              <ProductTable
                products={featuredProducts}
                loading={featuredLoading}
                pagination={featuredPagination}
                currentPage={featuredPage}
                setCurrentPage={setFeaturedPage}
                showFeaturedToggle={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductAdmin;
