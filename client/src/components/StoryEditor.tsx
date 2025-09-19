import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Crop,
  Palette,
  Type,
  Sticker,
  Save,
  X,
  Trash2,
  Eye,
  Loader2,
  Bold,
  Italic,
  Link,
  Heart,
  Star,
  Sparkles,
  Zap,
  Camera,
  Video,
  Music,
  MapPin,
  Clock,
  Smile,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface OverlayElement {
  id: string;
  type: "text" | "sticker" | "link";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  textAlign?: "left" | "center" | "right";
  zIndex: number;
}

interface StoryDraft {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  overlays: OverlayElement[];
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number;
  createdAt: string;
}

// Constants
const STORY_CANVAS_WIDTH = 300;
const STORY_CANVAS_HEIGHT = 533;

const STICKERS = [
  { id: "heart", icon: Heart, name: "Heart" },
  { id: "star", icon: Star, name: "Star" },
  { id: "sparkles", icon: Sparkles, name: "Sparkles" },
  { id: "zap", icon: Zap, name: "Lightning" },
  { id: "camera", icon: Camera, name: "Camera" },
  { id: "video", icon: Video, name: "Video" },
  { id: "music", icon: Music, name: "Music" },
  { id: "map", icon: MapPin, name: "Location" },
  { id: "clock", icon: Clock, name: "Time" },
  { id: "smile", icon: Smile, name: "Smile" },
];

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Comic Sans MS",
];

interface StoryEditorProps {
  onClose: () => void;
  onSave: (storyData: any) => void;
  initialData?: {
    id?: string;
    title?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    overlays?: OverlayElement[];
    filters?: {
      brightness: number;
      contrast: number;
      saturation: number;
      blur: number;
      sepia: number;
    };
    crop?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    rotation?: number;
    order?: number;
    isActive?: boolean;
    link?: string;
    linkText?: string;
    expirationHours?: number;
  };
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  onClose,
  onSave,
  initialData,
}) => {
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  // Editor state
  const [activeTab, setActiveTab] = useState<
    "text" | "stickers" | "filters" | "crop" | "link"
  >("text");
  const [overlays, setOverlays] = useState<OverlayElement[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);

  // Filters and effects
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
  });

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const [rotation, setRotation] = useState(0);

  // Drafts
  const [drafts, setDrafts] = useState<StoryDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load drafts from localStorage
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem("storyDrafts");
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
    } catch (error) {
      console.error("Error loading drafts:", error);
    }
  }, []);

  // Initialize form with initial data when editing
  useEffect(() => {
    if (initialData) {
      if (initialData.mediaUrl) {
        setMediaPreview(initialData.mediaUrl);
        setMediaType(initialData.mediaType || "image");
      }
      if (initialData.overlays) {
        setOverlays(initialData.overlays);
      }
      if (initialData.filters) {
        setFilters(initialData.filters);
      }
      if (initialData.crop) {
        setCrop(initialData.crop);
      }
      if (initialData.rotation !== undefined) {
        setRotation(initialData.rotation);
      }
    }
  }, [initialData]);

  // Save drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("storyDrafts", JSON.stringify(drafts));
    } catch (error) {
      console.error("Error saving drafts:", error);
    }
  }, [drafts]);

  // Handle media upload
  const handleMediaUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          return;
        }

        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "video/mp4",
          "video/webm",
        ];

        if (!allowedTypes.includes(file.type)) {
          toast.error("Only JPG, PNG, MP4, and WebM files are allowed");
          return;
        }

        setMediaFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.onerror = () => {
          toast.error("Error reading file");
        };
        reader.readAsDataURL(file);

        if (file.type.startsWith("video/")) {
          setMediaType("video");
        } else {
          setMediaType("image");
        }
      } catch (error) {
        console.error("Error handling media upload:", error);
        toast.error("Error uploading file");
      }
    },
    []
  );

  // Add text overlay
  const addTextOverlay = useCallback(() => {
    const newOverlay: OverlayElement = {
      id: `text_${Date.now()}`,
      type: "text",
      content: "Tap to edit",
      x: 50,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: "normal",
      color: "#ffffff",
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      textAlign: "center",
      zIndex: overlays.length + 1,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlay(newOverlay.id);
  }, [overlays.length]);

  // Add sticker overlay
  const addStickerOverlay = useCallback(
    (stickerId: string) => {
      const sticker = STICKERS.find((s) => s.id === stickerId);
      if (!sticker) return;

      const newOverlay: OverlayElement = {
        id: `sticker_${Date.now()}`,
        type: "sticker",
        content: stickerId,
        x: 100,
        y: 150,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: overlays.length + 1,
      };
      setOverlays((prev) => [...prev, newOverlay]);
      setSelectedOverlay(newOverlay.id);
    },
    [overlays.length]
  );

  // Add link overlay
  const addLinkOverlay = useCallback(() => {
    const newOverlay: OverlayElement = {
      id: `link_${Date.now()}`,
      type: "link",
      content: "https://example.com",
      x: 50,
      y: 200,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "normal",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "#ffffff",
      textAlign: "center",
      zIndex: overlays.length + 1,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlay(newOverlay.id);
  }, [overlays.length]);

  // Update overlay
  const updateOverlay = useCallback(
    (id: string, updates: Partial<OverlayElement>) => {
      setOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === id ? { ...overlay, ...updates } : overlay
        )
      );
    },
    []
  );

  // Delete overlay
  const deleteOverlay = useCallback(
    (id: string) => {
      setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
      if (selectedOverlay === id) {
        setSelectedOverlay(null);
      }
    },
    [selectedOverlay]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, overlayId: string) => {
      e.preventDefault();
      setIsDragging(true);
      setSelectedOverlay(overlayId);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const overlay = overlays.find((o) => o.id === overlayId);
      if (overlay) {
        setDragStart({ x: clientX, y: clientY });
        setDragOffset({
          x: clientX - overlay.x,
          y: clientY - overlay.y,
        });
      }
    },
    [overlays]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !selectedOverlay) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const newX = Math.max(
        0,
        Math.min(STORY_CANVAS_WIDTH - 50, clientX - dragOffset.x)
      );
      const newY = Math.max(
        0,
        Math.min(STORY_CANVAS_HEIGHT - 50, clientY - dragOffset.y)
      );

      updateOverlay(selectedOverlay, { x: newX, y: newY });
    },
    [isDragging, selectedOverlay, dragOffset, updateOverlay]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Save draft
  const saveDraft = useCallback(() => {
    if (!mediaPreview) {
      toast.error("Please upload media first");
      return;
    }

    const newDraft: StoryDraft = {
      id: `draft_${Date.now()}`,
      title: `Draft ${drafts.length + 1}`,
      mediaUrl: mediaPreview,
      mediaType,
      overlays,
      filters,
      crop,
      rotation,
      createdAt: new Date().toISOString(),
    };

    setDrafts((prev) => [...prev, newDraft]);
    toast.success("Draft saved successfully");
  }, [
    mediaPreview,
    mediaType,
    overlays,
    filters,
    crop,
    rotation,
    drafts.length,
  ]);

  // Load draft
  const loadDraft = useCallback((draft: StoryDraft) => {
    setMediaPreview(draft.mediaUrl);
    setMediaType(draft.mediaType);
    setOverlays(draft.overlays);
    setFilters(draft.filters);
    setCrop(draft.crop);
    setRotation(draft.rotation);
    setShowDrafts(false);
    toast.success("Draft loaded successfully");
  }, []);

  // Delete draft
  const deleteDraft = useCallback((draftId: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    toast.success("Draft deleted successfully");
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!mediaFile && !initialData?.mediaUrl) {
      toast.error("Please upload media first");
      return;
    }

    setIsLoading(true);
    try {
      const storyData = {
        id: initialData?.id,
        title: initialData?.title || `Story ${new Date().toLocaleString()}`,
        mediaFile,
        mediaType,
        overlays,
        filters,
        crop,
        rotation,
        order: initialData?.order || 0,
        isActive:
          initialData?.isActive !== undefined ? initialData.isActive : true,
        link: initialData?.link || "",
        linkText: initialData?.linkText || "",
        expirationHours: initialData?.expirationHours || 24,
      };

      await onSave(storyData);
      toast.success(
        initialData ? "Story updated successfully" : "Story saved successfully"
      );
      onClose();
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error("Error saving story");
    } finally {
      setIsLoading(false);
    }
  }, [
    mediaFile,
    mediaType,
    overlays,
    filters,
    crop,
    rotation,
    initialData,
    onSave,
    onClose,
  ]);

  // Get selected overlay data
  const selectedOverlayData = overlays.find((o) => o.id === selectedOverlay);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-2xl font-bold">
              {initialData ? "Edit Story" : "Create New Story"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col">
            <div className="flex flex-1 min-h-0">
              {/* Left Side - Media Upload */}
              <div className="w-1/2 p-4 border-r bg-gray-50">
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    {/* Hidden file input */}
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Story Preview */}
                  <div className="flex-1 flex items-center justify-center mb-4">
                    <div
                      ref={canvasRef}
                      className={`relative bg-white shadow-lg overflow-hidden border-2 ${
                        !mediaPreview
                          ? "border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
                          : "border-gray-200"
                      }`}
                      style={{
                        width: STORY_CANVAS_WIDTH,
                        height: STORY_CANVAS_HEIGHT,
                        borderRadius: "20px",
                      }}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                      onClick={
                        !mediaPreview
                          ? () => fileInputRef.current?.click()
                          : undefined
                      }
                    >
                      {/* Background Media */}
                      {mediaPreview && (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${mediaPreview})`,
                            filter: `
                        brightness(${filters.brightness}%)
                        contrast(${filters.contrast}%)
                        saturate(${filters.saturation}%)
                        blur(${filters.blur}px)
                        sepia(${filters.sepia}%)
                      `,
                            transform: `rotate(${rotation}deg)`,
                          }}
                        />
                      )}

                      {/* Overlays */}
                      {overlays.map((overlay) => (
                        <div
                          key={overlay.id}
                          className={`absolute cursor-move select-none ${
                            selectedOverlay === overlay.id
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                          style={{
                            left: overlay.x,
                            top: overlay.y,
                            width: overlay.width,
                            height: overlay.height,
                            transform: `rotate(${overlay.rotation}deg)`,
                            opacity: overlay.opacity,
                            zIndex: overlay.zIndex,
                          }}
                          onMouseDown={(e) => handleDragStart(e, overlay.id)}
                          onTouchStart={(e) => handleDragStart(e, overlay.id)}
                          onClick={() => setSelectedOverlay(overlay.id)}
                        >
                          {overlay.type === "text" && (
                            <div
                              className="w-full h-full flex items-center justify-center p-2"
                              style={{
                                fontSize: overlay.fontSize,
                                fontFamily: overlay.fontFamily,
                                fontWeight: overlay.fontWeight,
                                color: overlay.color,
                                backgroundColor: overlay.backgroundColor,
                                borderRadius: overlay.borderRadius,
                                border: `${overlay.borderWidth}px solid ${overlay.borderColor}`,
                                textAlign: overlay.textAlign,
                              }}
                            >
                              {overlay.content}
                            </div>
                          )}
                          {overlay.type === "sticker" && (
                            <div className="w-full h-full flex items-center justify-center">
                              {(() => {
                                const sticker = STICKERS.find(
                                  (s) => s.id === overlay.content
                                );
                                return sticker ? (
                                  <sticker.icon className="w-full h-full" />
                                ) : null;
                              })()}
                            </div>
                          )}
                          {overlay.type === "link" && (
                            <div
                              className="w-full h-full flex items-center justify-center p-2 cursor-pointer"
                              style={{
                                fontSize: overlay.fontSize,
                                fontFamily: overlay.fontFamily,
                                fontWeight: overlay.fontWeight,
                                color: overlay.color,
                                backgroundColor: overlay.backgroundColor,
                                borderRadius: overlay.borderRadius,
                                border: `${overlay.borderWidth}px solid ${overlay.borderColor}`,
                                textAlign: overlay.textAlign,
                              }}
                            >
                              {overlay.content}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Upload Prompt */}
                      {!mediaPreview && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          <div className="text-center p-6">
                            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                              <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="text-base font-semibold text-gray-700 mb-2">
                              Upload Your Story
                            </h4>
                            <p className="text-xs text-gray-500 mb-2">
                              Click anywhere to choose an image or video
                            </p>
                            <p className="text-xs text-gray-400">
                              JPG, PNG, MP4, WebM • Max 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at Bottom */}
                  <div className="border-t pt-2 flex-shrink-0">
                    <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDrafts(true)}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 shadow-sm"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="hidden sm:inline">Draft</span>
                        <Badge
                          variant="secondary"
                          className="ml-1 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200"
                        >
                          {drafts.length}
                        </Badge>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveDraft}
                        disabled={!mediaPreview}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                      >
                        <Save className="w-3 h-3" />
                        <span className="hidden sm:inline">Save Draft</span>
                        <span className="sm:hidden">Save</span>
                      </Button>

                      <Button
                        onClick={handleSave}
                        disabled={!mediaFile || isLoading}
                        size="sm"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="hidden sm:inline">
                              Uploading...
                            </span>
                            <span className="sm:hidden">Uploading</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              Upload Story
                            </span>
                            <span className="sm:hidden">Upload</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Interactive Tabs */}
              <div className="w-1/2 p-4">
                <div className="h-full flex flex-col">
                  {/* Tab Navigation */}
                  <div className="flex border-b mb-4">
                    {[
                      { id: "text", label: "Text", icon: Type },
                      { id: "stickers", label: "Stickers", icon: Sticker },
                      { id: "filters", label: "Filters", icon: Palette },
                      { id: "crop", label: "Crop", icon: Crop },
                      { id: "link", label: "Link", icon: Link },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className={`flex-1 p-2 flex items-center justify-center gap-2 text-sm transition-colors ${
                          activeTab === tab.id
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => setActiveTab(tab.id as any)}
                      >
                        <tab.icon className="w-3 h-3" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "text" && (
                      <div className="space-y-4">
                        <div>
                          <Button
                            onClick={addTextOverlay}
                            className="w-full"
                            size="sm"
                          >
                            <Type className="w-3 h-3 mr-2" />
                            Add Text
                          </Button>
                        </div>

                        {selectedOverlayData?.type === "text" && (
                          <div className="space-y-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Text Settings</h4>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  deleteOverlay(selectedOverlayData.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div>
                              <Label>Text Content</Label>
                              <Textarea
                                value={selectedOverlayData.content}
                                onChange={(e) =>
                                  updateOverlay(selectedOverlayData.id, {
                                    content: e.target.value,
                                  })
                                }
                                className="mt-1"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Font Size</Label>
                                <Slider
                                  value={[selectedOverlayData.fontSize || 24]}
                                  onValueChange={([value]) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      fontSize: value,
                                    })
                                  }
                                  min={12}
                                  max={72}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>

                              <div>
                                <Label>Text Color</Label>
                                <Input
                                  type="color"
                                  value={selectedOverlayData.color || "#ffffff"}
                                  onChange={(e) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      color: e.target.value,
                                    })
                                  }
                                  className="mt-1 h-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Font Family</Label>
                              <select
                                value={
                                  selectedOverlayData.fontFamily || "Arial"
                                }
                                onChange={(e) =>
                                  updateOverlay(selectedOverlayData.id, {
                                    fontFamily: e.target.value,
                                  })
                                }
                                className="w-full p-2 border rounded mt-1"
                              >
                                {FONT_FAMILIES.map((font) => (
                                  <option key={font} value={font}>
                                    {font}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label>Style</Label>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant={
                                    selectedOverlayData.fontWeight === "bold"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    updateOverlay(selectedOverlayData.id, {
                                      fontWeight:
                                        selectedOverlayData.fontWeight ===
                                        "bold"
                                          ? "normal"
                                          : "bold",
                                    })
                                  }
                                >
                                  <Bold className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={
                                    selectedOverlayData.fontWeight === "italic"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    updateOverlay(selectedOverlayData.id, {
                                      fontWeight:
                                        selectedOverlayData.fontWeight ===
                                        "italic"
                                          ? "normal"
                                          : "italic",
                                    })
                                  }
                                >
                                  <Italic className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "stickers" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-4">Choose Sticker</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {STICKERS.map((sticker) => (
                              <Button
                                key={sticker.id}
                                variant="outline"
                                size="sm"
                                onClick={() => addStickerOverlay(sticker.id)}
                                className="flex flex-col items-center gap-2 h-20"
                              >
                                <sticker.icon className="w-6 h-6" />
                                <span className="text-xs">{sticker.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {selectedOverlayData?.type === "sticker" && (
                          <div className="space-y-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                Sticker Settings
                              </h4>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  deleteOverlay(selectedOverlayData.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Size</Label>
                                <Slider
                                  value={[selectedOverlayData.width]}
                                  onValueChange={([value]) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      width: value,
                                      height: value,
                                    })
                                  }
                                  min={20}
                                  max={100}
                                  step={5}
                                  className="mt-2"
                                />
                              </div>

                              <div>
                                <Label>Rotation</Label>
                                <Slider
                                  value={[selectedOverlayData.rotation]}
                                  onValueChange={([value]) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      rotation: value,
                                    })
                                  }
                                  min={-180}
                                  max={180}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "filters" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-4">Image Filters</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Brightness</Label>
                                <span className="text-sm text-gray-500">
                                  {filters.brightness}%
                                </span>
                              </div>
                              <Slider
                                value={[filters.brightness]}
                                onValueChange={([value]) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    brightness: value,
                                  }))
                                }
                                min={0}
                                max={200}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Contrast</Label>
                                <span className="text-sm text-gray-500">
                                  {filters.contrast}%
                                </span>
                              </div>
                              <Slider
                                value={[filters.contrast]}
                                onValueChange={([value]) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    contrast: value,
                                  }))
                                }
                                min={0}
                                max={200}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Saturation</Label>
                                <span className="text-sm text-gray-500">
                                  {filters.saturation}%
                                </span>
                              </div>
                              <Slider
                                value={[filters.saturation]}
                                onValueChange={([value]) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    saturation: value,
                                  }))
                                }
                                min={0}
                                max={200}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Blur</Label>
                                <span className="text-sm text-gray-500">
                                  {filters.blur}px
                                </span>
                              </div>
                              <Slider
                                value={[filters.blur]}
                                onValueChange={([value]) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    blur: value,
                                  }))
                                }
                                min={0}
                                max={10}
                                step={0.1}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Sepia</Label>
                                <span className="text-sm text-gray-500">
                                  {filters.sepia}%
                                </span>
                              </div>
                              <Slider
                                value={[filters.sepia]}
                                onValueChange={([value]) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    sepia: value,
                                  }))
                                }
                                min={0}
                                max={100}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "crop" && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-4">
                            Crop & Transform
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Rotation</Label>
                                <span className="text-sm text-gray-500">
                                  {rotation}°
                                </span>
                              </div>
                              <Slider
                                value={[rotation]}
                                onValueChange={([value]) => setRotation(value)}
                                min={-180}
                                max={180}
                                step={1}
                                className="mt-2"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Crop X</Label>
                                  <span className="text-sm text-gray-500">
                                    {crop.x}%
                                  </span>
                                </div>
                                <Slider
                                  value={[crop.x]}
                                  onValueChange={([value]) =>
                                    setCrop((prev) => ({ ...prev, x: value }))
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Crop Y</Label>
                                  <span className="text-sm text-gray-500">
                                    {crop.y}%
                                  </span>
                                </div>
                                <Slider
                                  value={[crop.y]}
                                  onValueChange={([value]) =>
                                    setCrop((prev) => ({ ...prev, y: value }))
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Width</Label>
                                  <span className="text-sm text-gray-500">
                                    {crop.width}%
                                  </span>
                                </div>
                                <Slider
                                  value={[crop.width]}
                                  onValueChange={([value]) =>
                                    setCrop((prev) => ({
                                      ...prev,
                                      width: value,
                                    }))
                                  }
                                  min={10}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Height</Label>
                                  <span className="text-sm text-gray-500">
                                    {crop.height}%
                                  </span>
                                </div>
                                <Slider
                                  value={[crop.height]}
                                  onValueChange={([value]) =>
                                    setCrop((prev) => ({
                                      ...prev,
                                      height: value,
                                    }))
                                  }
                                  min={10}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "link" && (
                      <div className="space-y-4">
                        <div>
                          <Button onClick={addLinkOverlay} className="w-full">
                            <Link className="w-4 h-4 mr-2" />
                            Add Link
                          </Button>
                        </div>

                        {selectedOverlayData?.type === "link" && (
                          <div className="space-y-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Link Settings</h4>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  deleteOverlay(selectedOverlayData.id)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div>
                              <Label>URL</Label>
                              <Input
                                value={selectedOverlayData.content}
                                onChange={(e) =>
                                  updateOverlay(selectedOverlayData.id, {
                                    content: e.target.value,
                                  })
                                }
                                className="mt-1"
                                placeholder="https://example.com"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Background Color</Label>
                                <Input
                                  type="color"
                                  value={
                                    selectedOverlayData.backgroundColor ||
                                    "#000000"
                                  }
                                  onChange={(e) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      backgroundColor: e.target.value,
                                    })
                                  }
                                  className="mt-1 h-10"
                                />
                              </div>

                              <div>
                                <Label>Text Color</Label>
                                <Input
                                  type="color"
                                  value={selectedOverlayData.color || "#ffffff"}
                                  onChange={(e) =>
                                    updateOverlay(selectedOverlayData.id, {
                                      color: e.target.value,
                                    })
                                  }
                                  className="mt-1 h-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Border Radius</Label>
                              <Slider
                                value={[selectedOverlayData.borderRadius || 20]}
                                onValueChange={([value]) =>
                                  updateOverlay(selectedOverlayData.id, {
                                    borderRadius: value,
                                  })
                                }
                                min={0}
                                max={50}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drafts Modal */}
      {showDrafts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Saved Drafts</CardTitle>
              <Button variant="outline" onClick={() => setShowDrafts(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {drafts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No drafts saved yet
                </div>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{draft.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => loadDraft(draft)}>
                          Load
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDraft(draft.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default StoryEditor;
