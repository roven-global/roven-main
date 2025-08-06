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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Beauty products with natural elements"
          className="w-full h-full object-cover scale-110 animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400/30 rounded-full animate-pulse delay-100 shadow-lg"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/20 rounded-full animate-pulse delay-300 shadow-lg"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-yellow-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-purple-400/25 rounded-full animate-pulse delay-1000"></div>

        {/* Sparkle Effects */}
        <Sparkles className="absolute top-1/4 right-1/3 text-orange-400/60 w-6 h-6 animate-pulse" />
        <Sparkles className="absolute bottom-1/4 left-1/3 text-pink-400/60 w-4 h-4 animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between min-h-[80vh]">
          {/* Left Side - Enhanced Product Highlight Cards */}
          <div className="flex flex-col gap-6 w-1/3 animate-fade-in-left">
            {/* Top Card with Hover Effects */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="w-8 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-md"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-semibold text-base mb-2">Vitamin C 10% Face Serum</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">(2.1k reviews)</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>

            {/* Bottom Card with Enhanced Content */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-md"></div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-md"></div>
                </div>
              </div>
              <div>
                <p className="text-gray-800 font-bold text-lg mb-2">Every skin is beautiful</p>
                <p className="text-gray-600 text-sm leading-relaxed">Embrace your natural beauty with our high quality products.</p>
                <div className="flex items-center gap-2 mt-3">
                  <Award className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500 text-sm font-medium">Award Winning</span>
                </div>
              </div>
            </div>

            {/* New Feature Card */}
            <div className="bg-gradient-to-r from-orange-500/90 to-pink-500/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-orange-400/30 hover:shadow-2xl hover:scale-105 transition-all duration-500 group">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-white" />
                <div>
                  <p className="text-white font-bold text-lg">Join 50K+ Customers</p>
                  <p className="text-white/90 text-sm">Trusted by beauty enthusiasts worldwide</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Main Text Content */}
          <div className="text-right text-white w-1/2 animate-fade-in-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-white/90 text-sm font-medium">Premium Quality</span>
            </div>



            {/* Enhanced Ratings and Reviews */}
            <div className="flex items-center justify-end gap-4 mb-8">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full border-2 border-white shadow-lg"></div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full border-2 border-white shadow-lg"></div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-white font-bold text-lg">+27K</span>
                  <span className="text-white/70 text-sm">happy customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-white/90 font-medium">4.8 (15K rating)</span>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-10 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              >
                View Collections
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
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