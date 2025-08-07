const mongoose = require("mongoose");
const ProductModel = require("../models/productModel");
const connectDb = require("../config/dbConnection");

const migrateProductsToVariants = async () => {
  console.log("Starting product migration to variant system...");
  
  try {
    // Connect to database
    await connectDb();
    
    // Find all products that don't have variants or have old volume field
    const productsToMigrate = await ProductModel.find({
      $or: [
        { variants: { $exists: false } },
        { variants: { $size: 0 } },
        { volume: { $exists: true } }
      ]
    });
    
    console.log(`Found ${productsToMigrate.length} products to migrate...`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (let product of productsToMigrate) {
      try {
        // Check if product already has variants
        if (product.variants && product.variants.length > 0) {
          console.log(`Skipping product ${product.name} - already has variants`);
          skippedCount++;
          continue;
        }
        
        // Create default variant from existing product data
        const defaultVariant = {
          volume: product.volume || "Standard",
          price: product.price,
          originalPrice: product.originalPrice,
          stock: product.stock || 0, // Default stock to 0 if not present
          sku: `${product.sku}-STD`, // Create unique variant SKU
          lowStockThreshold: 10,
          isActive: true,
        };
        
        // Check if the variant SKU already exists
        const existingVariantProduct = await ProductModel.findOne({
          "variants.sku": defaultVariant.sku
        });
        
        if (existingVariantProduct) {
          // If SKU exists, add a random suffix
          defaultVariant.sku = `${product.sku}-${Date.now()}`;
        }
        
        // Update product with variant
        await ProductModel.findByIdAndUpdate(product._id, {
          $set: {
            variants: [defaultVariant],
            // Remove old volume field if exists
            $unset: { volume: "" }
          }
        });
        
        console.log(`✅ Migrated product: ${product.name} -> Variant: ${defaultVariant.volume} (${defaultVariant.sku})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating product ${product.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Results:`);
    console.log(`   - Migrated: ${migratedCount} products`);
    console.log(`   - Skipped: ${skippedCount} products`);
    console.log(`   - Total processed: ${productsToMigrate.length} products`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateProductsToVariants();
}

module.exports = migrateProductsToVariants;