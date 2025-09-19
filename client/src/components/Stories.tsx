import React, { useState, useEffect } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/summaryApi";
import StoryModal from "./StoryModal";

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

interface GroupedStory {
  date: string;
  dateKey: string;
  stories: Story[];
  displayTitle: string;
}

interface StoryScrollItem {
  type: "story";
  data: GroupedStory;
  position: number;
}

const Stories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStory[]>([]);
  const [scrollItems, setScrollItems] = useState<StoryScrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(
    null
  );
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const titles = ["Style Stories", "Glow Stories", "Our Stories"];

  // Convert grouped stories to scroll items
  const convertStoriesToScrollItems = (
    groupedStories: GroupedStory[]
  ): StoryScrollItem[] => {
    return groupedStories.map((group, index) => ({
      type: "story" as const,
      data: group,
      position: index + 1,
    }));
  };

  // Group stories by date
  const groupStoriesByDate = (stories: Story[]): GroupedStory[] => {
    const groups: { [key: string]: Story[] } = {};

    stories.forEach((story) => {
      const storyDate = new Date(story.createdAt);
      const dateKey = storyDate.toDateString(); // e.g., "Mon Jan 01 2024"
      const dateString = storyDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(story);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .map(([dateKey, stories]) => {
        const storyDate = new Date(stories[0].createdAt);
        const dateString = storyDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Sort stories within each group by creation time (newest first)
        const sortedStories = stories.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return {
          date: dateString,
          dateKey,
          stories: sortedStories,
          displayTitle: "Roven Beauty Today",
        };
      })
      .sort(
        (a, b) =>
          new Date(b.stories[0].createdAt).getTime() -
          new Date(a.stories[0].createdAt).getTime()
      );
  };

  // Rotate titles every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(SummaryApi.stories);

        if (response.data.success) {
          const fetchedStories = response.data.stories;
          setStories(fetchedStories);
          const grouped = groupStoriesByDate(fetchedStories);
          setGroupedStories(grouped);
        } else {
          setError("Failed to fetch stories");
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        setError("Error loading stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Convert stories to scroll items when loaded
  useEffect(() => {
    if (!loading && groupedStories.length > 0) {
      const scrollItems = convertStoriesToScrollItems(groupedStories);
      setScrollItems(scrollItems);
    }
  }, [groupedStories, loading]);

  // Handle story group click
  const handleStoryGroupClick = async (
    group: GroupedStory,
    groupIndex: number
  ) => {
    try {
      // Increment clicks for the first story in the group
      if (group.stories.length > 0) {
        await Axios.patch(
          `${SummaryApi.stories}/${group.stories[0]._id}/clicks`
        );
      }

      // Open story modal with the group
      setSelectedGroupIndex(groupIndex);
      setSelectedStoryIndex(0); // Start with first story in the group
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error handling story group click:", error);
    }
  };

  // Handle story view tracking
  const handleStoryView = async (storyId: string) => {
    try {
      await Axios.patch(`${SummaryApi.stories}/${storyId}/views`);
    } catch (error) {
      console.error("Error incrementing story views:", error);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStoryIndex(null);
    setSelectedGroupIndex(null);
  };

  // Navigate to next/previous story within the current group
  const handleNavigateStory = (direction: "next" | "prev") => {
    if (selectedStoryIndex === null || selectedGroupIndex === null) return;

    const currentGroup = groupedStories[selectedGroupIndex];
    if (!currentGroup) return;

    if (
      direction === "next" &&
      selectedStoryIndex < currentGroup.stories.length - 1
    ) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else if (direction === "prev" && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  if (loading) {
    return (
      <section className="stories-section bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center pb-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto mb-4"></div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || scrollItems.length === 0) {
    return null; // Don't show section if no stories or error
  }

  return (
    <>
      <section className="stories-section bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Title with Rotation */}
          <div className="text-center pb-6">
            <h2 className="stories-title text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 uppercase tracking-wide transition-all duration-500 ease-in-out">
              {titles[currentTitleIndex]}
            </h2>
          </div>

          {/* Stories Container */}
          <div className="stories-container">
            <div className="stories-scroll">
              {/* Render stories */}
              {scrollItems.map((item, index) => {
                const group = item.data as GroupedStory;
                const groupIndex = groupedStories.indexOf(group);

                return (
                  <div
                    key={group.dateKey}
                    className="story-item story-group"
                    onClick={() => handleStoryGroupClick(group, groupIndex)}
                    onMouseEnter={() => {
                      // Track view for the first story in the group
                      if (group.stories.length > 0) {
                        handleStoryView(group.stories[0]._id);
                      }
                    }}
                  >
                    <div className="story-image-container">
                      {/* Show the first story's media as the group thumbnail */}
                      {group.stories[0].media.type === "video" ? (
                        <video
                          src={group.stories[0].media.url}
                          className="story-media"
                          muted
                          preload="metadata"
                          onError={(e) => {
                            console.warn(
                              `Failed to load story video: ${group.stories[0].title}`
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <img
                          src={group.stories[0].media.url}
                          alt={group.displayTitle}
                          className="story-media"
                          onError={(e) => {
                            console.warn(
                              `Failed to load story image: ${group.stories[0].title}`
                            );
                            e.currentTarget.src =
                              "https://via.placeholder.com/80x80?text=Story";
                          }}
                        />
                      )}

                      {/* Show play icon if the first story is a video */}
                      {group.stories[0].media.type === "video" && (
                        <div className="story-play-icon">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8 5v10l8-5-8-5z" />
                          </svg>
                        </div>
                      )}

                      {/* Show story count badge if more than one story */}
                      {group.stories.length > 1 && (
                        <div className="story-count-badge">
                          {group.stories.length}
                        </div>
                      )}
                    </div>
                    <p className="story-title">{group.displayTitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Story Modal */}
      {isModalOpen &&
        selectedStoryIndex !== null &&
        selectedGroupIndex !== null && (
          <StoryModal
            stories={groupedStories[selectedGroupIndex]?.stories || []}
            currentIndex={selectedStoryIndex}
            onClose={handleCloseModal}
            onNavigate={handleNavigateStory}
          />
        )}
    </>
  );
};

export default Stories;
