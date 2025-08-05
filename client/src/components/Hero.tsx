import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-beauty.jpg";
import { Link } from "react-router-dom";

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
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Beauty products with natural elements"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse delay-100"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-white/10 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-white/15 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <h1 className="font-playfair text-6xl md:text-8xl font-bold mb-8 animate-fade-in">
          Discover Your
          <span className="block text-transparent bg-gradient-to-r from-rose-300 via-pink-200 to-orange-200 bg-clip-text drop-shadow-lg">
            Natural Glow
          </span>
        </h1>

        <p className="text-xl md:text-2xl mb-10 text-white/95 max-w-3xl mx-auto animate-fade-in leading-relaxed">
          Premium skincare and cosmetics crafted with the finest natural ingredients 
          to enhance your unique beauty and radiance.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in mb-16">
          <Link to="/shop">
            <Button size="lg" variant="luxury" className="px-10 py-6 text-lg font-semibold shadow-luxury hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              Shop Collection
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="hero" 
            className="px-10 py-6 text-lg font-semibold backdrop-blur-md hover:bg-white/30 transition-all duration-300"
            onClick={handleDiscoverMore}
          >
            Discover More
          </Button>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-3 gap-12 mt-16 pt-8 border-t border-white/30">
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold font-playfair mb-2 group-hover:scale-110 transition-transform duration-300">100+</div>
            <div className="text-white/90 text-lg">Premium Products</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold font-playfair mb-2 group-hover:scale-110 transition-transform duration-300">50K+</div>
            <div className="text-white/90 text-lg">Happy Customers</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold font-playfair mb-2 group-hover:scale-110 transition-transform duration-300">99%</div>
            <div className="text-white/90 text-lg">Natural Ingredients</div>
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