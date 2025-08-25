import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { AdminLayout } from "@/components/Layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, ShoppingBag } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalBrands: 0, brands: [], totalSales: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await Axios.get("/api/admin/dashboard-stats");
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, children }: { title: string, value: string | number, icon: React.ReactNode, children?: React.ReactNode }) => (
    <Card className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-forest">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-deep-forest">{value}</div>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <>
      <h1 className="text-3xl font-sans font-bold text-deep-forest mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-lg bg-soft-beige" />
          <Skeleton className="h-36 rounded-lg bg-soft-beige" />
          <Skeleton className="h-36 rounded-lg bg-soft-beige" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Sales" value={`₹${stats.totalSales.toLocaleString()}`} icon={<DollarSign className="h-5 w-5 text-warm-taupe" />}>
            <p className="text-xs text-forest/70 mt-2">All-time revenue</p>
          </StatCard>
          <StatCard title="Total Customers" value={stats.totalCustomers} icon={<Users className="h-5 w-5 text-warm-taupe" />}>
            <p className="text-xs text-forest/70 mt-2">Registered users</p>
          </StatCard>
          <StatCard title="Total Brands" value={stats.totalBrands} icon={<ShoppingBag className="h-5 w-5 text-warm-taupe" />}>
            <p className="text-xs text-forest/70 mt-2">Available brands</p>
          </StatCard>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;