import React, { useState, useEffect } from "react";
import { processPayment } from "../services/paymentService";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaArrowLeft,
} from "react-icons/fa";
import { updateSession, getSessionById } from "../services/sessionService";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PaymentProcessorProps {
  sessionId: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  sessionId,
  amount,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const navigate = useNavigate();

  // Check if session is already paid when component mounts
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        if (!sessionId || sessionId === "temp-session-id") return;
        
        setLoading(true);
        const session = await getSessionById(sessionId);
        
        if (session.paymentStatus === "completed") {
          console.log("Session already paid:", sessionId);
          setIsPaid(true);
          setSuccess(true);
        }
      } catch (err) {
        console.error("Error checking session status:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkSessionStatus();
  }, [sessionId]);

  const handleProcessPayment = async () => {
    if (isPaid) {
      setSuccess(true);
      if (onSuccess) onSuccess();
      return;
    }
    
    if (!sessionId || sessionId === "temp-session-id") {
      setError("Invalid session ID. Please try again.");
      return;
    }
    
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
      setIsPaid(true);
      
      // Wait a moment before redirecting to ensure DB updates complete
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700"
    >
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Payment Processing
        </h2>
        {!success && !loading && (
          <p className="text-gray-600 dark:text-gray-300">
            You're about to pay{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">${amount.toFixed(2)}</span> for this
            mentoring session.
          </p>
        )}
      </motion.div>

      {loading && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-6"
        >
          <div className="relative w-16 h-16">
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
          <p className="text-gray-700 dark:text-gray-300 mt-4 font-medium">Processing your payment...</p>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-md"
        >
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, staggerChildren: 0.1 }}
          className="bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 p-5 mb-6 rounded-r-md"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center"
          >
            <FaCheckCircle className="text-green-500 dark:text-green-400 mr-2 text-xl flex-shrink-0" />
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
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <FaArrowLeft className="mr-2 text-sm" />
              View your booked sessions
            </Link>
          </motion.div>
        </motion.div>
      )}

      {!loading && !success && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-300">Mentoring Session</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">${amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-800 dark:text-white">Total</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProcessPayment}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-sm"
            >
              <FaCreditCard className="mr-2" />
              Pay Now
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentProcessor;
