import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Upload,
  Smartphone,
  Monitor,
  Image as ImageIcon,
} from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface HeroImage {
  _id: string;
  url: string;
  mobileUrl: string;
  desktopUrl: string;
  public_id: string;
  alt: string;
  createdAt: string;
}

const AdminHeroImages: React.FC = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDesktopFile, setSelectedDesktopFile] = useState<File | null>(
    null
  );
  const [selectedMobileFile, setSelectedMobileFile] = useState<File | null>(
    null
  );
  const [altText, setAltText] = useState("");
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await Axios.get(SummaryApi.getHeroImages.url);
      setImages(response.data);
    } catch (error) {
      toast.error("Failed to fetch hero images.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDesktopFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      setSelectedDesktopFile(event.target.files[0]);
    }
  };

  const handleMobileFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      setSelectedMobileFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedDesktopFile && !selectedMobileFile) {
      toast.warning(
        "Please select at least one image file (desktop or mobile)."
      );
      return;
    }

    // Validate file types
    const validateFile = (file: File) => {
      return file.type.startsWith("image/");
    };

    if (selectedDesktopFile && !validateFile(selectedDesktopFile)) {
      toast.error("Desktop file must be a valid image.");
      return;
    }

    if (selectedMobileFile && !validateFile(selectedMobileFile)) {
      toast.error("Mobile file must be a valid image.");
      return;
    }

    const formData = new FormData();

    if (selectedDesktopFile) {
      formData.append("desktopImage", selectedDesktopFile);
    }

    if (selectedMobileFile) {
      formData.append("mobileImage", selectedMobileFile);
    }

    if (altText.trim()) {
      formData.append("alt", altText.trim());
    }

    setUploading(true);
    try {
      const response = await Axios.post(
        SummaryApi.uploadHeroImage.url,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Images uploaded successfully!");
      } else {
        toast.success("Images uploaded successfully!");
      }

      // Reset form
      setSelectedDesktopFile(null);
      setSelectedMobileFile(null);
      setAltText("");
      if (desktopFileInputRef.current) {
        desktopFileInputRef.current.value = "";
      }
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = "";
      }
      fetchImages(); // Refresh the list
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Image upload failed.";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await Axios.delete(`${SummaryApi.deleteHeroImage.url}/${imageId}`);
      toast.success("Image deleted successfully.");
      fetchImages(); // Refresh the list
    } catch (error) {
      toast.error("Failed to delete image.");
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUploadDisabled = () => {
    return uploading || (!selectedDesktopFile && !selectedMobileFile);
  };

  return (
    <div>
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Manage Hero Images
          </h1>
        </div>
        <div className="flex items-center space-x-4"></div>
      </div>

      <Card className="mb-4 rounded-xl border border-admin-border bg-admin-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ImageIcon className="h-5 w-5 text-primary" />
            Upload New Hero Image
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload separate images for desktop and mobile, or just one for both.
            At least one image is required.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="desktop-image-upload-input"
                className="block text-sm font-medium mb-2 text-foreground"
              >
                Select Desktop Image File
              </label>
              <Input
                ref={desktopFileInputRef}
                id="desktop-image-upload-input"
                type="file"
                accept="image/*"
                onChange={handleDesktopFileChange}
                className="cursor-pointer bg-admin-card border-admin-border text-admin-text focus:ring-primary shadow-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: High resolution image 1920x1080 or 16:9 aspect
                ratio, max 2MB.
                <br />
                <span className="text-primary font-medium">💡 Tip:</span> Use
                landscape orientation for better desktop viewing experience.
              </p>
              {selectedDesktopFile && (
                <p className="text-xs text-accent mt-1">
                  ✓ Selected: {selectedDesktopFile.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="mobile-image-upload-input"
                className="block text-sm font-medium mb-2 text-foreground"
              >
                Select Mobile Image File
              </label>
              <Input
                ref={mobileFileInputRef}
                id="mobile-image-upload-input"
                type="file"
                accept="image/*"
                onChange={handleMobileFileChange}
                className="cursor-pointer bg-admin-card border-admin-border text-admin-text focus:ring-primary shadow-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Mobile-optimized image 768×400px, 4:3 aspect ratio,
                max 200Kb.
                <br />
                <span className="text-primary font-medium">💡 Tip:</span> Use
                portrait orientation for better mobile viewing experience.
              </p>
              {selectedMobileFile && (
                <p className="text-xs text-accent mt-1">
                  ✓ Selected: {selectedMobileFile.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="alt-text"
                className="block text-sm font-medium mb-2 text-foreground"
              >
                Alt Text (Optional)
              </label>
              <Input
                id="alt-text"
                placeholder="Enter descriptive text for accessibility"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="bg-admin-card border-admin-border text-admin-text placeholder:text-admin-muted focus:ring-primary shadow-sm"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploadDisabled()}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden rounded-xl border border-admin-border bg-admin-card shadow-sm"
            >
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : images.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hero images yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload your first hero image to get started.
            </p>
          </div>
        ) : (
          images.map((image) => (
            <Card
              key={image._id}
              className="overflow-hidden group rounded-xl border border-admin-border bg-admin-card shadow-sm"
            >
              <div className="relative">
                {/* Desktop Preview */}
                <div className="hidden md:block">
                  <img
                    src={image.desktopUrl || image.url}
                    alt={`${image.alt} - Desktop`}
                    className="w-full h-48 object-cover"
                  />
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    <Monitor className="h-3 w-3 mr-1" />
                    Desktop
                  </Badge>
                </div>

                {/* Mobile Preview */}
                <div className="md:hidden">
                  <img
                    src={image.mobileUrl || image.url}
                    alt={`${image.alt} - Mobile`}
                    className="w-full h-48 object-cover"
                  />
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile
                  </Badge>
                </div>

                {/* Delete Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image._id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate text-foreground">
                      {image.alt || "Hero Image"}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-foreground"
                    >
                      {formatDate(image.createdAt)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3" />
                      <span>
                        Desktop:{" "}
                        {image.desktopUrl ? "✓ Available" : "→ Not Set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3 w-3" />
                      <span>
                        Mobile: {image.mobileUrl ? "✓ Available" : "→ Not Set"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminHeroImages;
