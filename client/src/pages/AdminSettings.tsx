import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, Eye, EyeOff } from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";

interface AdminSettings {
  is_featured_enabled: boolean;
  is_category_enabled: boolean;
  is_brand_category_enabled: boolean;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    is_featured_enabled: true,
    is_category_enabled: true,
    is_brand_category_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Fetch featured products setting
      const featuredResponse = await Axios.get(
        SummaryApi.getAdminSetting.url.replace(":key", "is_featured_enabled")
      );

      if (featuredResponse.data.success) {
        setSettings((prev) => ({
          ...prev,
          is_featured_enabled: featuredResponse.data.data.value,
        }));
      }

      // Fetch category section setting
      const categoryResponse = await Axios.get(
        SummaryApi.getAdminSetting.url.replace(":key", "is_category_enabled")
      );

      if (categoryResponse.data.success) {
        setSettings((prev) => ({
          ...prev,
          is_category_enabled: categoryResponse.data.data.value,
        }));
      }

      // Fetch brand category section setting
      const brandCategoryResponse = await Axios.get(
        SummaryApi.getAdminSetting.url.replace(
          ":key",
          "is_brand_category_enabled"
        )
      );

      if (brandCategoryResponse.data.success) {
        setSettings((prev) => ({
          ...prev,
          is_brand_category_enabled: brandCategoryResponse.data.data.value,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      // If setting doesn't exist, use default value (true)
      setSettings((prev) => ({
        ...prev,
        is_featured_enabled: true,
        is_category_enabled: true,
        is_brand_category_enabled: true,
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AdminSettings, value: boolean) => {
    try {
      setSaving(true);

      const response = await Axios.put(
        SummaryApi.updateAdminSetting.url.replace(":key", key),
        {
          value,
          description:
            key === "is_featured_enabled"
              ? "Controls whether the Featured Products section is displayed on the homepage"
              : key === "is_category_enabled"
              ? "Controls whether the Category Section is displayed on the homepage"
              : key === "is_brand_category_enabled"
              ? "Controls whether the Brand Category section is displayed on the homepage"
              : "",
        }
      );

      if (response.data.success) {
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));

        toast({
          title: "Setting Updated",
          description: `${
            key === "is_featured_enabled"
              ? "Featured Products"
              : key === "is_category_enabled"
              ? "Category"
              : "Brand Category"
          } section has been ${value ? "enabled" : "disabled"}.`,
        });
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFeaturedToggle = (checked: boolean) => {
    updateSetting("is_featured_enabled", checked);
  };

  const handleCategoryToggle = (checked: boolean) => {
    updateSetting("is_category_enabled", checked);
  };

  const handleBrandCategoryToggle = (checked: boolean) => {
    updateSetting("is_brand_category_enabled", checked);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-admin-bg">
        <div className="max-w-4xl mx-auto">
          {/* Admin Panel Header */}
          <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
            <div>
              <h1 className="font-sans text-2xl font-bold text-gray-900">
                Admin Settings
              </h1>
            </div>
            <div className="flex items-center space-x-4"></div>
          </div>
          <div className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-text">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-4 bg-admin-accent/50 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-admin-accent/50 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-admin-bg admin-panel-container">
      <div className="max-w-4xl mx-auto">
        {/* Admin Panel Header */}
        <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
          <div>
            <h1 className="font-sans text-2xl font-bold text-gray-900">
              Admin Settings
            </h1>
          </div>
          <div className="flex items-center space-x-4"></div>
        </div>

        <div className="space-y-6">
          {/* Featured Products Section */}
          <Card className="bg-admin-card border-admin-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                {settings.is_featured_enabled ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                )}
                Featured Products Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="featured-toggle"
                    className="text-admin-text font-medium"
                  >
                    Display Featured Products on Homepage
                  </Label>
                  <p className="text-sm text-admin-muted">
                    When enabled, the Featured Products section will be
                    displayed on the homepage. When disabled, the section will
                    be hidden from visitors.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured-toggle"
                    checked={settings.is_featured_enabled}
                    onCheckedChange={handleFeaturedToggle}
                    disabled={saving}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor="featured-toggle"
                    className="text-sm text-admin-muted"
                  >
                    {settings.is_featured_enabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-admin-accent/10 rounded-lg border border-admin-border/50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {settings.is_featured_enabled ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-admin-text">
                      Current Status:{" "}
                      {settings.is_featured_enabled ? "Visible" : "Hidden"}
                    </p>
                    <p className="text-xs text-admin-muted mt-1">
                      {settings.is_featured_enabled
                        ? "Featured products are currently being displayed on the homepage."
                        : "Featured products section is hidden from the homepage."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Section */}
          <Card className="bg-admin-card border-admin-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                {settings.is_category_enabled ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                )}
                Category Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="category-toggle"
                    className="text-admin-text font-medium"
                  >
                    Display Category Section on Homepage
                  </Label>
                  <p className="text-sm text-admin-muted">
                    When enabled, the Category Section will be displayed on the
                    homepage. When disabled, the section will be hidden from
                    visitors.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="category-toggle"
                    checked={settings.is_category_enabled}
                    onCheckedChange={handleCategoryToggle}
                    disabled={saving}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor="category-toggle"
                    className="text-sm text-admin-muted"
                  >
                    {settings.is_category_enabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-admin-accent/10 rounded-lg border border-admin-border/50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {settings.is_category_enabled ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-admin-text">
                      Current Status:{" "}
                      {settings.is_category_enabled ? "Visible" : "Hidden"}
                    </p>
                    <p className="text-xs text-admin-muted mt-1">
                      {settings.is_category_enabled
                        ? "Category section is currently being displayed on the homepage."
                        : "Category section is hidden from the homepage."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Category Section */}
          <Card className="bg-admin-card border-admin-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                {settings.is_brand_category_enabled ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                )}
                Brand Category Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="brand-category-toggle"
                    className="text-admin-text font-medium"
                  >
                    Display Brand Category Section on Homepage
                  </Label>
                  <p className="text-sm text-admin-muted">
                    When enabled, the Brand Category section will be displayed
                    on the homepage with categories sorted by brand ranking.
                    When disabled, the section will be hidden from visitors.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="brand-category-toggle"
                    checked={settings.is_brand_category_enabled}
                    onCheckedChange={handleBrandCategoryToggle}
                    disabled={saving}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor="brand-category-toggle"
                    className="text-sm text-admin-muted"
                  >
                    {settings.is_brand_category_enabled
                      ? "Enabled"
                      : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-admin-accent/10 rounded-lg border border-admin-border/50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {settings.is_brand_category_enabled ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-admin-text">
                      Current Status:{" "}
                      {settings.is_brand_category_enabled
                        ? "Visible"
                        : "Hidden"}
                    </p>
                    <p className="text-xs text-admin-muted mt-1">
                      {settings.is_brand_category_enabled
                        ? "Brand category section is currently being displayed on the homepage with ranking-based sorting."
                        : "Brand category section is hidden from the homepage."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Future Settings Placeholder */}
          <Card className="bg-admin-card border-admin-border shadow-sm opacity-60">
            <CardHeader>
              <CardTitle className="text-admin-text">
                More Settings Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-admin-muted">
                Additional website settings and configurations will be available
                here in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
