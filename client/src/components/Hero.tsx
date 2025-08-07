import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-beauty.jpg";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Award, Sparkles } from "lucide-react";

const Hero = () => {
  const handleDiscoverMore = () => {
    const featuredProductsSection = document.getElementById("featured-products");
    if (featuredProductsSection) {
      featuredProductsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback for other pages, though Hero is on Index
      window.location.href = '/shop';
    }
  };

  return (
    <section className="relative flex items-center justify-center mt-10" style={{ height: '60vh', minHeight: '400px' }}>
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Beauty products with natural elements"
          className="w-full h-full object-cover scale-110"
          style={{ objectPosition: 'center 60%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400/30 rounded-full shadow-lg"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/20 rounded-full shadow-lg"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-white/30 rounded-full shadow-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-yellow-400/40 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-purple-400/25 rounded-full shadow-lg"></div>

        {/* Sparkle Effects */}
        <Sparkles className="absolute top-1/4 right-1/3 text-orange-400/60 w-6 h-6" />
        <Sparkles className="absolute bottom-1/4 left-1/3 text-pink-400/60 w-4 h-4" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between min-h-[80vh]">
          {/* Left Side - Enhanced Product Highlight Cards */}
          <div className="flex flex-col gap-6 w-1/3 animate-fade-in-left">
            {/* Content area reserved for future cards */}
          </div>

          {/* Right Side - Enhanced Main Text Content */}
          <div className="text-right text-white w-1/2 animate-fade-in-right">
            {/* Content area reserved for future content */}
          </div>
        </div>
      </div>

      {/* Join 50K+ Customers Card - Bottom Left */}
      <div className="absolute bottom-10 left-10 md:bottom-12 md:left-12 z-20">
        <div className="bg-gradient-to-r from-orange-500/90 to-pink-500/90 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-xl border border-orange-400/30 hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
            <div>
              <p className="text-white font-bold text-base md:text-lg">Join 50K+ Customers</p>
              <p className="text-white/90 text-xs md:text-sm">Trusted by beauty enthusiasts worldwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings and Reviews - Bottom Right (Above Buttons) */}
      <div className="absolute bottom-24 right-10 md:bottom-28 md:right-12 z-20">
        <div className="flex items-center gap-3 md:gap-4 bg-black/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
          <div className="flex -space-x-1 md:-space-x-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full border-2 border-white shadow-lg"></div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full border-2 border-white shadow-lg"></div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full border-2 border-white shadow-lg"></div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-white font-bold text-sm md:text-lg">+1K</span>
              <span className="text-white/70 text-xs md:text-sm">happy customers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-white/90 font-medium text-xs md:text-sm">4.8 (15K rating)</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons - Bottom Right */}
      <div className="absolute bottom-10 right-10 md:bottom-12 md:right-12 z-20">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-4 md:px-10 md:py-6 text-base md:text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            View Collections
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/40 text-white font-semibold hover:bg-gradient-to-r hover:from-white/30 hover:to-white/20 px-6 py-4 md:px-10 md:py-6 text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Learn More
          </Button>
        </div>
      </div>

      {/* Enhanced Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-12 border-2 border-white/60 rounded-full flex justify-center hover:border-white transition-colors duration-300">
          <div className="w-1 h-4 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;