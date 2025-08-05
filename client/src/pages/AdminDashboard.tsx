import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";

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
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Total Brands</h2>
            <p className="text-2xl mb-2">{stats.totalBrands}</p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {stats.brands && stats.brands.length > 0 ? (
                stats.brands.map((brand, idx) => (
                  <li key={idx}>{brand}</li>
                ))
              ) : (
                <li>No brands found</li>
              )}
            </ul>
          </div>
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Total Sales</h2>
            <p className="text-2xl">{stats.totalSales}</p>
          </div>
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-lg font-semibold">Total Customers</h2>
            <p className="text-2xl">{stats.totalCustomers}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;