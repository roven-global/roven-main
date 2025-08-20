import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Edit, Save, X, LogOut, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ClaimedRewardDisplay from "@/components/ClaimedRewardDisplay";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setFormData({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      phone: user.phone || "",
    });
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("avatar", avatarFile);
      const response = await Axios.post(
        SummaryApi.profileAvatar.url,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.success && user) {
        updateUser({ ...user, avatar: response.data.data.avatar });
        toast({ title: "Avatar updated successfully!" });
        setAvatarFile(null);
        setAvatarPreview("");
      }
    } catch (error: any) {
      toast({
        title: "Failed to upload avatar",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await Axios.put(SummaryApi.profileUpdate.url, formData);
      if (response.data.success && user) {
        updateUser({ ...user, ...formData });
        toast({ title: "Profile updated successfully!" });
        setEditMode(false);
      }
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-deep-forest">
              My Profile
            </h1>
            <p className="text-forest mt-2 text-sm sm:text-base">
              Manage your account and personal information.
            </p>
          </div>

          <Card className="bg-white rounded-lg shadow-md border border-warm-taupe/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-forest">
                <User /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarPreview || user.avatar} />
                    <AvatarFallback className="text-3xl bg-soft-beige text-deep-forest">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-1 right-1 bg-sage text-white p-2 rounded-full cursor-pointer hover:bg-forest transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {avatarFile && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAvatarUpload}
                      disabled={loading}
                      className="bg-sage hover:bg-forest text-white"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Upload"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview("");
                      }}
                      className="border-warm-taupe text-forest hover:bg-sage/20"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-warm-taupe/50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="border-warm-taupe focus:border-sage focus:ring-sage/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="border-warm-taupe focus:border-sage focus:ring-sage/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled
                    className="border-warm-taupe focus:border-sage focus:ring-sage/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="border-warm-taupe focus:border-sage focus:ring-sage/20 h-11"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {!editMode ? (
                  <Button
                    onClick={() => setEditMode(true)}
                    className="bg-sage hover:bg-forest text-white"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="bg-sage hover:bg-forest text-white"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}{" "}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="border-warm-taupe text-forest hover:bg-sage/20"
                    >
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claimed Reward Display */}
          <ClaimedRewardDisplay />

          {/* Test Component - Remove in production */}

          <Card className="bg-white rounded-lg shadow-md mt-6 border border-warm-taupe/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-destructive">Logout</h3>
                <p className="text-sm text-forest">
                  Sign out of your Roven account.
                </p>
              </div>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
