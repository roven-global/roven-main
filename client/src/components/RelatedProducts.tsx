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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="w-full h-64 bg-gray-200" />
          <Skeleton className="w-full h-64 bg-gray-200" />
          <Skeleton className="w-full h-64 bg-gray-200" />
          <Skeleton className="w-full h-64 bg-gray-200" />
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null; // Don't render the section if there are no related products
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {relatedProducts.map((product) => (
          <ProductCard
            key={product._id}
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
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
