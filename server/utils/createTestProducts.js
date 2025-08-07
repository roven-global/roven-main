const mongoose = require("mongoose");
const ProductModel = require("../models/productModel");
const CategoryModel = require("../models/categoryModel");
const connectDb = require("../config/dbConnection");

const createTestProducts = async () => {
  console.log("Creating test products with variants...");
  
  try {
    // Connect to database
    await connectDb();
    
    // Create or get a test category
    let category = await CategoryModel.findOne({ name: "Face Care" });
    if (!category) {
      category = new CategoryModel({
        name: "Face Care",
        slug: "face-care",
        description: "Face care products",
      });
      await category.save();
    }
    
    // Sample products data
    const testProducts = [
      {
        name: "Rice Face Wash With Rice Water & Niacinamide for Glass Skin",
        description: "Gently cleanses skin | Hydrates skin. Made with natural rice water and niacinamide for a radiant, glass-like finish.",
        shortDescription: "Natural rice face wash for hydrated, glowing skin",
        category: category._id,
        categorySlug: category.slug,
        brand: "MamaEarth",
        sku: "RICE-FACE-WASH",
        variants: [
          {
            volume: "100 ml",
            price: 269,
            originalPrice: 299,
            stock: 15,
            sku: "RICE-FACE-WASH-100ML",
            lowStockThreshold: 5,
            isActive: true,
          },
          {
            volume: "150 ml",
            price: 399,
            originalPrice: 449,
            stock: 25,
            sku: "RICE-FACE-WASH-150ML", 
            lowStockThreshold: 10,
            isActive: true,
          },
          {
            volume: "100 ml (Pack of 2)",
            price: 538,
            originalPrice: 598,
            stock: 0, // Out of stock
            sku: "RICE-FACE-WASH-100ML-2PACK",
            lowStockThreshold: 5,
            isActive: true,
          },
          {
            volume: "150 ml (Pack of 2)",
            price: 798,
            originalPrice: 898,
            stock: 8,
            sku: "RICE-FACE-WASH-150ML-2PACK",
            lowStockThreshold: 5,
            isActive: true,
          },
        ],
        images: [
          {
            public_id: "rice-face-wash-1",
            url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
          },
          {
            public_id: "rice-face-wash-2", 
            url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400",
          }
        ],
        specifications: {
          skinType: "All Types",
          suitableFor: "Unisex",
          fragrance: "Light Rice",
        },
        benefits: ["Gently Cleanses Skin", "Hydrates Skin"],
        tags: ["rice water", "niacinamide", "face wash", "glass skin"],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Vitamin C Face Serum with Vitamin C & Turmeric for Glowing Skin",
        description: "A potent vitamin C serum that brightens skin, reduces dark spots, and provides antioxidant protection for a radiant complexion.",
        shortDescription: "Brightening serum with Vitamin C and turmeric",
        category: category._id,
        categorySlug: category.slug,
        brand: "MamaEarth",
        sku: "VIT-C-SERUM",
        variants: [
          {
            volume: "20 ml",
            price: 599,
            originalPrice: 699,
            stock: 30,
            sku: "VIT-C-SERUM-20ML",
            lowStockThreshold: 10,
            isActive: true,
          },
          {
            volume: "30 ml",
            price: 799,
            originalPrice: 899,
            stock: 20,
            sku: "VIT-C-SERUM-30ML",
            lowStockThreshold: 8,
            isActive: true,
          },
        ],
        images: [
          {
            public_id: "vit-c-serum-1",
            url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
          }
        ],
        specifications: {
          skinType: "All Types",
          suitableFor: "Unisex",
        },
        benefits: ["Brightens Skin", "Reduces Dark Spots", "Antioxidant Protection"],
        tags: ["vitamin c", "serum", "brightening", "antioxidant"],
        isFeatured: true,
        isActive: true,
      }
    ];
    
    // Clear existing test products
    await ProductModel.deleteMany({ brand: "MamaEarth" });
    
    // Create new test products
    for (let productData of testProducts) {
      const product = new ProductModel(productData);
      await product.save();
      console.log(`✅ Created product: ${product.name}`);
    }
    
    console.log("\n🎉 Test products created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating test products:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run script if called directly
if (require.main === module) {
  createTestProducts();
}

module.exports = createTestProducts;