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
    { title: "Total Sales", value: stats?.totalSales.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), icon: FaRupeeSign, color: "bg-gold-accent/20 text-gold-accent border-gold-accent/30" },
    { title: "Pending Orders", value: stats?.pendingOrders, icon: Clock, color: "bg-soft-bronze/20 text-soft-bronze border-soft-bronze/30" },
    { title: "Accepted Orders", value: stats?.acceptedOrders, icon: AlertTriangle, color: "bg-sage/20 text-sage border-sage/30" },
    { title: "Rejected Orders", value: stats?.rejectedOrders, icon: XCircle, color: "bg-red-500/20 text-red-500 border-red-500/30" },
    { title: "Completed Orders", value: stats?.completedOrders, icon: CheckCircle, color: "bg-forest/20 text-forest border-forest/30" },
    { title: "Total Customers", value: stats?.totalCustomers, icon: Users, color: "bg-sage/20 text-sage border-sage/30" },
    { title: "Total Categories", value: stats?.totalCategories, icon: Layers, color: "bg-gold-accent/20 text-gold-accent border-gold-accent/30" },
    { title: "Total Subcategories", value: stats?.totalSubcategories, icon: Layers, color: "bg-soft-bronze/20 text-soft-bronze border-soft-bronze/30" },
    { title: "Total Brands", value: stats?.totalBrands, icon: Tag, color: "bg-forest/20 text-forest border-forest/30" },
    { title: "Delivery Areas", value: stats?.deliveryAreas, icon: MapPin, color: "bg-sage/20 text-sage border-sage/30" },
  ];

  return (
    <div className="bg-warm-cream min-h-screen p-6">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-deep-forest font-serif">Overview</h2>
      </div>
      <div className="container mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array(10).fill(0).map((_, i) => (
              <Card key={i} className="bg-white border-warm-taupe shadow-elegant">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-warm-taupe/20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 bg-warm-taupe/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {summaryCards.map((card, index) => (
              <Card
                key={index}
                className="bg-white border-warm-taupe hover:shadow-luxury transition-all duration-300 hover:scale-105"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-forest">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full border ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-deep-forest">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;