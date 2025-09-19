import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/summaryApi";

interface Story {
  _id: string;
  title: string;
  media: {
    type: "image" | "video";
    public_id: string;
    url: string;
    duration?: number;
  };
  order: number;
  isActive: boolean;
  expirationDate?: string;
  link?: string;
  linkText?: string;
  views: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

interface StoryModalProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: "next" | "prev") => void;
}

const StoryModal: React.FC<StoryModalProps> = ({
  stories,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStory = stories[currentStoryIndex];

  // Story duration (5 seconds for images, actual duration for videos)
  const storyDuration =
    currentStory.media.type === "video"
      ? (currentStory.media.duration || 5) * 1000
      : 5000;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onNavigate("prev");
          break;
        case "ArrowRight":
          onNavigate("next");
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, isPlaying]);

  // Handle touch/swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNavigate("next");
    } else if (isRightSwipe) {
      onNavigate("prev");
    }
  };

  // Progress bar animation
  useEffect(() => {
    if (!isPlaying) return;

    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / storyDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        onNavigate("next");
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIndex, isPlaying, storyDuration, onNavigate]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentStory.media.type !== "video") return;

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
      if (isPlaying) {
        video.play().catch(console.error);
      }
    };

    const handleEnded = () => {
      onNavigate("next");
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentStoryIndex, isPlaying, onNavigate]);

  // Update current story index when prop changes
  useEffect(() => {
    setCurrentStoryIndex(currentIndex);
  }, [currentIndex]);

  // Handle story link click
  const handleLinkClick = async () => {
    if (!currentStory.link) return;

    try {
      await Axios.patch(`${SummaryApi.stories.url}/${currentStory._id}/clicks`);
      window.open(currentStory.link, "_blank");
    } catch (error) {
      console.error("Error handling link click:", error);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-100 ${
                  index < currentStoryIndex
                    ? "w-full"
                    : index === currentStoryIndex
                    ? "w-full"
                    : "w-0"
                }`}
                style={{
                  width:
                    index === currentStoryIndex ? `${progress}%` : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={() => onNavigate("prev")}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
        disabled={currentStoryIndex === 0}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={() => onNavigate("next")}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
        disabled={currentStoryIndex === stories.length - 1}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Story Content */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {currentStory.media.type === "video" ? (
          <video
            ref={videoRef}
            src={currentStory.media.url}
            className="max-w-full max-h-full object-contain"
            muted
            loop={false}
            playsInline
            onError={(e) => {
              console.warn(`Failed to load story video: ${currentStory.title}`);
            }}
          />
        ) : (
          <img
            src={currentStory.media.url}
            alt={currentStory.title}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.warn(`Failed to load story image: ${currentStory.title}`);
              e.currentTarget.src =
                "https://via.placeholder.com/400x600?text=Story";
            }}
          />
        )}

        {/* Story Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">{currentStory.title}</h3>
            {currentStory.link && (
              <button
                onClick={handleLinkClick}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {currentStory.linkText || "Learn More"}
              </button>
            )}
          </div>
        </div>

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8 5v10l8-5-8-5z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryModal;
