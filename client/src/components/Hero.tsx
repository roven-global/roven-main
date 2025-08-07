import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-beauty1.jpg";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative bg-warm-cream overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh] py-20">

          {/* Left Side: Text Content */}
          <div className="md:w-1/2 text-center md:text-left z-10 animate-fade-in-up">
            <h1 className="font-playfair text-5xl md:text-7xl font-extrabold text-deep-forest mb-6 text-balance">
              Discover Your Natural Radiance
            </h1>
            <p className="text-lg text-forest mb-8 max-w-lg mx-auto md:mx-0 text-balance">
              Experience the perfect blend of nature and luxury. Our products are crafted with the finest botanical ingredients to enhance your unique beauty.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <Button asChild size="lg" className="bg-sage text-white hover:bg-forest transition-all duration-300 rounded-full px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <Link to="/shop">
                  Shop Collection
                  <MoveRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-warm-taupe text-forest bg-transparent hover:bg-warm-taupe/20 hover:border-warm-taupe transition-all duration-300 rounded-full px-8 py-6 text-base font-semibold">
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center items-center">
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-soft-beige to-warm-cream rounded-full transform-gpu"></div>
              <img
                src={heroImage}
                alt="Elegant beauty product display"
                className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] object-cover rounded-full shadow-2xl animate-slow-zoom"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;