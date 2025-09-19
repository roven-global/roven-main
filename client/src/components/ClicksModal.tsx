import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MousePointer, User, Clock, Globe } from "lucide-react";

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

interface ClicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  totalClicks: number;
  clicks: ClickDetail[];
  isLoading?: boolean;
}

const ClicksModal: React.FC<ClicksModalProps> = ({
  isOpen,
  onClose,
  storyTitle,
  totalClicks,
  clicks,
  isLoading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return "Unknown Browser";

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";

    return "Other Browser";
  };

  const getDeviceInfo = (userAgent: string) => {
    if (!userAgent) return "Unknown Device";

    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("Android")) return "Android";

    return "Desktop";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-green-600" />
            Story Clicks - {storyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-green-600" />
              <span className="font-medium">Total Clicks:</span>
              <Badge variant="secondary" className="text-sm">
                {totalClicks}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {clicks.length} unique users
            </div>
          </div>

          {/* Clicks List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading clicks...</span>
              </div>
            ) : clicks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MousePointer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No clicks recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clicks.map((click, index) => (
                  <div
                    key={click._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {click.isAnonymous ? "Unknown" : click.userName}
                          </span>
                          {click.isAnonymous ? (
                            <Badge variant="outline" className="text-xs">
                              Anonymous
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              Registered
                            </Badge>
                          )}
                        </div>
                        {!click.isAnonymous && click.userEmail && (
                          <p className="text-sm text-gray-600">
                            {click.userEmail}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Last: {formatDate(click.lastClickAt)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Globe className="w-3 h-3" />
                            {getBrowserInfo(click.userAgent)} •{" "}
                            {getDeviceInfo(click.userAgent)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className="text-sm font-semibold bg-green-100 text-green-800"
                        >
                          {click.clickCount}{" "}
                          {click.clickCount === 1 ? "click" : "clicks"}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClicksModal;
