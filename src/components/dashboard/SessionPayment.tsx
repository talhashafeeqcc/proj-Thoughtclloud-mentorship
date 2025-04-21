import React, { useState } from "react";
import { processPayment } from "../../services/paymentService";
import { updateSession } from "../../services/sessionService";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaLock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SessionPaymentProps {
  sessionId: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

const SessionPayment: React.FC<SessionPaymentProps> = ({
  sessionId,
  amount,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleProcessPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Process the payment
      const payment = await processPayment(sessionId, amount);
      setTransactionId(payment.transactionId);
      
      // Update the session payment status
      await updateSession(sessionId, {
        paymentStatus: "completed",
        notes: `Payment completed. Transaction ID: ${payment.transactionId}`
      });
      
      setSuccess(true);
      
      // Notify parent component of successful payment
      setTimeout(() => {
        onSuccess();
        // Navigate to dashboard to show updated session
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5"
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-4"
          >
            <div className="relative w-12 h-12 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-full h-full border-4 border-indigo-200 dark:border-indigo-900 rounded-full"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-600 dark:border-indigo-400 rounded-full"
              />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Processing payment...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4 rounded-r-md"
          >
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 p-4 mb-4 rounded-r-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center"
            >
              <FaCheckCircle className="text-green-500 dark:text-green-400 mr-2 text-xl" />
              <p className="text-green-700 dark:text-green-400 font-medium">Payment successful!</p>
            </motion.div>
            {transactionId && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Transaction ID: <span className="font-mono">{transactionId}</span>
              </motion.p>
            )}
          </motion.div>
        )}

        {!loading && !success && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 border border-gray-100 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-300 font-medium">Session Fee</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400">${amount.toFixed(2)}</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                <FaLock className="mr-1 text-gray-400 dark:text-gray-500" />
                Secure payment processing
              </div>
            </div>
            
            <div className="flex gap-3">
              {onCancel && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProcessPayment}
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center shadow-sm"
                disabled={loading}
              >
                <FaCreditCard className="mr-2" />
                Complete Payment
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SessionPayment; 