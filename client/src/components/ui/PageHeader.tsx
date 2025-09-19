import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div className="flex items-center justify-between mb-8 bg-white border-b border-gray-200 px-6 py-4 -mx-6">
      <div>
        <h1 className="font-sans text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {buttonText && onButtonClick && (
          <Button
            onClick={onButtonClick}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{buttonText}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
