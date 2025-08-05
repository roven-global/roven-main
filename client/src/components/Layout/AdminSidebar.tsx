
import { Link, useLocation } from "react-router-dom"
import { BarChart, Boxes, PanelsTopLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdminSidebarProps extends React.HTMLAttributes<HTMLElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const location = useLocation()

  const sidebarNavItems = [
    {
      title: "Overview",
      href: "/admin/overview",
      icon: <BarChart size={20} />
    },
    {
      title: "Category",
      href: "/admin/category",
      icon: <PanelsTopLeft size={20} />
    },
    {
      title: "Product",
      href: "/admin/product",
      icon: <Boxes size={20} />
    }
  ]
  return (
    <nav
      className={cn(
        `hidden h-full flex-col bg-gray-100 dark:bg-gray-800 md:flex`,
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/admin/overview" className="flex items-center gap-2 font-semibold">
          <span className="">Dashboard</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {sidebarNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                {
                  "bg-muted text-primary": location.pathname === item.href
                }
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Link to="/">
        <Button size="sm" className="w-full">
          Home
        </Button>
        </Link> 
      </div>
    </nav>
  )
}