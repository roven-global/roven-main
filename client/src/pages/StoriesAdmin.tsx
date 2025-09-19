import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Edit,
  Plus,
  Upload,
  Eye,
  MousePointer,
  Star,
  Clock,
  Play,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Axios from "../utils/Axios";
import SummaryApi from "../common/summaryApi";
import StoryEditor from "../components/StoryEditor";
import ViewsModal from "../components/ViewsModal";
import ClicksModal from "../components/ClicksModal";

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
  createdBy: {
    name: string;
    email: string;
  };
}

interface ViewDetail {
  _id: string;
  userName: string;
  userEmail: string | null;
  isAnonymous: boolean;
  viewedAt: string;
  userAgent: string;
  ipAddress: string;
}

interface ClickDetail {
  _id: string;
  userName: string;
  userEmail: string | null;
  isAnonymous: boolean;
  clickCount: number;
  firstClickAt: string;
  lastClickAt: string;
  userAgent: string;
  ipAddress: string;
}

// Utility function for consistent DD/MM/YYYY date formatting
const formatDateDDMMYYYY = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const StoriesAdmin: React.FC = () => {
  // Error boundary state
  const [hasError, setHasError] = useState(false);

  // Helper function to check if a story is currently active (not expired)
  const isStoryCurrentlyActive = (story: Story, currentTime: Date): boolean => {
    if (!story.isActive) return false;
    if (!story.expirationDate) return true;
    return new Date(story.expirationDate) > currentTime;
  };
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    order: 0,
    isActive: true,
    link: "",
    linkText: "",
    expirationHours: 24,
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "today">("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dummy variables to fix linting errors for disabled highlights section
  const highlightsLoading = false;
  const highlightsData: any[] = [];
  const showInactiveHighlights = false;
  const setShowInactiveHighlights = (_: any) => {};
  const testHighlightsAPI = () => {};
  const refetchHighlights = () => {};
  const getFilteredHighlights = () => [];
  const setEditingHighlight = (_: any) => {};
  const setShowHighlightForm = (_: any) => {};
  const handleHighlightEdit = (_: any) => {};
  const handleHighlightDelete = (_: any) => {};
  const handleHighlightToggleActive = (_: any) => {};
  const HighlightCard = (props: any) => null;

  // Views modal state
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewsData, setViewsData] = useState<{
    totalViews: number;
    views: ViewDetail[];
  }>({ totalViews: 0, views: [] });
  const [loadingViews, setLoadingViews] = useState(false);

  // Clicks modal state
  const [showClicksModal, setShowClicksModal] = useState(false);
  const [clicksData, setClicksData] = useState<{
    totalClicks: number;
    clicks: ClickDetail[];
  }>({ totalClicks: 0, clicks: [] });
  const [loadingClicks, setLoadingClicks] = useState(false);

  // Real-time status updates - update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch all stories
  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Axios.get(`${SummaryApi.storiesAdmin}/all`);

      if (response.data.success) {
        setStories(response.data.stories || []);
        setRetryCount(0);
      } else {
        const errorMsg = response.data.message || "Failed to fetch stories";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error fetching stories:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Error loading stories";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Retry function
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchStories();
  };

  // Categorize stories into departments
  const categorizeStories = () => {
    const now = new Date();

    // Helper function to check if a story is expired
    const isStoryExpired = (story: Story) => {
      if (!story.expirationDate) return false;
      return new Date(story.expirationDate) < now;
    };

    // Today's Stories: Only active stories (regardless of creation date)
    const todaysStories = stories.filter((story) => {
      return isStoryCurrentlyActive(story, now);
    });

    // All Stories: Both active and inactive stories
    const allStories = stories.sort((a, b) => {
      // Sort by active status first (active at top), then by creation date
      const aActive = isStoryCurrentlyActive(a, now);
      const bActive = isStoryCurrentlyActive(b, now);
      if (aActive !== bActive) {
        return aActive ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      todaysStories,
      allStories,
    };
  };

  // Get filtered stories based on active tab
  const getFilteredStories = () => {
    const { todaysStories, allStories } = categorizeStories();

    switch (activeTab) {
      case "today":
        return todaysStories;
      case "all":
        return allStories;
      default:
        return allStories;
    }
  };

  useEffect(() => {
    try {
      fetchStories();
    } catch (error) {
      console.error("Error in useEffect:", error);
      setHasError(true);
      setError("Failed to initialize stories");
    }
  }, []);

  // Re-categorize stories whenever the stories array changes
  useEffect(() => {
    // This effect ensures that categorization is updated whenever stories change
    // The categorization logic runs in getFilteredStories() which is called during render
  }, [stories]);

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-4 admin-panel-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 error-state">
          <div className="text-red-500 text-6xl error-icon">💥</div>
          <h2 className="text-xl font-semibold text-gray-700 error-title">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-center max-w-md error-message">
            There was an error loading the Stories Management page. Please try
            refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Determine media type
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      order: 0,
      isActive: true,
      link: "",
      linkText: "",
      expirationHours: 24,
    });
    setMediaFile(null);
    setMediaPreview("");
    setMediaType("image");
    setEditingStory(null);
    setShowForm(false);
    setIsSubmitting(false);
    setShowAdvancedEditor(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    if (!editingStory && !mediaFile) {
      toast.error("Story media (image/video) is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("order", formData.order.toString());
      submitData.append("isActive", formData.isActive.toString());
      submitData.append("link", formData.link);
      submitData.append("linkText", formData.linkText);
      submitData.append("expirationHours", formData.expirationHours.toString());

      if (mediaFile) {
        submitData.append("media", mediaFile);
      }

      let response;
      if (editingStory) {
        response = await Axios.put(
          `${SummaryApi.storiesAdmin}/${editingStory._id}`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await Axios.post(
          `${SummaryApi.storiesAdmin}/create`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      if (response.data.success) {
        toast.success(
          editingStory
            ? "Story updated successfully"
            : "Story created successfully"
        );

        if (editingStory) {
          // For updates, just reset and refresh
          resetForm();
          fetchStories();
        } else {
          // For new stories, reset form and refresh stories
          resetForm();
          fetchStories();
        }
      } else {
        toast.error("Failed to save story");
      }
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Error saving story");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle advanced editor save
  const handleAdvancedEditorSave = async (storyData: any) => {
    try {
      setIsSubmitting(true);

      const submitData = new FormData();
      // Add required title field - generate a default title if not provided
      const title =
        storyData.title ||
        `Story ${formatDateDDMMYYYY(new Date().toISOString())}`;
      submitData.append("title", title);
      submitData.append("order", (storyData.order || 0).toString());
      submitData.append(
        "isActive",
        (storyData.isActive !== undefined
          ? storyData.isActive
          : true
        ).toString()
      );
      submitData.append("link", storyData.link || "");
      submitData.append("linkText", storyData.linkText || "");
      submitData.append(
        "expirationHours",
        (storyData.expirationHours || 24).toString()
      );

      // Add customizations as JSON
      submitData.append(
        "customizations",
        JSON.stringify({
          overlays: storyData.overlays || [],
          filters: storyData.filters || {},
          crop: storyData.crop || {},
          rotation: storyData.rotation || 0,
        })
      );

      if (storyData.mediaFile) {
        submitData.append("media", storyData.mediaFile);
      }

      let response;
      if (editingStory && storyData.id) {
        // Update existing story
        response = await Axios.put(
          `${SummaryApi.storiesAdmin}/${editingStory._id}`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        // Create new story
        response = await Axios.post(
          `${SummaryApi.storiesAdmin}/create`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      if (response.data.success) {
        toast.success(
          editingStory
            ? "Story updated successfully!"
            : "Story created successfully!"
        );
        setShowAdvancedEditor(false);
        setEditingStory(null);
        fetchStories();
      } else {
        toast.error("Failed to save story");
      }
    } catch (error: any) {
      console.error("Error saving story:", error);
      toast.error(error.response?.data?.message || "Error saving story");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setShowAdvancedEditor(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (storyId: string) => {
    setStoryToDelete(storyId);
    setShowDeleteConfirm(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!storyToDelete) return;

    try {
      const response = await Axios.delete(
        `${SummaryApi.storiesAdmin}/${storyToDelete}`
      );

      if (response.data.success) {
        toast.success("Story deleted successfully");
        fetchStories();
      } else {
        toast.error("Failed to delete story");
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Error deleting story");
    } finally {
      setShowDeleteConfirm(false);
      setStoryToDelete(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setStoryToDelete(null);
  };

  // Handle views button click
  const handleViewsClick = async (story: Story) => {
    setSelectedStory(story);
    setLoadingViews(true);
    setShowViewsModal(true);

    try {
      console.log(
        `Fetching views for story: ${story.title} (ID: ${story._id})`
      );
      const response = await Axios.get(
        `${SummaryApi.stories.url}/admin/${story._id}/views`
      );

      console.log("Views API response:", response.data);

      if (response.data.success) {
        setViewsData(response.data.data);
        toast.success("Story views loaded successfully");
      } else {
        console.error("Views API returned error:", response.data.message);
        toast.error(
          `Failed to load story views: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error: any) {
      console.error("Error fetching story views:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";
      toast.error(`Failed to load story views: ${errorMessage}`);
    } finally {
      setLoadingViews(false);
    }
  };

  // Handle views modal close
  const handleViewsModalClose = () => {
    setShowViewsModal(false);
    setSelectedStory(null);
    setViewsData({ totalViews: 0, views: [] });
  };

  // Handle clicks button click
  const handleClicksClick = async (story: Story) => {
    setSelectedStory(story);
    setLoadingClicks(true);
    setShowClicksModal(true);

    try {
      console.log(
        `Fetching clicks for story: ${story.title} (ID: ${story._id})`
      );
      const response = await Axios.get(
        `${SummaryApi.stories.url}/admin/${story._id}/clicks`
      );

      console.log("Clicks API response:", response.data);

      if (response.data.success) {
        setClicksData(response.data.data);
        toast.success("Story clicks loaded successfully");
      } else {
        console.error("Clicks API returned error:", response.data.message);
        toast.error(
          `Failed to load story clicks: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error: any) {
      console.error("Error fetching story clicks:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Network error";
      toast.error(`Failed to load story clicks: ${errorMessage}`);
    } finally {
      setLoadingClicks(false);
    }
  };

  // Handle clicks modal close
  const handleClicksModalClose = () => {
    setShowClicksModal(false);
    setSelectedStory(null);
    setClicksData({ totalClicks: 0, clicks: [] });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 admin-panel-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 loading-state">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Stories
          </h2>
          <p className="text-gray-500">
            Please wait while we fetch your stories...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-4 admin-panel-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 error-state">
          <div className="text-red-500 text-6xl error-icon">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 error-title">
            Failed to Load Stories
          </h2>
          <p className="text-gray-500 text-center max-w-md error-message">
            {error}
          </p>
          <div className="flex gap-3 error-actions">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <Loader2 className="w-4 h-4" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Stories Management
          </h1>
        </div>
        <div className="flex items-center space-x-4"></div>
      </div>

      {/* Department Navigation Tabs */}
      <div className="mb-3">
        <div className="flex justify-center gap-2 department-tabs">
          <Button
            variant={activeTab === "today" ? "default" : "outline"}
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <Clock className="w-4 h-4" />
            Active Stories (
            {
              stories.filter(
                (story) =>
                  story.isActive &&
                  (!story.expirationDate ||
                    new Date(story.expirationDate) > new Date())
              ).length
            }
            )
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            All Stories ({categorizeStories().allStories.length})
          </Button>
        </div>
      </div>

      {/* Stories Grid */}
      {(() => {
        const filteredStories = getFilteredStories();

        // Check for active stories specifically
        const activeStories = stories.filter(
          (story) =>
            story.isActive &&
            (!story.expirationDate ||
              new Date(story.expirationDate) > new Date())
        );
        console.log("Active stories:", activeStories.length, activeStories);

        if (stories.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 empty-state">
              <div className="text-gray-400 text-6xl empty-icon">📖</div>
              <h2 className="text-2xl font-semibold text-gray-700 empty-title">
                No Stories Yet
              </h2>
              <p className="text-gray-500 text-center max-w-md empty-message">
                Get started by creating your first active story. Use the "Create
                Story" button to add engaging content with photos, videos, and
                interactive elements.
              </p>
              <div className="flex gap-3 mt-6 empty-actions">
                <Button
                  onClick={() => setShowAdvancedEditor(true)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Your First Story
                </Button>
              </div>
            </div>
          );
        }

        if (filteredStories.length === 0) {
          const getEmptyMessage = () => {
            switch (activeTab) {
              case "today":
                return {
                  icon: "📅",
                  title: "No Active Stories Today",
                  message:
                    "No active stories were created today. Create a new story to get started!",
                };
              case "all":
                return {
                  icon: "📖",
                  title: "No Stories Found",
                  message:
                    "No stories have been created yet. Create your first story to get started!",
                };
              default:
                return {
                  icon: "📖",
                  title: "No Stories",
                  message: "No stories found in this category.",
                };
            }
          };

          const emptyData = getEmptyMessage();

          return (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 empty-state">
              <div className="text-gray-400 text-5xl empty-icon">
                {emptyData.icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-700 empty-title">
                {emptyData.title}
              </h2>
              {emptyData.message && (
                <p className="text-gray-500 text-center max-w-md empty-message">
                  {emptyData.message}
                </p>
              )}
              {activeTab === "today" && (
                <div className="flex gap-2 mt-4 empty-actions">
                  <Button
                    onClick={() => setActiveTab("all")}
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View All Stories
                  </Button>
                  <Button
                    onClick={() => setShowAdvancedEditor(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create New Story
                  </Button>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {/* Department Header */}
            <div className="department-header">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 mb-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeTab === "all" && "All Stories"}
                    {activeTab === "today" && "Active Stories"}
                  </h2>
                </div>

                {/* Action buttons - show in Active Stories section */}
                {activeTab === "today" && (
                  <div className="flex flex-col sm:flex-row gap-2 stories-action-buttons">
                    <Button
                      onClick={() => setShowAdvancedEditor(true)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Story</span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Grid - Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 stories-admin-grid max-w-7xl mx-auto">
              {/* Today's Stories tab - show active stories */}
              {activeTab === "today" &&
                (() => {
                  const activeStoriesForRender = stories.filter(
                    (story) =>
                      story.isActive &&
                      (!story.expirationDate ||
                        new Date(story.expirationDate) > new Date())
                  );
                  console.log(
                    "Rendering active stories:",
                    activeStoriesForRender.length,
                    activeStoriesForRender
                  );

                  return (
                    <>
                      {activeStoriesForRender.map((story) => (
                        <Card
                          key={story._id}
                          className="overflow-hidden stories-admin-vertical-card"
                        >
                          <div className="flex flex-col sm:flex-row h-auto min-h-[120px]">
                            {/* Media Section - Left side on desktop, top on mobile */}
                            <div className="relative w-full sm:w-[70%] flex-shrink-0">
                              {story.media.type === "video" ? (
                                <video
                                  src={story.media.url}
                                  className="w-full h-full object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={story.media.url}
                                  alt={story.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0">
                                {story.media.type}
                              </Badge>
                            </div>

                            {/* Content Section - Right side on desktop, bottom on mobile */}
                            <div className="w-full sm:w-[30%] flex-shrink-0 p-3 flex flex-col justify-between bg-gray-50">
                              {/* Top Section - Created Date Badge */}
                              <div className="mb-4">
                                <div className="flex items-center justify-center">
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-3 py-2 bg-gray-50 text-gray-600 border-gray-200 font-medium text-center leading-tight"
                                  >
                                    <div className="flex flex-col items-center">
                                      <span>Created</span>
                                      <span className="font-semibold">
                                        {formatDateDDMMYYYY(story.createdAt)}
                                      </span>
                                    </div>
                                  </Badge>
                                </div>
                              </div>

                              {/* Middle Section - Status and Timing */}
                              <div className="space-y-2 flex-1">
                                {/* Active Status Badge */}
                                <div className="flex items-center justify-center">
                                  <Badge
                                    variant="default"
                                    className="text-xs px-2 py-1 font-medium bg-green-100 text-green-800 border-green-200"
                                  >
                                    Active
                                  </Badge>
                                </div>

                                {/* Timing Countdown */}
                                {story.expirationDate && (
                                  <div className="flex items-center justify-center">
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200 font-medium"
                                    >
                                      {(() => {
                                        const exp = new Date(
                                          story.expirationDate
                                        );
                                        const diffMs =
                                          exp.getTime() - currentTime.getTime();
                                        const diffHours = Math.floor(
                                          diffMs / (1000 * 60 * 60)
                                        );
                                        const diffMins = Math.floor(
                                          (diffMs % (1000 * 60 * 60)) /
                                            (1000 * 60)
                                        );

                                        if (diffHours > 0) {
                                          return `${diffHours}h ${diffMins}m left`;
                                        } else {
                                          return `${diffMins}m left`;
                                        }
                                      })()}
                                    </Badge>
                                  </div>
                                )}

                                {/* Roven Beauty Brand */}
                                <div className="flex items-center justify-center pt-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Roven Beauty
                                  </span>
                                </div>
                              </div>

                              {/* Bottom Section - Action Buttons */}
                              <div className="space-y-1.5 mt-4 pt-2 border-t border-gray-200">
                                {/* Views Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewsClick(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-gray-700">
                                    Views: {story.views}
                                  </span>
                                </Button>

                                {/* Clicks Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClicksClick(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                                >
                                  <MousePointer className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-gray-700">
                                    Clicks: {story.clicks}
                                  </span>
                                </Button>

                                {/* Edit Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-blue-700 hover:bg-blue-50 border-gray-300 active:bg-blue-100 flex items-center justify-between bg-white"
                                  title="Edit story"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-blue-700">
                                    Edit
                                  </span>
                                </Button>

                                {/* Delete Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(story._id)}
                                  className="w-full h-8 px-3 text-xs font-normal text-red-700 hover:bg-red-50 border-gray-300 active:bg-red-100 flex items-center justify-between bg-white"
                                  title="Delete story"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-red-700">
                                    Delete
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  );
                })()}

              {/* All Stories tab - show both active and inactive stories */}
              {activeTab === "all" &&
                (() => {
                  const { allStories } = categorizeStories();

                  return (
                    <>
                      {allStories.map((story) => (
                        <Card
                          key={story._id}
                          className="overflow-hidden stories-admin-vertical-card"
                        >
                          <div className="flex flex-col sm:flex-row h-auto min-h-[120px]">
                            {/* Media Section - Left side on desktop, top on mobile */}
                            <div className="relative w-full sm:w-[70%] flex-shrink-0">
                              {story.media.type === "video" ? (
                                <video
                                  src={story.media.url}
                                  className="w-full h-full object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={story.media.url}
                                  alt={story.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0">
                                {story.media.type}
                              </Badge>
                            </div>

                            {/* Content Section - Right side on desktop, bottom on mobile */}
                            <div className="w-full sm:w-[30%] flex-shrink-0 p-3 flex flex-col justify-between bg-gray-50">
                              {/* Top Section - Created Date Badge */}
                              <div className="mb-4">
                                <div className="flex items-center justify-center">
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-3 py-2 bg-gray-50 text-gray-600 border-gray-200 font-medium text-center leading-tight"
                                  >
                                    <div className="flex flex-col items-center">
                                      <span>Created</span>
                                      <span className="font-semibold">
                                        {formatDateDDMMYYYY(story.createdAt)}
                                      </span>
                                    </div>
                                  </Badge>
                                </div>
                              </div>

                              {/* Middle Section - Status and Timing */}
                              <div className="space-y-2 flex-1">
                                {/* Active Status Badge */}
                                <div className="flex items-center justify-center">
                                  <Badge
                                    variant={
                                      isStoryCurrentlyActive(story, currentTime)
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`text-xs px-2 py-1 font-medium ${
                                      isStoryCurrentlyActive(story, currentTime)
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-gray-100 text-gray-800 border-gray-200"
                                    }`}
                                  >
                                    {isStoryCurrentlyActive(story, currentTime)
                                      ? "Active"
                                      : "Inactive"}
                                  </Badge>
                                </div>

                                {/* Timing Countdown */}
                                {story.expirationDate &&
                                  isStoryCurrentlyActive(
                                    story,
                                    currentTime
                                  ) && (
                                    <div className="flex items-center justify-center">
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200 font-medium"
                                      >
                                        {(() => {
                                          const exp = new Date(
                                            story.expirationDate
                                          );
                                          const diffMs =
                                            exp.getTime() -
                                            currentTime.getTime();
                                          const diffHours = Math.floor(
                                            diffMs / (1000 * 60 * 60)
                                          );
                                          const diffMins = Math.floor(
                                            (diffMs % (1000 * 60 * 60)) /
                                              (1000 * 60)
                                          );

                                          if (diffHours > 0) {
                                            return `${diffHours}h ${diffMins}m left`;
                                          } else {
                                            return `${diffMins}m left`;
                                          }
                                        })()}
                                      </Badge>
                                    </div>
                                  )}

                                {/* Roven Beauty Brand */}
                                <div className="flex items-center justify-center pt-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Roven Beauty
                                  </span>
                                </div>
                              </div>

                              {/* Bottom Section - Action Buttons */}
                              <div className="space-y-1.5 mt-4 pt-2 border-t border-gray-200">
                                {/* Views Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewsClick(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-gray-700">
                                    Views: {story.views}
                                  </span>
                                </Button>

                                {/* Clicks Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClicksClick(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                                >
                                  <MousePointer className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-gray-700">
                                    Clicks: {story.clicks}
                                  </span>
                                </Button>

                                {/* Edit Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(story)}
                                  className="w-full h-8 px-3 text-xs font-normal text-blue-700 hover:bg-blue-50 border-gray-300 active:bg-blue-100 flex items-center justify-between bg-white"
                                  title="Edit story"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-blue-700">
                                    Edit
                                  </span>
                                </Button>

                                {/* Delete Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(story._id)}
                                  className="w-full h-8 px-3 text-xs font-normal text-red-700 hover:bg-red-50 border-gray-300 active:bg-red-100 flex items-center justify-between bg-white"
                                  title="Delete story"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                  <span className="text-xs font-normal text-red-700">
                                    Delete
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </>
                  );
                })()}

              {false ? (
                <>
                  {/* TEST: This should always be visible */}
                  <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                    <h3 className="font-bold text-red-800">
                      🔴 TEST: Highlights Tab is Active!
                    </h3>
                    <p className="text-red-700">
                      Loading: {highlightsLoading ? "Yes" : "No"}, Count:{" "}
                      {highlightsData.length}
                    </p>
                  </div>

                  {console.log(
                    "Highlights tab active - highlightsLoading:",
                    highlightsLoading,
                    "highlightsData.length:",
                    highlightsData.length
                  )}
                  {highlightsLoading ? (
                    /* Loading State */
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-gray-600">Loading highlights...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Highlights Controls - Always visible */}
                      {console.log(
                        "Rendering highlights controls - highlightsData.length:",
                        highlightsData.length
                      )}
                      <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h4 className="font-bold text-blue-900 text-lg">
                              🔧 Highlights Management Controls
                            </h4>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="showInactive"
                                checked={showInactiveHighlights}
                                onChange={(e) =>
                                  setShowInactiveHighlights(e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <label
                                htmlFor="showInactive"
                                className="text-sm text-gray-700"
                              >
                                Show inactive highlights
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={testHighlightsAPI}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Test API
                            </Button>
                            <Button
                              onClick={refetchHighlights}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Refresh Data
                            </Button>
                            <Button
                              onClick={() => {
                                console.log(
                                  "Current highlightsData:",
                                  highlightsData
                                );
                                console.log(
                                  "Filtered highlights:",
                                  getFilteredHighlights()
                                );
                                console.log(
                                  "showInactiveHighlights:",
                                  showInactiveHighlights
                                );
                              }}
                              size="sm"
                              variant="outline"
                              className="text-xs bg-yellow-100"
                            >
                              Debug State
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await Axios.post(
                                    "/api/highlights",
                                    {
                                      title: "Test Highlight",
                                      stories: [],
                                      rank: 1,
                                      isActive: true,
                                      description:
                                        "Test highlight for debugging",
                                    }
                                  );
                                  console.log(
                                    "Test highlight created:",
                                    response.data
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error creating test highlight:",
                                    error
                                  );
                                }
                              }}
                              size="sm"
                              variant="outline"
                              className="text-xs bg-green-100"
                            >
                              Create Test
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Showing {getFilteredHighlights().length} of{" "}
                          {highlightsData.length} highlights
                          {!showInactiveHighlights &&
                            highlightsData.some((h) => !h.isActive) &&
                            ` (${
                              highlightsData.filter((h) => !h.isActive).length
                            } inactive hidden)`}
                        </p>
                      </div>

                      {highlightsData.length === 0 ? (
                        /* Empty State - No Highlight Cards */
                        <Card
                          className="overflow-hidden stories-admin-vertical-card highlight-create-button border-dashed border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => {
                            setEditingHighlight(null);
                            setShowHighlightForm(true);
                          }}
                        >
                          <div className="p-6 text-center min-h-[200px] flex flex-col justify-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center shadow-sm">
                                <Plus className="w-8 h-8 text-indigo-700" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                                  Create Your First Highlight
                                </h3>
                                <p className="text-sm text-indigo-700">
                                  Add a new highlight card to organize and
                                  showcase your best stories
                                </p>
                              </div>
                              <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHighlight(null);
                                  setShowHighlightForm(true);
                                }}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Create Highlight
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        /* Highlights Grid - Show Existing Highlight Cards */
                        <>
                          {/* Debug Info - Remove in production */}
                          {process.env.NODE_ENV === "development" && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-semibold text-blue-900 mb-2">
                                Highlights Debug Info:
                              </h4>
                              <p className="text-sm text-blue-800 mb-3">
                                Found {highlightsData.length} highlight(s).
                                Data:{" "}
                                {JSON.stringify(
                                  highlightsData.map((h) => ({
                                    id: h._id,
                                    title: h.title,
                                    storiesCount: h.stories.length,
                                    isActive: h.isActive,
                                    rank: h.rank,
                                  })),
                                  null,
                                  2
                                )}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={testHighlightsAPI}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Test API
                                </Button>
                                <Button
                                  onClick={refetchHighlights}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Refetch Data
                                </Button>
                              </div>
                            </div>
                          )}

                          {getFilteredHighlights()
                            .sort((a, b) => a.rank - b.rank)
                            .map((highlight) => {
                              // Transform HighlightWithStories to Highlight format for HighlightCard
                              const transformedHighlight = {
                                _id: highlight._id,
                                title: highlight.title,
                                coverImage: highlight.coverImage,
                                stories: highlight.stories.map((story) => ({
                                  _id: story._id,
                                  title: story.title,
                                  media: {
                                    type: story.media.type,
                                    url: story.media.url,
                                  },
                                })),
                                rank: highlight.rank,
                                isActive: highlight.isActive,
                                description:
                                  (highlight as any).description || "",
                                createdAt: highlight.createdAt,
                                updatedAt: highlight.updatedAt,
                              };

                              return (
                                <HighlightCard
                                  key={highlight._id}
                                  highlight={transformedHighlight}
                                  onEdit={handleHighlightEdit}
                                  onDelete={handleHighlightDelete}
                                  onToggleActive={handleHighlightToggleActive}
                                  showActions={true}
                                />
                              );
                            })}

                          {/* Add New Highlight Card */}
                          <Card
                            className="overflow-hidden stories-admin-vertical-card border-dashed border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => {
                              setEditingHighlight(null);
                              setShowHighlightForm(true);
                            }}
                          >
                            <div className="p-6 text-center min-h-[150px] flex flex-col justify-center">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center shadow-sm">
                                  <Plus className="w-6 h-6 text-indigo-700" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-indigo-900 mb-1">
                                    Add New Highlight
                                  </h3>
                                  <p className="text-sm text-indigo-700">
                                    Create another highlight card
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                activeTab !== "all" &&
                activeTab !== "today" &&
                filteredStories.map((story) => (
                  <Card
                    key={story._id}
                    className="overflow-hidden stories-admin-vertical-card"
                  >
                    <div className="flex flex-col sm:flex-row h-auto min-h-[120px]">
                      {/* Media Section - Left side on desktop, top on mobile */}
                      <div className="relative w-full sm:w-[70%] flex-shrink-0">
                        {story.media.type === "video" ? (
                          <div className="relative h-24 sm:h-full">
                            <video
                              src={story.media.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-6 h-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={story.media.url}
                            alt="Story media"
                            className="w-full h-24 sm:h-full object-cover"
                          />
                        )}

                        {/* Media badges */}
                        <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0">
                          {story.media.type}
                        </Badge>
                      </div>

                      {/* Content Section - Right side on desktop, bottom on mobile */}
                      <div className="w-full sm:w-[30%] flex-shrink-0 p-3 flex flex-col justify-between bg-gray-50">
                        {/* Top Section - Created Date Badge */}
                        <div className="mb-4">
                          <div className="flex items-center justify-center">
                            <Badge
                              variant="outline"
                              className="text-xs px-3 py-2 bg-gray-50 text-gray-600 border-gray-200 font-medium text-center leading-tight"
                            >
                              <div className="flex flex-col items-center">
                                <span>Created</span>
                                <span className="font-semibold">
                                  {formatDateDDMMYYYY(story.createdAt)}
                                </span>
                              </div>
                            </Badge>
                          </div>
                        </div>

                        {/* Middle Section - Status and Timing */}
                        <div className="space-y-2 flex-1">
                          {/* Active Status Badge */}
                          <div className="flex items-center justify-center">
                            <Badge
                              variant={
                                isStoryCurrentlyActive(story, currentTime)
                                  ? "default"
                                  : "secondary"
                              }
                              className={`text-xs px-2 py-1 font-medium ${
                                isStoryCurrentlyActive(story, currentTime)
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                            >
                              {isStoryCurrentlyActive(story, currentTime)
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </div>

                          {/* Timing Countdown */}
                          {story.expirationDate &&
                            isStoryCurrentlyActive(story, currentTime) && (
                              <div className="flex items-center justify-center">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200 font-medium"
                                >
                                  {(() => {
                                    const exp = new Date(story.expirationDate);
                                    const diffMs =
                                      exp.getTime() - currentTime.getTime();
                                    const diffHours = Math.floor(
                                      diffMs / (1000 * 60 * 60)
                                    );
                                    const diffMins = Math.floor(
                                      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                                    );

                                    if (diffHours > 0) {
                                      return `${diffHours}h ${diffMins}m left`;
                                    } else {
                                      return `${diffMins}m left`;
                                    }
                                  })()}
                                </Badge>
                              </div>
                            )}

                          {/* Roven Beauty Brand */}
                          <div className="flex items-center justify-center pt-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Roven Beauty
                            </span>
                          </div>
                        </div>

                        {/* Bottom Section - Action Buttons */}
                        <div className="space-y-1.5 mt-4 pt-2 border-t border-gray-200">
                          {/* Views Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewsClick(story)}
                            className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-normal text-gray-700">
                              Views: {story.views}
                            </span>
                          </Button>

                          {/* Clicks Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClicksClick(story)}
                            className="w-full h-8 px-3 text-xs font-normal text-gray-700 hover:bg-green-50 hover:text-green-700 border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                          >
                            <MousePointer className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-normal text-gray-700">
                              Clicks: {story.clicks}
                            </span>
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(story)}
                            className="w-full h-8 px-3 text-xs font-normal text-blue-700 hover:bg-blue-50 border-gray-300 active:bg-blue-100 flex items-center justify-between bg-white"
                            title="Edit story"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-normal text-blue-700">
                              Edit
                            </span>
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(story._id)}
                            className="w-full h-8 px-3 text-xs font-normal text-red-700 hover:bg-red-50 border-gray-300 active:bg-red-100 flex items-center justify-between bg-white"
                            title="Delete story"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            <span className="text-xs font-normal text-red-700">
                              Delete
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 stories-admin-modal">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
            <CardHeader className="modal-header">
              <CardTitle>
                {editingStory ? "Edit Story" : "Add New Story"}
              </CardTitle>
            </CardHeader>
            <CardContent className="modal-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="media">
                    Story Media (Image/Video) {!editingStory && "*"}
                  </Label>
                  <Input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    required={!editingStory}
                  />
                  {mediaPreview && (
                    <div className="mt-2">
                      {mediaType === "video" ? (
                        <video
                          src={mediaPreview}
                          className="w-32 h-32 object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="expirationHours">
                    Expiration (Hours from now)
                  </Label>
                  <Input
                    id="expirationHours"
                    name="expirationHours"
                    type="number"
                    value={formData.expirationHours}
                    onChange={handleInputChange}
                    placeholder="24"
                    min="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty or set to 0 for no expiration
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div>
                  <Label htmlFor="link">Link URL (optional)</Label>
                  <Input
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="linkText">Link Text (optional)</Label>
                  <Input
                    id="linkText"
                    name="linkText"
                    value={formData.linkText}
                    onChange={handleInputChange}
                    placeholder="Learn More"
                  />
                </div>

                <div className="flex gap-4 button-group">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingStory ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>{editingStory ? "Update Story" : "Create Story"}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Story Editor */}
      {showAdvancedEditor && (
        <StoryEditor
          onSave={handleAdvancedEditorSave}
          onClose={() => {
            setShowAdvancedEditor(false);
            setEditingStory(null);
          }}
          initialData={
            editingStory
              ? {
                  id: editingStory._id,
                  title: editingStory.title,
                  mediaUrl: editingStory.media.url,
                  mediaType: editingStory.media.type,
                  order: editingStory.order,
                  isActive: editingStory.isActive,
                  link: editingStory.link || "",
                  linkText: editingStory.linkText || "",
                  expirationHours: editingStory.expirationDate
                    ? Math.ceil(
                        (new Date(editingStory.expirationDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60)
                      )
                    : 24,
                }
              : undefined
          }
        />
      )}

      {/* Views Modal */}
      {selectedStory && (
        <ViewsModal
          isOpen={showViewsModal}
          onClose={handleViewsModalClose}
          storyTitle={selectedStory.title}
          totalViews={viewsData.totalViews}
          views={viewsData.views}
          isLoading={loadingViews}
        />
      )}

      {/* Clicks Modal */}
      {selectedStory && (
        <ClicksModal
          isOpen={showClicksModal}
          onClose={handleClicksModalClose}
          storyTitle={selectedStory.title}
          totalClicks={clicksData.totalClicks}
          clicks={clicksData.clicks}
          isLoading={loadingClicks}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StoriesAdmin;
