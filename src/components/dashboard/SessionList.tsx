import React, { useState, useCallback } from "react";
import { Session } from "../../types";
import {
  FaCalendar,
  FaClock,
  FaUser,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyCheckAlt,
  FaInfoCircle,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import SessionDetails from "../SessionDetails";
import SessionPayment from "./SessionPayment";
import { useSession } from "../../context/SessionContext";
import ReviewForm from "../ReviewForm";
import { hasSessionRating } from "../../services/ratingService";
import ConfirmationModal from '../shared/ConfirmationModal';
import { motion, AnimatePresence } from "framer-motion";

interface SessionListProps {
  sessions: Session[];
  onCancelSession: (sessionId: string) => Promise<void>;
  currentUserId: string;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onCancelSession,
  currentUserId,
}) => {
  const { fetchUserSessions } = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showPaymentFor, setShowPaymentFor] = useState<string | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [sessionReviewStatus, setSessionReviewStatus] = useState<Record<string, boolean>>({});
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  // Define all useCallback hooks at the top level to maintain consistent hooks order
  const handleShowPayment = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowPaymentFor(sessionId);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    // Refresh session list after successful payment
    fetchUserSessions();
    // Close payment form
    setShowPaymentFor(null);
  }, [fetchUserSessions]);

  const handleShowReview = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    // Check if review already exists
    try {
      const hasRating = await hasSessionRating(sessionId);
      if (hasRating) {
        setSessionReviewStatus(prev => ({ ...prev, [sessionId]: true }));
        alert("You've already submitted a review for this session.");
      } else {
        setShowReviewFor(sessionId);
      }
    } catch (err) {
      console.error("Error checking for existing review:", err);
    }
  }, []);

  const handleReviewSubmitted = useCallback((sessionId: string) => {
    setSessionReviewStatus(prev => ({ ...prev, [sessionId]: true }));
    setShowReviewFor(null);
    // Optionally refresh session list to update UI
    fetchUserSessions();
  }, [fetchUserSessions]);

  if (!sessions || sessions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700 transition-all duration-300"
      >
        <p className="text-gray-600 dark:text-gray-300 text-lg">No sessions found.</p>
        <p className="mt-4">
          <Link to="/mentors" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200">
            Browse mentors
          </Link>{" "}
          to book a session.
        </p>
      </motion.div>
    );
  }

  const handleCancelClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowCancelModal(sessionId);
  };

  const confirmCancelSession = async () => {
    if (!showCancelModal) return;
    
    try {
      setIsCancelling(true);
      await onCancelSession(showCancelModal);
      console.log("Session cancelled successfully");
      setShowCancelModal(null);
    } catch (error) {
      console.error("Error cancelling session:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(selectedSessionId === sessionId ? null : sessionId);
    // Close payment form if user clicks to view details
    if (showPaymentFor === sessionId) {
      setShowPaymentFor(null);
    }
  };

  // Group sessions by status
  const upcomingSessions = sessions.filter(
    (session) => session.status === "scheduled"
  );
  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  );
  const cancelledSessions = sessions.filter(
    (session) => session.status === "cancelled"
  );

  const renderSession = (session: Session, index: number) => {
    const isUpcoming = session.status === "scheduled";
    const isCompleted = session.status === "completed";
    const isPaid = session.paymentStatus === "completed";
    const isPending = session.paymentStatus === "pending";
    // const isRefunded = session.paymentStatus === "refunded";
    const isSelected = selectedSessionId === session.id;
    const isShowingPayment = showPaymentFor === session.id;
    const isShowingReview = showReviewFor === session.id;

    // Use role information to determine if user is mentor/mentee
    const isMentor = session.mentorId === currentUserId;
    const isMentee = session.menteeId === currentUserId;

    const hasReviewed = sessionReviewStatus[session.id];

    const formattedDate = new Date(session.date).toLocaleDateString();

    return (
      <motion.div 
        key={session.id} 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="mb-6"
      >
        <motion.div
          whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 cursor-pointer 
          transition-all duration-300 border
          ${isSelected 
            ? "ring-2 ring-indigo-500 border-indigo-500 dark:ring-indigo-400 dark:border-indigo-400" 
            : "border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800"}`}
          onClick={() => handleViewDetails(session.id)}
        >
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {session.title || "Mentoring Session"}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-2">
                <div className="flex items-center">
                  <FaCalendar className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  {formattedDate}
                  <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                  <FaClock className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  {session.startTime} - {session.endTime}
                </div>
                <div className="flex items-center">
                  <FaUser className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  {isMentee
                    ? `Mentor: ${session.mentorName}`
                    : `Mentee: ${session.menteeName}`}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : isUpcoming
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>

                {isPaid && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-medium">
                    Paid
                  </span>
                )}

                {isPending && (
                  <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
                    Payment Pending
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {isUpcoming && !isPaid && isMentee && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleShowPayment(e, session.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center transition-colors"
                  >
                    <FaMoneyCheckAlt className="mr-1.5" /> Pay Now
                  </motion.button>
                )}

                {isUpcoming && !isCancelling && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleCancelClick(e, session.id)}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-md flex items-center transition-colors"
                  >
                    <FaTimesCircle className="mr-1.5" /> Cancel
                  </motion.button>
                )}

                {isCompleted && isMentee && !hasReviewed && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleShowReview(e, session.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-md flex items-center transition-colors"
                  >
                    <FaStar className="mr-1.5" /> Leave Review
                  </motion.button>
                )}

                {isCompleted && hasReviewed && (
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-3 py-1.5 rounded-md text-xs flex items-center">
                    <FaCheckCircle className="mr-1.5" /> Reviewed
                  </span>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-md flex items-center transition-colors"
                >
                  <FaInfoCircle className="mr-1.5" /> 
                  {isSelected ? "Hide Details" : "View Details"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isSelected && !isShowingPayment && !isShowingReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mt-2">
                <SessionDetails
                  sessionId={session.id}
                  currentUserId={currentUserId}
                />
              </div>
            </motion.div>
          )}
          
          {isShowingPayment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mt-2 shadow-md">
                <SessionPayment
                  sessionId={session.id}
                  amount={session.paymentAmount}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentFor(null)}
                />
              </div>
            </motion.div>
          )}

          {isShowingReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mt-2 shadow-md">
                <ReviewForm
                  sessionId={session.id}
                  mentorId={session.mentorId}
                  menteeId={currentUserId}
                  onReviewSubmitted={() => handleReviewSubmitted(session.id)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Upcoming Sessions Section */}
      {upcomingSessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaCalendar className="mr-2 text-indigo-500 dark:text-indigo-400" />
            Upcoming Sessions ({upcomingSessions.length})
          </h3>
          <div>
            {upcomingSessions.map((session, index) => renderSession(session, index))}
          </div>
        </motion.div>
      )}

      {/* Completed Sessions Section */}
      {completedSessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaCheckCircle className="mr-2 text-green-500 dark:text-green-400" />
            Completed Sessions ({completedSessions.length})
          </h3>
          <div>
            {completedSessions.map((session, index) => renderSession(session, index))}
          </div>
        </motion.div>
      )}

      {/* Cancelled Sessions Section */}
      {cancelledSessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaTimesCircle className="mr-2 text-red-500 dark:text-red-400" />
            Cancelled Sessions ({cancelledSessions.length})
          </h3>
          <div>
            {cancelledSessions.map((session, index) => renderSession(session, index))}
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {showCancelModal && (
        <ConfirmationModal
          title="Cancel Session"
          message="Are you sure you want to cancel this session? This action cannot be undone."
          confirmText="Yes, Cancel Session"
          cancelText="No, Keep Session"
          isOpen={!!showCancelModal}
          onConfirm={confirmCancelSession}
          onCancel={() => setShowCancelModal(null)}
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};

export default SessionList;
