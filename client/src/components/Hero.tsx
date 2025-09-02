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
    <section className="relative w-full h-screen overflow-hidden">
      {loading ? (
        <Skeleton className="absolute inset-0 w-full h-full" />
      ) : (
        <Swiper
          modules={[Autoplay]}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          slidesPerView={1}
        >
          {heroImages.map((image) => (
            <SwiperSlide key={image._id}>
              <img
                src={image.url}
                alt="Hero image"
                decoding="async"
                className="w-full h-screen object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Overlay content (keep your hero text/buttons here) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to Our Website
        </h1>
        <p className="text-lg md:text-2xl mb-6">
          Your tagline or description goes here
        </p>
      </div>
    </section>
  );
};

export default Hero;
