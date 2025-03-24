import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSessionById } from "../services/sessionService";
import { processPayment } from "../services/paymentService";
import { useAuth } from "../context/AuthContext";
import { Session } from "../types";
import PaymentProcessor from "../components/PaymentProcessor";
import { FaArrowLeft, FaSpinner, FaExclamationTriangle } from "react-icons/fa";

const PaymentPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId) {
        setError("No session ID provided.");
        setLoading(false);
        return;
      }

      try {
        const sessionData = await getSessionById(sessionId);
        setSession(sessionData);

        // Validate if the current user is the mentee of this session
        if (authState.user?.id !== sessionData.menteeId) {
          setError("You are not authorized to access this payment page.");
        }

        // Check if payment is already completed
        if (sessionData.paymentStatus === "completed") {
          setError("Payment for this session has already been processed.");
        }
      } catch (err: any) {
        console.error("Error fetching session:", err);
        setError(err.message || "Failed to load session details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, authState.user?.id]);

  const handleReturn = () => {
    navigate("/dashboard");
  };

  const formattedDate = session
    ? new Date(session.date).toLocaleDateString()
    : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleReturn}
          className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
        >
          <FaArrowLeft className="mr-2" /> Return to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>

        {loading ? (
          <div className="flex items-center justify-center p-10">
            <FaSpinner className="animate-spin text-blue-500 text-3xl mr-3" />
            <span>Loading session details...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 mt-1 mr-2" />
              <div>
                <p className="font-medium text-red-700">Error</p>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={handleReturn}
                  className="mt-2 text-blue-500 hover:text-blue-700 underline"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : session ? (
          <div>
            <div className="bg-gray-50 rounded-lg border p-6 mb-6">
              <h2 className="text-xl font-medium mb-4">Session Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 mb-1">Mentor:</p>
                  <p className="font-medium">{session.mentorName}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Date:</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Time:</p>
                  <p className="font-medium">
                    {session.startTime} - {session.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Amount:</p>
                  <p className="font-medium">
                    ${session.paymentAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <PaymentProcessor
              sessionId={session.id}
              amount={session.paymentAmount}
              onSuccess={() => {
                // After successful payment, redirect to dashboard
                setTimeout(() => {
                  navigate("/dashboard");
                }, 2000);
              }}
              onCancel={() => {
                navigate("/dashboard");
              }}
            />
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2" />
              <div>
                <p className="font-medium text-yellow-700">Session Not Found</p>
                <p className="text-yellow-600">
                  The requested session could not be found.
                </p>
                <button
                  onClick={handleReturn}
                  className="mt-2 text-blue-500 hover:text-blue-700 underline"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
