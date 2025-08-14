import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Axios from '@/utils/Axios';

const OrderStatusAdmin = () => {
  const { status } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await Axios.get(`/api/admin/orders/${status}`);
        setOrders(res.data.data);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [status]);

  return (
    <div className="container mx-auto p-6 bg-warm-cream min-h-screen">
      <h1 className="font-serif text-3xl font-bold mb-6 text-deep-forest capitalize">{status} Orders</h1>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-forest text-lg font-medium">Loading...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-elegant border border-warm-taupe overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-sage/10">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-deep-forest border-b border-warm-taupe">Order ID</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-deep-forest border-b border-warm-taupe">User</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-deep-forest border-b border-warm-taupe">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-taupe/30">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-warm-cream/50 transition-colors duration-200">
                  <td className="py-4 px-6 text-sm text-forest font-medium">{order.orderId}</td>
                  <td className="py-4 px-6 text-sm text-forest">{order.userId?.name || 'N/A'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${order.status === 'pending' ? 'bg-soft-bronze/20 text-soft-bronze' :
                        order.status === 'accepted' ? 'bg-sage/20 text-sage' :
                          order.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            order.status === 'completed' ? 'bg-forest/20 text-forest' :
                              'bg-gold-accent/20 text-gold-accent'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderStatusAdmin;