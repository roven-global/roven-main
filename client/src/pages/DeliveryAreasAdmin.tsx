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
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Delivery Areas</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">City</th>
              <th className="py-2 px-4 border">State</th>
              <th className="py-2 px-4 border">Pincode</th>
              <th className="py-2 px-4 border">Count</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area, idx) => (
              <tr key={idx}>
                <td className="py-2 px-4 border">{area.city}</td>
                <td className="py-2 px-4 border">{area.state}</td>
                <td className="py-2 px-4 border">{area.pincode}</td>
                <td className="py-2 px-4 border">{area.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeliveryAreasAdmin;