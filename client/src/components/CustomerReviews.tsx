import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Star } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: { url: string };
  };
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

interface CustomerReviewsProps {
  productId: string;
  productName: string;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ productId, productName }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await Axios.get(`${SummaryApi.getReviews.url}/${productId}`);
        if (response.data.success) {
          setReviews(response.data.data.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !title || !comment) {
      toast({ title: "Please fill all fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await Axios.post(SummaryApi.createReview.url, {
        productId,
        rating,
        title,
        comment,
      });
      if (response.data.success) {
        toast({ title: "Review submitted successfully!" });
        setReviews([response.data.data, ...reviews]);
        setShowForm(false);
        setRating(0);
        setTitle("");
        setComment("");
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
  
  const StarRating = ({ readOnly = false, value = 0 }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer ${
            readOnly
              ? (star <= value ? "text-gold-accent fill-gold-accent" : "text-gray-300")
              : (star <= (hoverRating || rating) ? "text-gold-accent fill-gold-accent" : "text-gray-300")
          }`}
          onClick={() => !readOnly && setRating(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-deep-forest">Customer Reviews</h3>
        {isAuthenticated && (
          <Button onClick={() => setShowForm(!showForm)} variant="outline">
            {showForm ? "Cancel" : "Write a Review"}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleReviewSubmit} className="mb-8 p-4 border rounded-lg bg-white space-y-4">
          <h4 className="font-semibold">Write your review for {productName}</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <StarRating />
          </div>
          <div>
            <label htmlFor="review-title" className="block text-sm font-medium text-gray-700">Title</label>
            <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short summary" required />
          </div>
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700">Comment</label>
            <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." required />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b pb-4">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img src={review.user.avatar?.url || `https://api.dicebear.com/8.x/initials/svg?seed=${review.user.name}`} alt={review.user.name} />
                </div>
                <div>
                  <p className="font-semibold">{review.user.name}</p>
                  <StarRating readOnly value={review.rating} />
                </div>
              </div>
              <h5 className="font-semibold mb-1">{review.title}</h5>
              <p className="text-sm text-gray-600">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No reviews yet. Be the first to review this product!</p>
      )}
    </div>
  );
};

export default CustomerReviews;
