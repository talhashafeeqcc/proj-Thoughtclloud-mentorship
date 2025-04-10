import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Session } from "../types";
import { getSessionById } from "../services/sessionService";
import { getSessionPayment } from "../services/paymentService";
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
  FaExternalLinkAlt
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

  // Define fetchSessionDetails using useCallback
  const fetchSessionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const sessionData = await getSessionById(sessionId);
      console.log("Fetched session data:", sessionData);
      console.log("Meeting link:", sessionData.meetingLink);
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
          console.log("Found rating for session:", rating);
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
            className={`${star <= score ? 'text-yellow-400' : 'text-gray-300'
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
        <span>Loading session details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-yellow-700 font-medium">Session not found</p>
            <p className="text-sm text-yellow-700">
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 border-b pb-2">
        {session.title || "Mentoring Session"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center mb-2">
            <FaCalendar className="text-gray-500 mr-2" />
            <span className="font-medium">Date:</span>
            <span className="ml-2">{formattedDate}</span>
          </div>

          <div className="flex items-center mb-2">
            <FaClock className="text-gray-500 mr-2" />
            <span className="font-medium">Time:</span>
            <span className="ml-2">
              {session.startTime} - {session.endTime}
            </span>
          </div>

          {isMentee && (
            <div className="flex items-center mb-2">
              <FaUser className="text-gray-500 mr-2" />
              <span className="font-medium">Mentor:</span>
              <Link
                to={`/mentors/${session.mentorId}`}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                {session.mentorName}
              </Link>
            </div>
          )}

          {isMentor && (
            <div className="flex items-center mb-2">
              <FaUser className="text-gray-500 mr-2" />
              <span className="font-medium">Mentee:</span>
              <span className="ml-2">{session.menteeName}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center mb-2">
            <FaDollarSign className="text-gray-500 mr-2" />
            <span className="font-medium">Price:</span>
            <span className="ml-2">${session.paymentAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-center mb-2">
            <span className="font-medium">Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${session.status === "completed"
                ? "bg-green-100 text-green-800"
                : session.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
                }`}
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>

          <div className="flex items-center mb-2">
            <span className="font-medium">Payment:</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${session.paymentStatus === "completed"
                ? "bg-green-100 text-green-800"
                : session.paymentStatus === "refunded"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
                }`}
            >
              {session.paymentStatus.charAt(0).toUpperCase() +
                session.paymentStatus.slice(1)}
            </span>
          </div>

          {paymentInfo && paymentInfo.transactionId && (
            <div className="flex items-center mb-2">
              <FaCheck className="text-green-500 mr-2" />
              <span className="font-medium">Transaction ID:</span>
              <span className="ml-2 text-xs text-gray-600">
                {paymentInfo.transactionId}
              </span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500">Debug: Has meeting link: {session.meetingLink ? 'Yes' : 'No'}</p>
          </div>

          {session.meetingLink && session.meetingLink.length > 0 ? (
            <div className="flex items-start mb-2">
              <FaVideo className="text-gray-500 mr-2 mt-1" />
              <div>
                <span className="font-medium">Meeting Link:</span>
                <div className="ml-2">
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    {session.meetingLink.substring(0, 30)}...
                    <FaExternalLinkAlt className="ml-1 text-xs" />
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to join the Google Meet session
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start mb-2 text-gray-500">
              <FaVideo className="mr-2 mt-1" />
              <div>
                <span className="font-medium">Meeting Link:</span>
                <p className="ml-2 text-sm">No meeting link available for this session.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {session.notes && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Session Notes:</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            {session.notes}
          </p>
        </div>
      )}

      {/* Display the session rating if it exists */}
      {rated && sessionRating && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center mb-4">
            <FaStar className="text-yellow-400 mr-2" />
            <h4 className="text-lg font-medium">Session Review</h4>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                {renderStars(sessionRating.score)}
                <p className="font-medium mt-2">
                  {isMentor ? "Mentee's Rating:" : "Your Rating:"}
                </p>
              </div>
              <div className="text-gray-500 text-sm">
                {formatDate(sessionRating.date)}
              </div>
            </div>
            {sessionRating.review && (
              <div className="mt-3">
                <p className="text-gray-700">{sessionRating.review}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isMentee && isCompleted && isPaid && !rated && (
        <div className="mt-6 border-t pt-4">
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
        <div className="mt-6 border-t pt-4">
          <p className="text-gray-600 italic">This session has not been rated yet.</p>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
