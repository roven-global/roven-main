import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";

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
  benefits?: string[];
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
          <h2 className={`text-3xl md:text-4xl font-bold ${currentTheme.text}`}>
            {category.name}
          </h2>
          <Link to={`/category/${category.slug}`}>
            <Button variant="outline" className={currentTheme.button}>
              View All
            </Button>
          </Link>
        </div>

        {/* Mobile: Horizontal scroll layout (like FeaturedProducts) */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll">
            {products.slice(0, 4).map((product) => {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const isNew = new Date(product.createdAt) > thirtyDaysAgo;

              return (
                <div
                  key={product._id}
                  className="flex-shrink-0 w-64 sm:w-72 snap-start"
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
                    variants={product.variants}
                    isSale={
                      !!(
                        product.originalPrice &&
                        product.originalPrice > product.price
                      )
                    }
                    isNew={isNew}
                    benefits={product.benefits}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop: Horizontal scroll layout (like FeaturedProducts) */}
        <div className="hidden md:flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll">
          {products.slice(0, 4).map((product) => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const isNew = new Date(product.createdAt) > thirtyDaysAgo;

            return (
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
                  image={product.images[0]?.url || ""}
                  rating={product.ratings.average}
                  reviews={product.ratings.numOfReviews}
                  category={product.category.name}
                  variants={product.variants}
                  isSale={
                    !!(
                      product.originalPrice &&
                      product.originalPrice > product.price
                    )
                  }
                  isNew={isNew}
                  benefits={product.benefits}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
