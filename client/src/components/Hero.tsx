import React, { useState, useEffect, useRef } from "react";
import { Skeleton } from "./ui/skeleton";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

const Hero = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const [swiper, setSwiper] = useState(null);

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

  // Handle Swiper initialization
  const handleSwiperInit = (swiperInstance) => {
    setSwiper(swiperInstance);
  };

  // Ensure Swiper navigation is properly initialized
  useEffect(() => {
    if (swiper && swiper.navigation) {
      // Initialize navigation
      swiper.navigation.init();
      swiper.navigation.update();

      // Debug: Log navigation status
      console.log("Swiper navigation initialized:", {
        hasNavigation: !!swiper.navigation,
        nextEl: swiper.navigation.nextEl,
        prevEl: swiper.navigation.prevEl,
        slidesCount: swiper.slides.length,
      });
    }
  }, [swiper, heroImages]);

  return (
    <section className="relative w-full overflow-hidden">
      {loading ? (
        <Skeleton className="w-full h-[400px] sm:h-[500px] md:h-[600px]" />
      ) : (
        <>
          <Swiper
            ref={swiperRef}
            modules={[Autoplay, Pagination, Navigation]}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            slidesPerView={1}
            onSwiper={handleSwiperInit}
            navigation={{
              nextEl: ".swiper-button-next-mobile",
              prevEl: ".swiper-button-prev-mobile",
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet",
              bulletActiveClass: "swiper-pagination-bullet-active",
              renderBullet: function (index, className) {
                return (
                  '<span class="' +
                  className +
                  '"><span class="swiper-pagination-bullet-timer"></span></span>'
                );
              },
            }}
            className="w-full"
          >
            {heroImages.map((image) => (
              <SwiperSlide key={image._id}>
                {/* Mobile Image - Hidden on desktop */}
                <img
                  src={image.mobileUrl || image.url}
                  alt={image.alt || "Hero image"}
                  decoding="async"
                  className="w-full h-auto object-cover md:hidden cursor-default"
                />
                {/* Desktop Image - Hidden on mobile */}
                <img
                  src={image.desktopUrl || image.url}
                  alt={image.alt || "Hero image"}
                  decoding="async"
                  className="w-full h-auto object-cover hidden md:block cursor-default"
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Strips for Mobile/Tablet */}
          <button
            className="swiper-button-prev-mobile absolute left-0 top-0 z-20 w-4 h-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition-all duration-200 touch-target"
            aria-label="Previous slide"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            className="swiper-button-next-mobile absolute right-0 top-0 z-20 w-4 h-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition-all duration-200 touch-target"
            aria-label="Next slide"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </section>
  );
};

export default Hero;
