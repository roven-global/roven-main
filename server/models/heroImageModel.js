const mongoose = require("mongoose");

const heroImageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const HeroImage = mongoose.model("HeroImage", heroImageSchema);

module.exports = HeroImage;
