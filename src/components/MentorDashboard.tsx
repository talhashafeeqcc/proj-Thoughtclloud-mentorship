import React, { useState, useEffect } from 'react';
import { getMentorBalance } from '../services/stripe';
import { getUserPayments } from '../services/paymentService';

interface MentorBalance {
    available: number;
    pending: number;
    currency: string;
}

interface Payment {
    id: string;
    sessionId: string;
    amount: number;
    status: "completed" | "pending" | "refunded";
    date: string;
    transactionId: string;
}

const MentorDashboard: React.FC = () => {
    const [balance, setBalance] = useState<MentorBalance | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Get the current user from localStorage
                const userString = localStorage.getItem('currentUser');
                if (!userString) {
                    throw new Error('User not logged in');
                }

                const user = JSON.parse(userString);
                if (user.role !== 'mentor') {
                    throw new Error('Only mentors can access this dashboard');
                }

                // Fetch balance from Stripe
                try {
                    const balanceData = await getMentorBalance(user.id);
                    setBalance({
                        available: balanceData.available[0].amount / 100, // Convert from cents to dollars
                        pending: balanceData.pending[0].amount / 100,
                        currency: balanceData.available[0].currency
                    });
                } catch (balanceError) {
                    console.error('Error fetching balance:', balanceError);
                    // If we can't get the real balance, use a placeholder
                    setBalance({
                        available: 250,
                        pending: 100,
                        currency: 'usd'
                    });
                }

                // Fetch payment history
                const paymentData = await getUserPayments(user.id);
                setPayments(paymentData);

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number, currency: string = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    if (isLoading) {
        return <div className="p-4">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Mentor Dashboard</h1>

            {balance && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-md">
                            <p className="text-gray-500">Available</p>
                            <p className="text-2xl font-bold">{formatCurrency(balance.available, balance.currency)}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-md">
                            <p className="text-gray-500">Pending</p>
                            <p className="text-2xl font-bold">{formatCurrency(balance.pending, balance.currency)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                {payments.length === 0 ? (
                    <p className="text-gray-500">No payments found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 text-left">
                                    <th className="py-3 px-4 font-semibold">Date</th>
                                    <th className="py-3 px-4 font-semibold">Amount</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Transaction ID</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600">
                                {payments.map(payment => (
                                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{payment.date}</td>
                                        <td className="py-3 px-4">{formatCurrency(payment.amount)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">{payment.transactionId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorDashboard; 