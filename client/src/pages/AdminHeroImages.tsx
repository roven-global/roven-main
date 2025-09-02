import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Upload } from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroImage {
  _id: string;
  url: string;
  public_id: string;
}

const AdminHeroImages: React.FC = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning("Please select an image file first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setUploading(true);
    try {
      await Axios.post(SummaryApi.uploadHeroImage.url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Image uploaded successfully!");
      setSelectedFile(null); // Reset file input
      document.getElementById('image-upload-input')?.setAttribute('value', ''); // a bit hacky way to clear file input
      fetchImages(); // Refresh the list
    } catch (error) {
      toast.error("Image upload failed.");
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

  return (
    <div>
      <PageHeader title="Manage Hero Images" />

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <Input id="image-upload-input" type="file" accept="image/*" onChange={handleFileChange} />
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload Image</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-full h-40 rounded-lg" />)
        ) : (
          images.map((image) => (
            <Card key={image._id} className="relative group">
              <img src={image.url} alt="Hero" className="rounded-t-lg object-cover w-full h-40" />
              <CardFooter className="p-2 absolute bottom-0 left-0 right-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(image._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminHeroImages;
