import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SessionDetails from "../components/SessionDetails";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const SessionDetailsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { authState } = useAuth();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (!sessionId) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6">
        <p className="font-bold">Error</p>
        <p>Session ID is missing from the URL.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Session Details</h1>

      {!authState.user ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Authentication Required</p>
          <p>Please log in to view session details.</p>
        </div>
      ) : (
        <SessionDetails
          sessionId={sessionId}
          currentUserId={authState.user.id}
        />
      )}
    </div>
  );
};

export default SessionDetailsPage;
