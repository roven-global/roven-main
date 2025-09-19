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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import { Search, Filter, Edit, Trash2 } from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";

interface Review {
  _id: string;
  review: string;
  rating: number;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [editData, setEditData] = useState({ rating: 0, review: "" });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);

      const response = await Axios.get(
        `${SummaryApi.getAllReviews.url}?${params.toString()}`
      );

      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const response = await Axios.delete(
        `${SummaryApi.adminDeleteReview.url}/${reviewId}`
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Review deleted successfully",
        });
        fetchReviews();
      }
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReview) return;

    try {
      const response = await Axios.put(
        `${SummaryApi.adminUpdateReview.url}/${currentReview._id}`,
        editData
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Review updated successfully",
        });
        setIsEditDialogOpen(false);
        fetchReviews();
      }
    } catch (error: any) {
      console.error("Error updating review:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update review",
        variant: "destructive",
      });
    }
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

  return (
    <div className="p-4 bg-admin-bg min-h-screen admin-panel-container">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Review Management
          </h1>
        </div>
        <div className="flex items-center space-x-4"></div>
      </div>
      <Card className="rounded-xl border border-admin-border bg-admin-card shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Reviews
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and moderate customer feedback.
              </CardDescription>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center pt-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-admin-card border-admin-border text-admin-text placeholder:text-admin-muted focus:ring-primary shadow-sm"
              />
            </form>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading reviews...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-admin-border bg-admin-accent/50">
                      <TableHead className="text-admin-text font-semibold">
                        User
                      </TableHead>
                      <TableHead className="text-admin-text font-semibold">
                        Product
                      </TableHead>
                      <TableHead className="text-admin-text font-semibold">
                        Rating
                      </TableHead>
                      <TableHead className="text-admin-text font-semibold">
                        Review
                      </TableHead>
                      <TableHead className="text-admin-text font-semibold">
                        Created
                      </TableHead>
                      <TableHead className="text-admin-text font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review._id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {review.user.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {review.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {review.product.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-border text-foreground"
                          >
                            {review.rating} ★
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate text-foreground">
                            {review.review}
                          </p>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentReview(review);
                                setEditData({
                                  rating: review.rating,
                                  review: review.review,
                                });
                                setIsEditDialogOpen(true);
                              }}
                              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">
                                    Delete Review
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Are you sure you want to delete this review?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(review._id)}
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
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          className={`cursor-pointer ${
                            !pagination.hasPrev &&
                            "opacity-50 cursor-not-allowed"
                          }`}
                        />
                      </PaginationItem>
                      {generatePaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(pagination.totalPages, prev + 1)
                            )
                          }
                          className={`cursor-pointer ${
                            !pagination.hasNext &&
                            "opacity-50 cursor-not-allowed"
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Review</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Make changes to the review below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rating" className="text-right text-foreground">
                  Rating
                </Label>
                <Input
                  id="rating"
                  type="number"
                  value={editData.rating}
                  onChange={(e) =>
                    setEditData({ ...editData, rating: Number(e.target.value) })
                  }
                  className="col-span-3 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
                  min="1"
                  max="5"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="review" className="text-right text-foreground">
                  Review
                </Label>
                <Textarea
                  id="review"
                  value={editData.review}
                  onChange={(e) =>
                    setEditData({ ...editData, review: e.target.value })
                  }
                  className="col-span-3 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
