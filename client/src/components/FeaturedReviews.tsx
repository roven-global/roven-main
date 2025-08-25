import React from "react";
import { Star } from "lucide-react";

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

interface FeaturedReviewsProps {
  reviews: Review[];
}

const StarRating = ({ value = 0 }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-5 w-5 ${
          star <= value
            ? "text-gold-accent fill-gold-accent"
            : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const FeaturedReviews: React.FC<FeaturedReviewsProps> = ({ reviews }) => {

  if (reviews.length === 0) {
    return (
      <p className="mt-4 text-center text-forest">
        No reviews yet. Be the first to write one!
      </p>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {reviews.map((review) => (
        <div key={review._id} className="border-b border-sage/20 pb-4">
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
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
            <div className="flex-grow">
              <p className="font-semibold text-deep-forest">
                {review.user?.name || "Anonymous User"}
              </p>
              <StarRating value={review.rating} />
            </div>
          </div>
          <h5 className="font-semibold mb-1 text-forest">{review.title}</h5>
          <p className="text-sm text-forest/80 leading-relaxed">
            {review.comment}
          </p>
        </div>
      ))}
    </div>
  );
};

export default FeaturedReviews;
