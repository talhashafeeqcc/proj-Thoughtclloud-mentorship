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
} from "react-icons/fa";
import { Link } from "react-router-dom";
import SessionDetails from "../SessionDetails";
import SessionPayment from "./SessionPayment";
import { useSession } from "../../context/SessionContext";
import ReviewForm from "../ReviewForm";
import { hasSessionRating } from "../../services/ratingService";
import ConfirmationModal from '../shared/ConfirmationModal';

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
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700 transition-all duration-300">
        <p className="text-gray-600 dark:text-gray-300 text-lg">No sessions found.</p>
        <p className="mt-4">
          <Link to="/mentors" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200">
            Browse mentors
          </Link>{" "}
          to book a session.
        </p>
      </div>
    );
  }

  const handleCancelClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowCancelModal(sessionId);
  };

  const confirmCancelSession = async () => {
    if (!showCancelModal) return;

    setIsCancelling(showCancelModal);
    try {
      await onCancelSession(showCancelModal);
    } catch (error) {
      console.error("Error cancelling session:", error);
    } finally {
      setIsCancelling(null);
      setShowCancelModal(null);
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

  const renderSession = (session: Session) => {
    const isUpcoming = session.status === "scheduled";
    const isCompleted = session.status === "completed";
    const isPaid = session.paymentStatus === "completed";
    const isPending = session.paymentStatus === "pending";
    // const isRefunded = session.paymentStatus === "refunded";
    const isSelected = selectedSessionId === session.id;
    const isShowingPayment = showPaymentFor === session.id;
    const isShowingReview = showReviewFor === session.id;

    // Debug current user ID and session
    console.log("Current User ID:", currentUserId);
    console.log("Session:", session);
    console.log("Mentor ID:", session.mentorId);
    console.log("Mentee ID:", session.menteeId);

    // Use role information to determine if user is mentor/mentee
    // This might be more reliable than comparing IDs directly
    const isMentor = session.mentorId === currentUserId;
    const isMentee = session.menteeId === currentUserId;

    console.log("Is Mentor:", isMentor);
    console.log("Is Mentee:", isMentee);

    const hasReviewed = sessionReviewStatus[session.id];

    const formattedDate = new Date(session.date).toLocaleDateString();

    return (
      <div key={session.id} className="mb-6">
        <div
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
                  <span className="mx-2 text-gray-400">•</span>
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
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : isUpcoming
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isPaid
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : isPending
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {session.paymentStatus.charAt(0).toUpperCase() +
                    session.paymentStatus.slice(1)}
                </span>
              </div>

              {/* Actions buttons */}
              <div className="flex space-x-3 mt-1">
                {/* Cancel button for upcoming sessions - show for both mentor and mentee */}
                {isUpcoming && (
                  <button
                    onClick={(e) => handleCancelClick(e, session.id)}
                    disabled={!!isCancelling}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center px-3 py-1 rounded-md border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors duration-200"
                  >
                    {isCancelling === session.id ? (
                      <>Cancelling...</>
                    ) : (
                      <>
                        <FaTimesCircle className="mr-1.5" /> Cancel
                      </>
                    )}
                  </button>
                )}

                {/* Review button for completed and paid sessions */}
                {isCompleted && isPaid && isMentee && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Review button clicked for session", session.id);
                      console.log("isMentee:", isMentee);
                      handleShowReview(e, session.id);
                    }}
                    className={`text-sm px-3 py-1 rounded-md border transition-colors duration-200 flex items-center ${
                      hasReviewed 
                        ? 'text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700' 
                        : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30'
                    }`}
                    disabled={hasReviewed}
                  >
                    <FaStar className="mr-1.5" /> {hasReviewed ? "Reviewed" : "Leave Review"}
                  </button>
                )}

                {/* Payment button for pending payments */}
                {isPending && isMentee && (
                  <button
                    onClick={(e) => handleShowPayment(e, session.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center px-3 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30 transition-colors duration-200"
                  >
                    <FaMoneyCheckAlt className="mr-1.5" /> Complete Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded view details */}
        {isSelected && !isShowingPayment && !isShowingReview && (
          <div className="mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-inner transition-all duration-300">
            <SessionDetails
              sessionId={session.id}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Payment form */}
        {isShowingPayment && (
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md transition-all duration-300">
            <SessionPayment
              sessionId={session.id}
              amount={session.paymentAmount}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {/* Review form */}
        {isShowingReview && (
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md transition-all duration-300">
            <ReviewForm
              sessionId={session.id}
              mentorId={session.mentorId}
              menteeId={session.menteeId}
              onReviewSubmitted={() => handleReviewSubmitted(session.id)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!showCancelModal}
        title="Cancel Session"
        message="Are you sure you want to cancel this session? This action cannot be undone."
        confirmText="Yes, Cancel Session"
        cancelText="No, Keep Session"
        onConfirm={confirmCancelSession}
        onCancel={() => setShowCancelModal(null)}
        type="danger"
      />

      <div className="space-y-8">
        {upcomingSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <FaCalendar className="mr-2 text-indigo-500 dark:text-indigo-400" /> 
              Upcoming Sessions
            </h3>
            <div className="space-y-4">{upcomingSessions.map(renderSession)}</div>
          </div>
        )}

        {completedSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <FaCheckCircle className="mr-2 text-green-500 dark:text-green-400" /> 
              Completed Sessions
            </h3>
            <div className="space-y-4">{completedSessions.map(renderSession)}</div>
          </div>
        )}

        {cancelledSessions.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <FaTimesCircle className="mr-2 text-red-500 dark:text-red-400" /> 
              Cancelled Sessions
            </h3>
            <div className="space-y-4">{cancelledSessions.map(renderSession)}</div>
          </div>
        )}
      </div>
    </>
  );
};

export default SessionList;
