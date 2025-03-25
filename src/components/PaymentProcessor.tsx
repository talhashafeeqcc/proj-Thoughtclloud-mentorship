import React, { useState, useEffect } from "react";
import { processPayment } from "../services/paymentService";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
} from "react-icons/fa";
import { updateSession, getSessionById } from "../services/sessionService";
import { Link, useNavigate } from "react-router-dom";

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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Processing
        </h2>
        {!success && !loading && (
          <p className="text-gray-600">
            You're about to pay{" "}
            <span className="font-bold">${amount.toFixed(2)}</span> for this
            mentoring session.
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6">
          <FaSpinner className="text-blue-500 text-4xl animate-spin mb-4" />
          <p className="text-gray-700">Processing your payment...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p className="text-green-700">Payment successful!</p>
          </div>
          {transactionId && (
            <p className="mt-2 text-sm text-gray-600">
              Transaction ID: {transactionId}
            </p>
          )}
          <div className="mt-4">
            <Link
              to="/dashboard"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              View your booked sessions
            </Link>
          </div>
        </div>
      )}

      {!loading && !success && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Mentoring Session</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <FaCreditCard className="mr-2" />
              Pay Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessor;
