import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import Swiper from "react-id-swiper";
import "swiper/css";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { Skeleton } from "./ui/skeleton";

const Hero = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHeroImages = async () => {
    try {
      const response = await Axios.get(SummaryApi.getHeroImages.url);
      setHeroImages(response.data);
    } catch (error) {
      console.error("Failed to fetch hero images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const params = {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    slidesPerView: 1,
    effect: "slide",
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-accent-green/5 to-primary/10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] py-12 sm:py-16 md:py-20">
          {/* Right Side: Image Carousel */}
          <div className="w-full md:w-1/2 mt-8 sm:mt-10 md:mt-0 flex justify-center items-center">
            <div className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-light-vibrant to-warm-cream rounded-full transform-gpu"></div>
              {loading ? (
                <Skeleton className="absolute inset-6 sm:inset-8 w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] rounded-full" />
              ) : (
                <Swiper {...params}>
                  {heroImages.map((image) => (
                    <div key={image._id}>
                      <img
                        src={image.url}
                        alt="Hero image"
                        decoding="async"
                        className="absolute inset-6 sm:inset-8 w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)] object-cover rounded-full shadow-2xl animate-slow-zoom"
                      />
                    </div>
                  ))}
                </Swiper>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;