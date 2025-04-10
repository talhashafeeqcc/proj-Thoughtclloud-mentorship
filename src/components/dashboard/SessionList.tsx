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
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-600">No sessions found.</p>
        <p className="mt-2">
          <Link to="/mentors" className="text-blue-500 hover:text-blue-700">
            Browse mentors
          </Link>{" "}
          to book a session.
        </p>
      </div>
    );
  }

  const handleCancelClick = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to cancel this session?")) {
      setIsCancelling(sessionId);
      try {
        await onCancelSession(sessionId);
      } catch (error) {
        console.error("Error cancelling session:", error);
      } finally {
        setIsCancelling(null);
      }
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
      <div key={session.id} className="mb-4">
        <div
          className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"
            }`}
          onClick={() => handleViewDetails(session.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">
                {session.title || "Mentoring Session"}
              </h3>
              <div className="text-sm text-gray-600 mb-2">
                <div className="flex items-center mt-1">
                  <FaCalendar className="mr-2 text-gray-500" />
                  {formattedDate}
                  <span className="mx-2">•</span>
                  <FaClock className="mr-2 text-gray-500" />
                  {session.startTime} - {session.endTime}
                </div>
                <div className="flex items-center mt-1">
                  <FaUser className="mr-2 text-gray-500" />
                  {isMentee
                    ? `Mentor: ${session.mentorName}`
                    : `Mentee: ${session.menteeName}`}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex space-x-2 mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${isCompleted
                    ? "bg-green-100 text-green-800"
                    : isUpcoming
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>

                <span
                  className={`px-2 py-1 rounded-full text-xs ${isPaid
                    ? "bg-green-100 text-green-800"
                    : isPending
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {session.paymentStatus.charAt(0).toUpperCase() +
                    session.paymentStatus.slice(1)}
                </span>
              </div>

              {/* Actions buttons */}
              <div className="flex flex-col items-end space-y-2">
                {/* Cancel button for upcoming sessions */}
                {isUpcoming && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelClick(session.id);
                    }}
                    disabled={!!isCancelling}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center"
                  >
                    {isCancelling === session.id ? (
                      <>Cancelling...</>
                    ) : (
                      <>
                        <FaTimesCircle className="mr-1" /> Cancel
                      </>
                    )}
                  </button>
                )}

                {/* Review button for completed and paid sessions */}
                {isCompleted && isPaid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Review button clicked for session", session.id);
                      console.log("isMentee:", isMentee);
                      handleShowReview(e, session.id);
                    }}
                    className={`text-sm ${hasReviewed ? 'text-gray-500' : 'text-yellow-500 hover:text-yellow-700'} flex items-center`}
                    disabled={hasReviewed}
                  >
                    <FaStar className="mr-1" /> {hasReviewed ? "Reviewed" : "Leave a Review"}
                  </button>
                )}

                {/* Payment button for pending payments */}
                {isPending && isMentee && (
                  <button
                    onClick={(e) => handleShowPayment(e, session.id)}
                    className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    <FaMoneyCheckAlt className="mr-1" /> Complete Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded view details */}
        {isSelected && !isShowingPayment && !isShowingReview && (
          <div className="mt-2 bg-gray-50 rounded-lg border p-4">
            <SessionDetails
              sessionId={session.id}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Payment form */}
        {isShowingPayment && (
          <SessionPayment
            sessionId={session.id}
            amount={session.paymentAmount}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Review form */}
        {isShowingReview && (
          <div className="mt-2">
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
    <div>
      {upcomingSessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FaCalendar className="mr-2 text-blue-500" /> Upcoming Sessions
          </h3>
          <div>{upcomingSessions.map(renderSession)}</div>
        </div>
      )}

      {completedSessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" /> Completed Sessions
          </h3>
          <div>{completedSessions.map(renderSession)}</div>
        </div>
      )}

      {cancelledSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FaTimesCircle className="mr-2 text-red-500" /> Cancelled Sessions
          </h3>
          <div>{cancelledSessions.map(renderSession)}</div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
