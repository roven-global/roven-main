import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-admin-bg">
      {/* Fixed Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-[220px] lg:w-[280px] z-10">
        <AdminSidebar className="border-r border-admin-border h-full" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-[220px] lg:ml-[280px]">
        <header className="flex h-14 items-center justify-between border-b border-admin-border bg-admin-card px-6 lg:h-[60px] lg:px-8 shadow-sm">
          {/* Left side - Mobile Menu */}
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden border-admin-border hover:bg-admin-accent hover:text-admin-text"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex flex-col bg-admin-card border-admin-border"
              >
                <AdminSidebar />
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Admin Panel Title */}
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-admin-text">
              Admin Panel
            </h1>
          </div>

          {/* Right side - Empty for balance */}
          <div className="w-8"></div>
        </header>
        <main className="flex-1 overflow-auto bg-admin-bg p-6 lg:p-8">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
