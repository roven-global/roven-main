import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: Array<{ url: string }>;
  ratings: {
    average: number;
    numOfReviews: number;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  brand: string;
  volume?: string;
  specifications?: {
    volume?: string;
    skinType?: string | string[];
    hairType?: string | string[];
  };
  shortDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  variants?: Array<{
    volume: string;
    price: number;
    originalPrice?: number;
    stock: number;
    sku: string;
  }>;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CategorySectionProps {
  category: Category;
  products: Product[];
  theme?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "warm"
    | "cool"
    | "neutral";
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  products,
  theme = "default",
}) => {
  // Get theme colors directly from Tailwind config classes
  const getThemeClasses = (themeName: string) => {
    const themeMap = {
      default: "neutral", // Use neutral as default
      primary: "primary",
      secondary: "secondary",
      accent: "accent",
      warm: "warm",
      cool: "cool",
      neutral: "neutral",
    };

    const activeTheme = themeMap[themeName];

    return {
      bg: `bg-category-${activeTheme}-bg`,
      text: `text-category-${activeTheme}-text`,
      border: `border-category-${activeTheme}-border`,
      button: `border-category-${activeTheme}-border text-category-${activeTheme}-text hover:bg-category-${activeTheme}-button-hover`,
    };
  };

  const currentTheme = getThemeClasses(theme);

  return (
    <section className={`py-8 md:py-12 ${currentTheme.bg}`}>
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2
            className={`text-xl sm:text-3xl md:text-4xl font-bold ${currentTheme.text}`}
          >
            {category.name}
          </h2>
          <Link to={`/category/${category.slug}`}>
            <Button variant="outline" className={currentTheme.button}>
              View All
            </Button>
          </Link>
        </div>

        {/* Mobile: Carousel layout */}
        <div className="md:hidden -mx-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {products.slice(0, 4).map((product) => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const isNew = new Date(product.createdAt) > thirtyDaysAgo;

                return (
                  <CarouselItem key={product._id} className="pl-2 basis-3/4">
                    <ProductCard
                      id={product._id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.images[0]?.url || ""}
                      rating={product.ratings.average}
                      reviews={product.ratings.numOfReviews}
                      category={product.category.name}
                      specifications={product.specifications}
                      variants={product.variants}
                      isSale={
                        !!(
                          product.originalPrice &&
                          product.originalPrice > product.price
                        )
                      }
                      isNew={isNew}
                      shortDescription={product.shortDescription}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden" />
            <CarouselNext className="hidden" />
          </Carousel>
        </div>

        {/* Desktop: Carousel layout */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.slice(0, 4).map((product) => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const isNew = new Date(product.createdAt) > thirtyDaysAgo;

                return (
                  <CarouselItem
                    key={product._id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <ProductCard
                      id={product._id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.images[0]?.url || ""}
                      rating={product.ratings.average}
                      reviews={product.ratings.numOfReviews}
                      category={product.category.name}
                      specifications={product.specifications}
                      variants={product.variants}
                      isSale={
                        !!(
                          product.originalPrice &&
                          product.originalPrice > product.price
                        )
                      }
                      isNew={isNew}
                      shortDescription={product.shortDescription}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden" />
            <CarouselNext className="hidden" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
