import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import ProductCard from "./ProductCard";
import { Skeleton } from "./ui/skeleton";

interface RelatedProductsProps {
  currentProductId: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
}) => {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        const response = await Axios.get(
          `${SummaryApi.getRelatedProducts.url}/${currentProductId}`
        );
        if (response.data.success) {
          setRelatedProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      fetchRelatedProducts();
    }
  }, [currentProductId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-64 sm:w-72 md:w-80 snap-start"
            >
              <Skeleton className="w-full h-64 bg-border/20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null; // Don't render the section if there are no related products
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll">
        {relatedProducts.map((product) => (
          <div
            key={product._id}
            className="flex-shrink-0 w-64 sm:w-72 md:w-80 snap-start"
          >
            <ProductCard
              id={product._id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.images[0]?.url}
              rating={product.ratings?.average}
              reviews={product.ratings?.numOfReviews}
              category={product.category?.name}
              isNew={product.isNew}
              isSale={product.isSale}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
