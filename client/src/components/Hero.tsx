import React, { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

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

  return (
    <section className="relative w-full min-h-[200px] max-h-[350px] sm:min-h-[250px] sm:max-h-[450px] md:max-h-[550px] overflow-hidden -mb-4">
      {loading ? (
        <Skeleton className="w-full h-[200px] sm:h-[250px] md:h-[350px]" />
      ) : (
        <Swiper
          modules={[Autoplay]}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          slidesPerView={1}
          className="w-full h-full"
        >
          {heroImages.map((image) => (
            <SwiperSlide key={image._id}>
              {/* Mobile Image - Hidden on desktop */}
              <img
                src={image.mobileUrl || image.url}
                alt={image.alt || "Hero image"}
                decoding="async"
                className="w-full h-full object-cover md:hidden"
              />
              {/* Desktop Image - Hidden on mobile */}
              <img
                src={image.desktopUrl || image.url}
                alt={image.alt || "Hero image"}
                decoding="async"
                className="w-full h-full object-cover hidden md:block"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default Hero;
