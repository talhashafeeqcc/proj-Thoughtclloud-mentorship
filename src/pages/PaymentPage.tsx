import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSessionById } from "../services/sessionService";
import { getMentorById } from "../services/mentorService";
import PaymentForm from "../components/PaymentForm";
import { Session, MentorProfile } from "../types";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle, CalendarDays, Clock, User, FileText, CreditCard } from "lucide-react";

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
      <div className="min-h-[70vh] flex justify-center items-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto max-w-2xl mt-10 p-8 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800"
      >
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold mb-4 text-red-700 dark:text-red-300">Payment Error</h1>
            <p className="mb-6 text-red-600 dark:text-red-300">{error}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (paymentComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-2xl mt-10 p-8 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.1 
            }}
            className="w-20 h-20 bg-green-100 dark:bg-green-800/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
          >
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-3 text-green-700 dark:text-green-300">Payment Successful!</h1>
          <p className="text-green-600 dark:text-green-400 mb-6">Your session has been confirmed.</p>
          <div className="mt-8 flex justify-center items-center">
            <div className="h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></div>
            <div className="h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse mx-1.5"></div>
            <div className="h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></div>
            <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">Redirecting to session details...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: -5 }}
          onClick={handleReturn}
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
        </motion.button>

        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-bold mb-8 text-gray-900 dark:text-white"
        >
          Complete Your Payment
        </motion.h1>

        {session && mentor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Session Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Session Details
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mentor</p>
                    <p className="font-medium text-gray-900 dark:text-white">{mentor.name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{session.date}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">{session.startTime} - {session.endTime}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Session Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{session.title || 'One-on-one Mentoring'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Total Amount</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${mentor.sessionPrice || 50}</p>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <PaymentForm
                sessionId={sessionId || 'temp-session-id'}
                amount={mentor.sessionPrice || 50}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
