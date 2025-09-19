import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import ProductCard from "./ProductCard";
import { Skeleton } from "./ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
      <div className="-mx-4 md:mx-0">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {[...Array(4)].map((_, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-3/4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <Skeleton className="w-full h-64 bg-border/20 rounded-lg" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null; // Don't render the section if there are no related products
  }

  return (
    <div className="-mx-4 md:mx-0">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {relatedProducts.map((product) => (
            <CarouselItem
              key={product._id}
              className="pl-2 md:pl-4 basis-3/4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
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
                specifications={
                  product.specifications ||
                  (product.volume ? { volume: product.volume } : undefined)
                }
                variants={product.variants}
                isNew={product.isNew}
                isSale={product.isSale}
                shortDescription={product.shortDescription}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default RelatedProducts;
