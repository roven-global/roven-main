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
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          onClick={onButtonClick}
          className="bg-primary hover:bg-muted-brown text-white shadow-md"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
