import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Layers, Tag, MapPin, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import { Skeleton } from '@/components/ui/skeleton';
import { FaRupeeSign } from 'react-icons/fa';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(SummaryApi.adminOverview.url);
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
  }, []);

  const summaryCards = [
    { title: "Total Sales", value: stats?.totalSales.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), icon: FaRupeeSign, color: "bg-green-100 text-green-700" },
    { title: "Pending Orders", value: stats?.pendingOrders, icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    { title: "Accepted Orders", value: stats?.acceptedOrders, icon: AlertTriangle, color: "bg-blue-100 text-blue-700" },
    { title: "Rejected Orders", value: stats?.rejectedOrders, icon: XCircle, color: "bg-red-100 text-red-700" },
    { title: "Completed Orders", value: stats?.completedOrders, icon: CheckCircle, color: "bg-purple-100 text-purple-700" },
    { title: "Total Customers", value: stats?.totalCustomers, icon: Users, color: "bg-indigo-100 text-indigo-700" },
    { title: "Total Categories", value: stats?.totalCategories, icon: Layers, color: "bg-pink-100 text-pink-700" },
    { title: "Total Subcategories", value: stats?.totalSubcategories, icon: Layers, color: "bg-rose-100 text-rose-700" },
    { title: "Total Brands", value: stats?.totalBrands, icon: Tag, color: "bg-teal-100 text-teal-700" },
    { title: "Delivery Areas", value: stats?.deliveryAreas, icon: MapPin, color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>
      <div className="container mx-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array(10).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {summaryCards.map((card, index) => (
              <Card
                key={index}
                className="border-muted hover:shadow-lg transition-shadow"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOverview;