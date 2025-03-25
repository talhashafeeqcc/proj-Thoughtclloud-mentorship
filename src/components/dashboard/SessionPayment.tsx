import React, { useState } from "react";
import { processPayment } from "../../services/paymentService";
import { updateSession } from "../../services/sessionService";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SessionPaymentProps {
  sessionId: string;
  amount: number;
  onSuccess: () => void;
}

const SessionPayment: React.FC<SessionPaymentProps> = ({
  sessionId,
  amount,
  onSuccess,
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
    <div className="mt-2 bg-white rounded-lg shadow-sm p-4">
      {loading && (
        <div className="flex items-center justify-center py-2">
          <FaSpinner className="text-blue-500 text-xl animate-spin mr-2" />
          <p className="text-gray-700">Processing payment...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-3">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 p-3 mb-3">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p className="text-green-700 text-sm">Payment successful!</p>
          </div>
          {transactionId && (
            <p className="mt-1 text-xs text-gray-600">
              Transaction ID: {transactionId}
            </p>
          )}
        </div>
      )}

      {!loading && !success && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Session Fee</p>
            <p className="font-medium">${amount.toFixed(2)}</p>
          </div>
          
          <button
            onClick={handleProcessPayment}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
            disabled={loading}
          >
            <FaCreditCard className="mr-2" />
            Complete Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionPayment; 