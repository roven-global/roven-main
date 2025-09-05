import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/summaryApi';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Orders = () => {
    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['userOrders'],
        queryFn: async () => {
            const response = await Axios.get(SummaryApi.getUserOrders.url);
            return response.data.data;
        }
    });

    if (isLoading) {
        return <FullPageLoader />;
    }

    if (error) {
        return <div className="container mx-auto p-4">Error fetching orders. Please try again later.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Orders</h1>
            {orders && orders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Order ID</th>
                                <th className="py-2 px-4 border-b">Date</th>
                                <th className="py-2 px-4 border-b">Status</th>
                                <th className="py-2 px-4 border-b">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any) => (
                                <tr key={order._id}>
                                    <td className="py-2 px-4 border-b">{order.orderId}</td>
                                    <td className="py-2 px-4 border-b">{format(new Date(order.createdAt), 'PPP')}</td>
                                    <td className="py-2 px-4 border-b">{order.status}</td>
                                    <td className="py-2 px-4 border-b">${order.totalAmount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>
                    <p>You have no orders yet.</p>
                    <Link to="/shop" className="text-blue-500 mt-4 inline-block">Start Shopping</Link>
                </div>
            )}
        </div>
    );
};

export default Orders;
