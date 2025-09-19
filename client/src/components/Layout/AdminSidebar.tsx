import { Link, useLocation } from "react-router-dom";
import {
  BarChart,
  Boxes,
  PanelsTopLeft,
  Tag,
  Gift,
  Users,
  Mail,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps extends React.HTMLAttributes<HTMLElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const location = useLocation();

  const sidebarNavItems = [
    {
      title: "Overview",
      href: "/admin",
      icon: <BarChart size={20} />,
    },
    {
      title: "Customer",
      href: "/admin/customers",
      icon: <Users size={20} />,
    },
    {
      title: "Subscribers",
      href: "/admin/subscribers",
      icon: <Mail size={20} />,
    },
    {
      title: "Reviews",
      href: "/admin/reviews",
      icon: <MessageSquare size={20} />,
    },
    {
      title: "Welcome Gift",
      href: "/admin/welcome-gifts",
      icon: <Gift size={20} />,
    },
    {
      title: "Coupon",
      href: "/admin/coupons",
      icon: <Tag size={20} />,
    },
    {
      title: "Category",
      href: "/admin/category",
      icon: <PanelsTopLeft size={20} />,
    },
    {
      title: "Products",
      href: "/admin/product",
      icon: <Boxes size={20} />,
    },
    {
      title: "Hero Images",
      href: "/admin/hero-images",
      icon: <ImageIcon size={20} />,
    },
    {
      title: "Stories",
      href: "/admin/stories",
      icon: <Camera size={20} />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings size={20} />,
    },
    {
      title: "Visit Site",
      href: "/",
      icon: <ExternalLink size={20} />,
    },
  ];
  return (
    <nav
      className={cn(
        `hidden h-full flex-col bg-admin-card shadow-lg border-r border-admin-border md:flex overflow-hidden`,
        className
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-admin-border px-4 lg:h-[60px] lg:px-6 bg-white">
        <div className="flex items-center justify-center p-3 rounded-lg bg-admin-accent/10 border border-admin-border/30">
          <img
            src="/Roven-Beauty-Logo.png"
            alt="Roven Beauty"
            className="h-8 w-auto"
          />
        </div>
      </div>
      <div className="flex-1 bg-admin-bg overflow-hidden">
        <nav className="flex flex-col gap-1 px-3 text-sm font-medium lg:px-4 py-6 h-full overflow-y-auto">
          {sidebarNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 relative group",
                location.pathname === item.href ||
                  (item.href === "/admin/product" &&
                    location.pathname.startsWith("/admin/product"))
                  ? "bg-primary text-white font-semibold shadow-md border-l-4 border-accent transform scale-[1.02]"
                  : "text-admin-text hover:text-primary hover:bg-admin-accent hover:shadow-sm hover:transform hover:scale-[1.01]"
              )}
            >
              <div
                className={cn(
                  "transition-colors duration-200",
                  location.pathname === item.href ||
                    (item.href === "/admin/product" &&
                      location.pathname.startsWith("/admin/product"))
                    ? "text-white"
                    : "text-primary group-hover:text-primary"
                )}
              >
                {item.icon}
              </div>
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </nav>
  );
}
