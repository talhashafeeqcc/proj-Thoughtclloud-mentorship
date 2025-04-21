import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Session } from "../types";
import { getSessionById, updateSession } from "../services/sessionService";
import { getSessionPayment, refundPayment, completePayment } from "../services/paymentService";
import { hasSessionRating, getMentorRatings } from "../services/ratingService";
import ReviewForm from "./ReviewForm";
import {
  FaCalendar,
  FaClock,
  FaUser,
  FaDollarSign,
  FaCheck,
  FaSpinner,
  FaStar,
  FaVideo,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaBan
} from "react-icons/fa";

interface SessionDetailsProps {
  sessionId: string;
  currentUserId: string;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({
  sessionId,
  currentUserId,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{
    transactionId?: string;
  } | null>(null);
  const [rated, setRated] = useState<boolean | null>(null);
  const [sessionRating, setSessionRating] = useState<any | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Define fetchSessionDetails using useCallback
  const fetchSessionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionById(sessionId);
      setSession(sessionData);

      // Check if session has been rated
      const isRated = await hasSessionRating(sessionId);
      setRated(isRated);

      // If the session has been rated, fetch the rating details
      if (isRated && sessionData.mentorId) {
        const mentorRatings = await getMentorRatings(sessionData.mentorId);
        const rating = mentorRatings.find(r => r.sessionId === sessionId);
        if (rating) {
          setSessionRating(rating);
        }
      }

      // Fetch payment information
      const payment = await getSessionPayment(sessionId);
      setPaymentInfo(payment);
    } catch (err: any) {
      console.error("Error fetching session details:", err);
      setError(err.message || "Failed to load session details");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  // Function to render stars for a given rating
  const renderStars = (score: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${star <= score ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
              } w-4 h-4`}
          />
        ))}
      </div>
    );
  };

  // Format date for review display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle completing a session (mentor action)
  const handleCompleteSession = async () => {
    if (!session || !session.id) return;
    
    setProcessing(true);
    setActionMessage(null);
    
    try {
      // First update the session status
      await updateSession(session.id, { status: "completed" });
      
      // Then capture the payment
      await completePayment(session.id);
      
      // Show success message
      setActionMessage({
        type: 'success',
        text: 'Session marked as completed. Payment has been released to the mentor.'
      });
      
      // Refresh session data
      fetchSessionDetails();
    } catch (error) {
      console.error("Error completing session:", error);
      setActionMessage({
        type: 'error',
        text: `Failed to complete session: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle cancelling a session
  const handleCancelSession = async () => {
    if (!session || !session.id) return;
    
    setProcessing(true);
    setActionMessage(null);
    
    try {
      // First update the session status
      await updateSession(session.id, { status: "cancelled" });
      
      // Find the payment and refund it
      const payment = await getSessionPayment(session.id);
      if (payment && payment.id) {
        await refundPayment(payment.id);
      }
      
      // Show success message
      setActionMessage({
        type: 'success',
        text: 'Session cancelled. Payment has been refunded to the mentee.'
      });
      
      // Refresh session data
      fetchSessionDetails();
    } catch (error) {
      console.error("Error cancelling session:", error);
      setActionMessage({
        type: 'error',
        text: `Failed to cancel session: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-800 dark:text-gray-200">
        <FaSpinner className="animate-spin text-blue-500 dark:text-blue-400 text-2xl mr-2" />
        <span>Loading session details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-yellow-700 dark:text-yellow-300 font-medium">Session not found</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              The requested session could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isMentor = currentUserId === session.mentorId;
  const isMentee = currentUserId === session.menteeId;
  const isCompleted = session.status === "completed";
  const isPaid = session.paymentStatus === "completed";

  const formattedDate = new Date(session.date).toLocaleDateString();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-card-dark p-6 mb-6 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white">
      <h3 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {session.title || "Mentoring Session"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center mb-2">
            <FaCalendar className="text-gray-500 dark:text-gray-400 mr-2" />
            <span className="font-medium">Date:</span>
            <span className="ml-2">{formattedDate}</span>
          </div>

          <div className="flex items-center mb-2">
            <FaClock className="text-gray-500 dark:text-gray-400 mr-2" />
            <span className="font-medium">Time:</span>
            <span className="ml-2">
              {session.startTime} - {session.endTime}
            </span>
          </div>

          {isMentee && (
            <div className="flex items-center mb-2">
              <FaUser className="text-gray-500 dark:text-gray-400 mr-2" />
              <span className="font-medium">Mentor:</span>
              <Link
                to={`/mentors/${session.mentorId}`}
                className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {session.mentorName}
              </Link>
            </div>
          )}

          {isMentor && (
            <div className="flex items-center mb-2">
              <FaUser className="text-gray-500 dark:text-gray-400 mr-2" />
              <span className="font-medium">Mentee:</span>
              <span className="ml-2">{session.menteeName}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center mb-2">
            <FaDollarSign className="text-gray-500 dark:text-gray-400 mr-2" />
            <span className="font-medium">Price:</span>
            <span className="ml-2">${session.paymentAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-center mb-2">
            <span className="font-medium">Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${session.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : session.status === "cancelled"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>

          <div className="flex items-center mb-2">
            <span className="font-medium">Payment:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${session.paymentStatus === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : session.paymentStatus === "refunded"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
            >
              {session.paymentStatus.charAt(0).toUpperCase() +
                session.paymentStatus.slice(1)}
            </span>
          </div>

          {paymentInfo && paymentInfo.transactionId && (
            <div className="flex items-center mb-2">
              <FaCheck className="text-green-500 dark:text-green-400 mr-2" />
              <span className="font-medium">Transaction ID:</span>
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                {paymentInfo.transactionId}
              </span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Debug: Has meeting link: {session.meetingLink ? 'Yes' : 'No'}</p>
          </div>

          {session.meetingLink && session.meetingLink.length > 0 ? (
            <div className="flex items-start mb-2">
              <FaVideo className="text-gray-500 dark:text-gray-400 mr-2 mt-1" />
              <div>
                <span className="font-medium">Meeting Link:</span>
                <div className="ml-2">
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    {session.meetingLink.substring(0, 30)}...
                    <FaExternalLinkAlt className="ml-1 text-xs" />
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Click to join the Google Meet session
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start mb-2 text-gray-500 dark:text-gray-400">
              <FaVideo className="mr-2 mt-1" />
              <div>
                <span className="font-medium">Meeting Link:</span>
                <p className="ml-2 text-sm">No meeting link available for this session.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className={`p-4 mb-4 rounded-md ${actionMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
          {actionMessage.text}
        </div>
      )}

      {/* Session actions - Only show for active sessions */}
      {session.status === "scheduled" && (
        <div className="my-6 border-t border-b border-gray-200 dark:border-gray-700 py-4">
          <h4 className="font-medium mb-3">Session Actions:</h4>
          <div className="flex flex-wrap gap-3">
            {/* Complete Session Button - Only for mentors */}
            {isMentor && (
              <button
                onClick={handleCompleteSession}
                disabled={processing}
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaCheckCircle className="mr-2" />
                )}
                Mark as Completed
              </button>
            )}
            
            {/* Cancel Session Button - For both mentor and mentee */}
            <button
              onClick={handleCancelSession}
              disabled={processing}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaBan className="mr-2" />
              )}
              Cancel Session
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {isMentor 
              ? "Completing the session will release the payment to your account. Cancelling will refund the mentee."
              : "Cancelling the session will refund your payment."}
          </p>
        </div>
      )}

      {session.notes && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Session Notes:</h4>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
            {session.notes}
          </p>
        </div>
      )}

      {/* Display the session rating if it exists */}
      {rated && sessionRating && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center mb-4">
            <FaStar className="text-yellow-400 mr-2" />
            <h4 className="text-lg font-medium">Session Review</h4>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                {renderStars(sessionRating.score)}
                <p className="font-medium mt-2">
                  {isMentor ? "Mentee's Rating:" : "Your Rating:"}
                </p>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {formatDate(sessionRating.date)}
              </div>
            </div>
            {sessionRating.review && (
              <div className="mt-3">
                <p className="text-gray-700 dark:text-gray-300">{sessionRating.review}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isMentee && isCompleted && isPaid && !rated && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center mb-4">
            <FaStar className="text-yellow-400 mr-2" />
            <h4 className="text-lg font-medium">Session Review</h4>
          </div>
          <ReviewForm
            sessionId={sessionId}
            mentorId={session.mentorId}
            menteeId={currentUserId}
            onReviewSubmitted={() => {
              // Refetch the session details to update the UI with the new review
              fetchSessionDetails();
            }}
          />
        </div>
      )}

      {rated === false && !isMentee && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-gray-600 dark:text-gray-400 italic">This session has not been rated yet.</p>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
