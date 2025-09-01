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
      <h1 className="font-sans text-3xl font-bold mb-6 text-foreground capitalize">{status} Orders</h1>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-brown text-lg font-medium">Loading...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-elegant border border-border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-primary/10">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">Order ID</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">User</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-foreground border-b border-border">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-warm-cream/50 transition-colors duration-200">
                  <td className="py-4 px-6 text-sm text-muted-brown font-medium">{order.orderId}</td>
                  <td className="py-4 px-6 text-sm text-muted-brown">{order.userId?.name || 'N/A'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${order.status === 'pending' ? 'bg-muted-brown/20 text-muted-brown' :
                        order.status === 'accepted' ? 'bg-primary/20 text-primary' :
                          order.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            order.status === 'completed' ? 'bg-muted-brown/20 text-muted-brown' :
                              'bg-accent/20 text-accent'
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