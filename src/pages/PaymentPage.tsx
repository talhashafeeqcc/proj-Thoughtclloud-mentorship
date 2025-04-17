import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSessionById } from "../services/sessionService";
import { getMentorById } from "../services/mentorService";
import PaymentForm from "../components/PaymentForm";
import { Session, MentorProfile } from "../types";
import { FaArrowLeft } from "react-icons/fa";

const PaymentPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!sessionId) {
          throw new Error('No session ID provided');
        }

        // Fetch session details
        const sessionData = await getSessionById(sessionId);
        setSession(sessionData);

        // Fetch mentor details
        const mentorData = await getMentorById(sessionData.mentorId);
        setMentor(mentorData);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to load session details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    setPaymentComplete(true);

    // After 2 seconds, redirect to the session details page
    setTimeout(() => {
      navigate(`/sessions/${sessionId}`);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage);
    setError(`Payment failed: ${errorMessage}`);
    
    // Scroll to the top of the page to show the error
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturn = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
          <p className="text-green-600 mb-4">Your session has been confirmed.</p>
          <p className="text-sm text-gray-500">Redirecting to session details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleReturn}
          className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
        >
          <FaArrowLeft className="mr-2" /> Return to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>

        {session && mentor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Session Details */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Session Details</h2>

              <div className="mb-4">
                <p className="text-gray-600 mb-1">Mentor</p>
                <p className="font-medium">{mentor.name}</p>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-1">Date</p>
                <p className="font-medium">{session.date}</p>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-1">Time</p>
                <p className="font-medium">{session.startTime} - {session.endTime}</p>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-1">Session Type</p>
                <p className="font-medium">{session.title || 'One-on-one Mentoring'}</p>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-xl font-bold">${mentor.sessionPrice || 50}</p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div>
              <PaymentForm
                sessionId={sessionId || 'temp-session-id'}
                amount={mentor.sessionPrice || 50}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
