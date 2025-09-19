import React, { useState, useEffect } from "react";
import Axios from "../utils/Axios";
import SummaryApi, { baseURL } from "../common/summaryApi";

/**
 * BrandCategory Component
 *
 * CRITICAL BEHAVIOR: This component NEVER displays unranked categories.
 * Only categories with brandCategoryRanking > 0 are ever rendered.
 * NO visual flicker or placeholder grids are shown during loading.
 *
 * State Management:
 * - dataReady = false: Initial loading (shows nothing, NO loading indicators)
 * - dataReady = true, categories = []: No ranked categories found (shows "No categories" message)
 * - dataReady = true, categories = [Category[]]: Only ranked categories (shows grid)
 *
 * Filtering Logic:
 * 1. Fetch categories from API
 * 2. Apply strict filtering: isMainCategory && brandCategoryRanking > 0
 * 3. Sort by brandCategoryRanking ASC
 * 4. Set dataReady = true only after filtering is complete
 * 5. Only then render the final state (no intermediate states)
 */

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: {
    public_id: string;
    url: string;
  };
  categoryRanking?: number;
  brandCategoryRanking?: number | null;
  parentCategory?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const BrandCategory = () => {
  const [categories, setCategories] = useState<Category[] | null>(null); // null = initial loading, [] = no data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [dataReady, setDataReady] = useState(false); // Track when data fetch and filtering is complete

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataReady(false); // Reset data ready state

      // First check if brand category section is enabled
      try {
        const categorySettingResponse = await Axios.get(
          SummaryApi.getAdminSetting.url.replace(
            ":key",
            "is_brand_category_enabled"
          )
        );

        if (categorySettingResponse.data.success) {
          const isBrandCategoryEnabled =
            categorySettingResponse.data.data.value;
          setIsEnabled(isBrandCategoryEnabled);

          // If brand category section is disabled, don't fetch data
          if (!isBrandCategoryEnabled) {
            setLoading(false);
            setDataReady(true);
            return;
          }
        } else {
          console.warn(
            "Brand category setting not found, defaulting to enabled"
          );
          setIsEnabled(true);
        }
      } catch (settingError) {
        console.warn(
          "Error fetching brand category setting, defaulting to enabled:",
          settingError
        );
        setIsEnabled(true);
      }

      // CRITICAL: Fetch categories for brand category display
      // We use multiple API calls as fallbacks, but ALWAYS apply frontend filtering
      // to ensure only categories with brandCategoryRanking > 0 are ever displayed
      let apiUrl = `${SummaryApi.getAllCategories.url}?parent=main&brandCategory=true`;
      console.log("🔍 Fetching categories from:", apiUrl);
      console.log("Base URL:", baseURL);
      console.log("Full URL:", `${baseURL}${apiUrl}`);

      let response = await Axios.get(apiUrl);

      // If no categories found with parent=main, try fetching all categories with brand sorting
      if (
        response.data.success &&
        (!response.data.data || response.data.data.length === 0)
      ) {
        console.log(
          "⚠️ No categories found with parent=main, trying to fetch all categories with brand sorting..."
        );
        apiUrl = `${SummaryApi.getAllCategories.url}?brandCategory=true`;
        response = await Axios.get(apiUrl);
      }

      console.log("API Response:", response.data);
      console.log("Response Status:", response.status);

      if (response.data.success) {
        const fetchedCategories = response.data.data;

        // Check if we have categories
        if (!fetchedCategories || !Array.isArray(fetchedCategories)) {
          console.warn("⚠️ No categories found or invalid data structure");
          setCategories([]);
          setDataReady(true);
          return;
        }

        console.log(
          `📊 Raw API data: ${fetchedCategories.length} categories received`
        );

        // CRITICAL: Filter categories to show ONLY those with valid brand category ranking > 0
        // This prevents any unranked categories from ever being displayed, even briefly
        const sortedCategories = fetchedCategories.filter(
          (category: Category) => {
            const isMainCategory = !category.parentCategory;
            const hasValidRanking =
              category.brandCategoryRanking &&
              category.brandCategoryRanking > 0;

            console.log(
              `Category ${category.name}: hasImage=${!!category.image
                ?.url}, categoryRanking=${
                category.categoryRanking
              }, brandCategoryRanking=${
                category.brandCategoryRanking
              }, isMain=${isMainCategory}, hasValidRanking=${hasValidRanking}`
            );

            // Only show categories that are main categories AND have valid brand ranking > 0
            const shouldShow = isMainCategory && hasValidRanking;

            if (!shouldShow) {
              console.log(
                `❌ Filtering out category "${category.name}": isMain=${isMainCategory}, hasValidRanking=${hasValidRanking}`
              );
            }

            return shouldShow;
          }
        );

        // Sort by brand category ranking ASC (1, 2, 3, etc.)
        // This ensures categories are displayed in the correct order
        sortedCategories.sort((a: Category, b: Category) => {
          const aRank = a.brandCategoryRanking || 0;
          const bRank = b.brandCategoryRanking || 0;

          // Primary sort: by brand category ranking (ascending)
          if (aRank !== bRank) {
            return aRank - bRank;
          }

          // Secondary sort: by name for consistency when rankings are equal
          return a.name.localeCompare(b.name);
        });

        console.log(
          "✅ BRAND CATEGORY FILTERING COMPLETE:",
          `Found ${sortedCategories.length} categories with valid brand ranking > 0`
        );
        console.log(
          "📋 Categories to display:",
          sortedCategories.map((cat) => ({
            name: cat.name,
            brandRanking: cat.brandCategoryRanking,
          }))
        );
        setCategories(sortedCategories);
        setDataReady(true); // Mark data as ready after filtering is complete
      } else {
        console.error("API returned success: false", response.data);
        throw new Error(
          `Failed to fetch categories: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);

      if (err.response) {
        console.error("API Error Response:", err.response.data);
        setError(
          `API Error: ${
            err.response.data?.message ||
            err.response.statusText ||
            "Failed to fetch categories"
          }`
        );
        setCategories([]);
        setDataReady(true);
      } else if (err.request) {
        console.error("Network Error:", err.request);
        setError(
          "Network error: Unable to connect to server. Please check your connection."
        );
        setCategories([]);
        setDataReady(true);
      } else {
        console.error("Error:", err.message);
        setError(`Error: ${err.message}`);
        setCategories([]);
        setDataReady(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    // Listen for category updates from admin panel
    const handleCategoryUpdate = () => {
      console.log(
        "Category update event received in BrandCategory, refreshing categories..."
      );
      fetchCategories();
    };

    window.addEventListener("categoriesUpdated", handleCategoryUpdate);

    return () => {
      window.removeEventListener("categoriesUpdated", handleCategoryUpdate);
    };
  }, []);

  // If the brand category section is disabled, don't render anything
  if (!isEnabled) {
    return null;
  }

  return (
    <section className="brand-category-section bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Title */}
        <div className="text-center pb-2">
          <h2 className="brand-category-title text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 uppercase tracking-wide">
            BRAND CATEGORY
          </h2>
        </div>

        {/* Categories Grid - Only render final state when data is ready */}
        {!dataReady ? null : error ? ( // Loading state - show nothing until data is ready
          // Error state
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : categories && categories.length > 0 ? (
          // Data ready and available - only show ranked categories with brandCategoryRanking > 0
          <div className="brand-category-grid">
            {categories.map((category) => (
              <div key={category._id} className="brand-category-item">
                <div className="brand-category-image-container">
                  {category.image?.url ? (
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="brand-category-image"
                      onError={(e) => {
                        console.warn(
                          `Failed to load image for category ${category.name}:`,
                          category.image?.url
                        );
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="brand-category-placeholder">No Image</div>
                  )}
                </div>
                <p className="brand-category-name">{category.name}</p>
              </div>
            ))}
          </div>
        ) : (
          // Data ready but no ranked categories found
          <div className="text-center text-gray-500 py-8">
            No categories with brand ranking found
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandCategory;
