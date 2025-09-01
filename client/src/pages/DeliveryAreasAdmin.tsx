import React, { useEffect, useState } from 'react';
import Axios from '@/utils/Axios';

const DeliveryAreasAdmin = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      try {
        const res = await Axios.get('/api/admin/delivery-areas');
        setAreas(res.data.data);
      } catch (err) {
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  return (
    <div className="container mx-auto p-6 bg-warm-cream min-h-screen">
      <h1 className="font-sans text-3xl font-bold mb-6 text-foreground">Delivery Areas</h1>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-brown text-lg font-medium">Loading...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-elegant border border-border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-primary/10">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">City</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">State</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">Pincode</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {areas.map((area, idx) => (
                <tr key={idx} className="hover:bg-warm-cream/50 transition-colors duration-200">
                  <td className="py-4 px-6 text-sm text-muted-brown font-medium">{area.city}</td>
                  <td className="py-4 px-6 text-sm text-muted-brown">{area.state}</td>
                  <td className="py-4 px-6 text-sm text-muted-brown">{area.pincode}</td>
                  <td className="py-4 px-6 text-sm text-accent font-semibold">{area.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryAreasAdmin;