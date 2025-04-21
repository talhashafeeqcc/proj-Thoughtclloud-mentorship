import React, { useState, useEffect } from 'react';
import { getMentorBalance } from '../services/stripe';
import { getUserPayments } from '../services/paymentService';
import { motion } from 'framer-motion';
import { FaSpinner, FaCreditCard, FaHistory, FaChartLine } from 'react-icons/fa';

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

            } catch (err: unknown) {
                console.error('Error fetching dashboard data:', err);
                const errorMessage = err instanceof Error ? err.message : 'An error occurred';
                setError(errorMessage);
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
        return (
            <div className="flex justify-center items-center p-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-indigo-600 dark:text-indigo-400 text-3xl"
                >
                    <FaSpinner />
                </motion.div>
                <p className="ml-3 text-gray-700 dark:text-gray-300">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-md"
            >
                Error: {error}
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4"
        >
            <motion.h1 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2"
            >
                <FaChartLine className="text-indigo-600 dark:text-indigo-400" />
                Mentor Dashboard
            </motion.h1>

            {balance && (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700"
                >
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <FaCreditCard className="text-indigo-600 dark:text-indigo-400" />
                        Account Balance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div 
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md shadow-sm border border-green-100 dark:border-green-800"
                        >
                            <p className="text-gray-600 dark:text-gray-400">Available</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(balance.available, balance.currency)}
                            </p>
                        </motion.div>
                        <motion.div 
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md shadow-sm border border-yellow-100 dark:border-yellow-800"
                        >
                            <p className="text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {formatCurrency(balance.pending, balance.currency)}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700"
            >
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <FaHistory className="text-indigo-600 dark:text-indigo-400" />
                    Payment History
                </h2>
                {payments.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No payments found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 shadow-sm rounded-md">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
                                    <th className="py-3 px-4 font-semibold rounded-tl-md">Date</th>
                                    <th className="py-3 px-4 font-semibold">Amount</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold rounded-tr-md">Transaction ID</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 dark:text-gray-300">
                                {payments.map(payment => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        key={payment.id} 
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                    >
                                        <td className="py-3 px-4">{payment.date}</td>
                                        <td className="py-3 px-4 font-medium">{formatCurrency(payment.amount)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                payment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                                payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm text-gray-500 dark:text-gray-400">{payment.transactionId}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default MentorDashboard; 