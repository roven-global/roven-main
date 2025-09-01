import { Button } from "@/components/ui/button";
// import heroImage from "@/assets/hero-beauty1.jpg";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-muted-brown/5 to-primary/10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] py-12 sm:py-16 md:py-20">
          {/* Left Side: Text Content */}
          <div className="w-full md:w-1/2 text-center md:text-left z-10 animate-fade-in-up">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground mb-4 sm:mb-6 text-balance">
              Discover Your Natural Radiance
            </h1>
            <p className="text-base sm:text-lg text-muted-brown mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0 text-balance">
              Experience the perfect blend of nature and luxury. Our products
              are crafted with the finest botanical ingredients to enhance your
              unique beauty.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-foreground hover:bg-muted-brown hover:text-white transition-all duration-300 rounded-full px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <Link to="/shop">
                  Shop Collection
                  <MoveRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-border text-muted-brown bg-transparent hover:bg-border/20 hover:border-border transition-all duration-300 rounded-full px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="w-full md:w-1/2 mt-8 sm:mt-10 md:mt-0 flex justify-center items-center">
            <div className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-soft-beige to-warm-cream rounded-full transform-gpu"></div>
              {/* <img
                src={heroImage}
                alt="Elegant beauty product display"
                decoding="async"
                className="absolute inset-6 sm:inset-8 w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] object-cover rounded-full shadow-2xl animate-slow-zoom"
              /> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
