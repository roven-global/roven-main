import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Layers,
  Tag,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import Axios from "@/utils/Axios";
import SummaryApi from "@/common/summaryApi";
import { Skeleton } from "@/components/ui/skeleton";
import { FaRupeeSign } from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OverviewStats {
  totalSales: number;
  pendingOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalCategories: number;
  totalSubcategories: number;
  totalBrands: number;
  deliveryAreas: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last30days");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const now = new Date();
        let startDate: Date | null = new Date();
        const endDate = new Date(now);

        switch (timeRange) {
          case "last7days":
            startDate.setDate(now.getDate() - 7);
            break;
          case "last30days":
            startDate.setDate(now.getDate() - 30);
            break;
          case "last90days":
            startDate.setDate(now.getDate() - 90);
            break;
          case "alltime":
            startDate = null; // No start date for all time
            break;
          default:
            startDate.setDate(now.getDate() - 30);
        }

        const params = new URLSearchParams();
        if (startDate) {
          params.append("startDate", startDate.toISOString());
          params.append("endDate", endDate.toISOString());
        }

        const response = await Axios.get(
          `${SummaryApi.adminOverview.url}?${params.toString()}`
        );
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch overview stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  const cardLinks: { [key: string]: string } = {
    "Total Sales": "/admin/orders",
    "Pending Orders": "/admin/orders",
    "Accepted Orders": "/admin/orders",
    "Rejected Orders": "/admin/orders",
    "Completed Orders": "/admin/orders",
    "Total Customers": "/admin/customers",
    "Total Categories": "/admin/category",
    "Total Subcategories": "/admin/category",
    "Total Brands": "/admin/product",
  };

  const summaryCards = [
    {
      title: "Total Sales",
      value: stats?.totalSales.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      }),
      icon: FaRupeeSign,
      color: "bg-accent/20 text-accent border-accent/30",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders,
      icon: Clock,
      color: "bg-muted-brown/20 text-muted-brown border-muted-brown/30",
    },
    {
      title: "Accepted Orders",
      value: stats?.acceptedOrders,
      icon: AlertTriangle,
      color: "bg-primary/20 text-primary border-primary/30",
    },
    {
      title: "Rejected Orders",
      value: stats?.rejectedOrders,
      icon: XCircle,
      color: "bg-red-500/20 text-red-500 border-red-500/30",
    },
    {
      title: "Completed Orders",
      value: stats?.completedOrders,
      icon: CheckCircle,
      color: "bg-muted-brown/20 text-muted-brown border-muted-brown/30",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers,
      icon: Users,
      color: "bg-primary/20 text-primary border-primary/30",
    },
    {
      title: "Total Categories",
      value: stats?.totalCategories,
      icon: Layers,
      color: "bg-accent/20 text-accent border-accent/30",
    },
    {
      title: "Total Subcategories",
      value: stats?.totalSubcategories,
      icon: Layers,
      color: "bg-muted-brown/20 text-muted-brown border-muted-brown/30",
    },
    {
      title: "Total Brands",
      value: stats?.totalBrands,
      icon: Tag,
      color: "bg-muted-brown/20 text-muted-brown border-muted-brown/30",
    },
    {
      title: "Delivery Areas",
      value: stats?.deliveryAreas,
      icon: MapPin,
      color: "bg-primary/20 text-primary border-primary/30",
    },
  ];

  return (
    <div className="min-h-screen p-4 bg-admin-bg">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
        </div>
        <div className="flex items-center space-x-4"></div>
      </div>

      <div className="mb-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48 bg-admin-card border-admin-border text-admin-text focus:ring-primary shadow-sm">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="bg-admin-card border-admin-border shadow-lg">
            <SelectItem
              value="last7days"
              className="text-admin-text focus:bg-admin-accent focus:text-admin-text"
            >
              Last 7 Days
            </SelectItem>
            <SelectItem
              value="last30days"
              className="text-admin-text focus:bg-admin-accent focus:text-admin-text"
            >
              Last 30 Days
            </SelectItem>
            <SelectItem
              value="last90days"
              className="text-admin-text focus:bg-admin-accent focus:text-admin-text"
            >
              Last 90 Days
            </SelectItem>
            <SelectItem
              value="alltime"
              className="text-admin-text focus:bg-admin-accent focus:text-admin-text"
            >
              All Time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="container mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <Card
                  key={i}
                  className="bg-admin-card border-admin-border shadow-sm"
                >
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-admin-accent/50" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/2 bg-admin-accent/50" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {summaryCards.map((card, index) => {
              const link = cardLinks[card.title];
              const cardComponent = (
                <Card
                  key={index}
                  className={`bg-admin-card border-admin-border hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/30 ${
                    link ? "cursor-pointer" : ""
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-admin-muted">
                      {card.title}
                    </CardTitle>
                    <div
                      className={`p-3 rounded-xl border-2 ${card.color} shadow-sm`}
                    >
                      <card.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-admin-text">
                      {card.value}
                    </div>
                  </CardContent>
                </Card>
              );

              if (link) {
                return (
                  <Link to={link} key={index}>
                    {cardComponent}
                  </Link>
                );
              }
              return cardComponent;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
