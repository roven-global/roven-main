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
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 capitalize">{status} Orders</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Order ID</th>
              <th className="py-2 px-4 border">User</th>
              <th className="py-2 px-4 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="py-2 px-4 border">{order.orderId}</td>
                <td className="py-2 px-4 border">{order.userId?.name || 'N/A'}</td>
                <td className="py-2 px-4 border capitalize">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderStatusAdmin;