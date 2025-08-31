import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Star } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { Edit3, Trash2, X, Check } from "lucide-react";

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: { url: string };
  };
  rating: number;
  review: string;
  createdAt: string;
}

export interface CustomerReviewsHandles {
  toggleForm: () => void;
}

interface CustomerReviewsProps {
  productId: string;
  productName: string;
  initialReviews?: Review[];
  isLoading?: boolean;
}

const CustomerReviews = forwardRef<
  CustomerReviewsHandles,
  CustomerReviewsProps
>(({ productId, productName, initialReviews = [], isLoading = false }, ref) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const reviewsPerPage = 10; // Show 10 reviews at a time like Google

  // Edit/Delete state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editReviewText, setEditReviewText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    toggleForm: () => {
      if (isAuthenticated) {
        setShowForm((prev) => !prev);
      } else {
        toast({
          title: "Please log in to write a review.",
          variant: "destructive",
        });
      }
    },
  }));

  useEffect(() => {
    setReviews(initialReviews);
    if (initialReviews.length > 0) {
      setTotalReviews(initialReviews.length);
      setHasMoreReviews(initialReviews.length >= reviewsPerPage);
    }
  }, [initialReviews]);

  // Check if user has already reviewed this product
  const userReview = reviews.find((review) => review.user._id === user?._id);

  // Load more reviews function
  const loadMoreReviews = async () => {
    if (loadingMore || !hasMoreReviews) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await Axios.get(
        `${SummaryApi.getReviews.url}/${productId}?page=${nextPage}&limit=${reviewsPerPage}`
      );

      if (response.data.success) {
        const newReviews = response.data.data.reviews;
        setReviews((prev) => [...prev, ...newReviews]);
        setCurrentPage(nextPage);
        setHasMoreReviews(newReviews.length === reviewsPerPage);
        setTotalReviews(response.data.data.pagination.totalReviews);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load more reviews",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !reviewText) {
      toast({ title: "Please fill all fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await Axios.post(SummaryApi.createReview.url, {
        productId,
        rating,
        review: reviewText,
      });
      if (response.data.success) {
        toast({ title: "Review submitted successfully!" });
        // Add new review to the beginning and reset pagination
        setReviews([response.data.data, ...reviews]);
        setCurrentPage(1);
        setTotalReviews((prev) => prev + 1);
        setShowForm(false);
        setRating(0);
        setReviewText("");
      }
    } catch (error: any) {
      toast({
        title: "Failed to submit review",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a review
  const startEditing = (review: Review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditReviewText(review.review);
    setIsEditing(false); // Reset editing state
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditReviewText("");
    setIsEditing(false);
  };

  // Save edited review
  const saveEditedReview = async () => {
    if (editRating === 0 || !editReviewText.trim()) {
      toast({ title: "Please fill all fields.", variant: "destructive" });
      return;
    }

    setIsEditing(true); // Set loading state
    try {
      const response = await Axios.put(
        `${SummaryApi.updateReview.url}/${editingReviewId}`,
        {
          rating: editRating,
          review: editReviewText,
        }
      );

      if (response.data.success) {
        toast({ title: "Review updated successfully!" });
        setReviews((prev) =>
          prev.map((review) =>
            review._id === editingReviewId
              ? { ...review, rating: editRating, review: editReviewText }
              : review
          )
        );
        cancelEditing();
      }
    } catch (error: any) {
      toast({
        title: "Failed to update review",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Delete review
  const deleteReview = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      const response = await Axios.delete(
        `${SummaryApi.deleteReview.url}/${reviewId}`
      );

      if (response.data.success) {
        toast({ title: "Review deleted successfully!" });
        setReviews((prev) => prev.filter((review) => review._id !== reviewId));
        setTotalReviews((prev) => prev - 1);

        // If this was the user's review, show the form again
        if (userReview && userReview._id === reviewId) {
          setShowForm(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to delete review",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const StarRating = ({
    readOnly = false,
    value = 0,
    onRatingChange = null,
  }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer ${
            readOnly
              ? star <= value
                ? "text-accent fill-accent"
                : "text-border/50"
              : star <= (hoverRating || rating || value)
              ? "text-accent fill-accent"
              : "text-border/50"
          }`}
          onClick={() => {
            if (!readOnly) {
              if (onRatingChange) {
                onRatingChange(star);
              } else {
                setRating(star);
              }
            }
          }}
          onMouseEnter={() => {
            if (!readOnly && !onRatingChange) {
              setHoverRating(star);
            }
          }}
          onMouseLeave={() => {
            if (!readOnly && !onRatingChange) {
              setHoverRating(0);
            }
          }}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-foreground">Customer Reviews</h3>
        {totalReviews > 0 && (
          <span className="text-sm text-muted-brown">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Show form if user hasn't reviewed yet, or show edit form if editing */}
      {showForm && !userReview && (
        <form
          onSubmit={handleReviewSubmit}
          className="mb-8 p-6 border border-primary/20 rounded-xl bg-white space-y-6 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-foreground">
              Write your review for {productName}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-muted-brown hover:text-primary"
            >
              Cancel
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-brown mb-2">
              Rating
            </label>
            <StarRating />
          </div>

          <div>
            <label
              htmlFor="review-text"
              className="block text-sm font-medium text-muted-brown mb-2"
            >
              Review
            </label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this product..."
              required
              className="min-h-[100px] resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="border border-primary/20 rounded-lg p-4 bg-white"
            >
              {editingReviewId === review._id ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-foreground">
                      Edit Your Review
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="text-muted-brown hover:text-primary"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEditedReview}
                        disabled={isEditing}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isEditing ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-brown mb-2">
                      Rating
                    </label>
                    <StarRating
                      value={editRating}
                      onRatingChange={setEditRating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-brown mb-2">
                      Review
                    </label>
                    <Textarea
                      value={editReviewText}
                      onChange={(e) => setEditReviewText(e.target.value)}
                      placeholder="Share your thoughts about this product..."
                      required
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-warm-cream overflow-hidden flex-shrink-0">
                        <img
                          src={
                            review.user?.avatar?.url ||
                            `https://api.dicebear.com/8.x/initials/svg?seed=${
                              review.user?.name || "User"
                            }`
                          }
                          alt={review.user?.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm">
                            {review.user?.name || "Anonymous User"}
                            {review.user._id === user?._id && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full ml-2">
                                You
                              </span>
                            )}
                          </p>
                          <StarRating readOnly value={review.rating} />
                        </div>
                        <p className="text-sm text-muted-brown leading-relaxed">
                          {review.review}
                        </p>
                        <p className="text-xs text-border mt-2">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons for user's own review */}
                    {review.user._id === user?._id && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(review)}
                          className="text-muted-brown hover:text-primary h-8 px-2"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteReview(review._id)}
                          disabled={deletingReviewId === review._id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          title="Delete review"
                        >
                          {deletingReviewId === review._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {hasMoreReviews && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreReviews}
                disabled={loadingMore}
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Loading...
                  </>
                ) : (
                  `Load More Reviews (${reviews.length} of ${totalReviews})`
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-brown text-lg">No reviews yet.</p>
          <p className="text-border text-sm mt-1">
            Be the first to review this product!
          </p>
        </div>
      )}
    </div>
  );
});

export default CustomerReviews;
