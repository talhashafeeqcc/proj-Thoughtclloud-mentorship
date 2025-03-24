import React from "react";
import { Link } from "react-router-dom";
import { MentorProfile } from "../../types";
// import { useAuth } from "../../context/AuthContext";
import { FaStar } from "react-icons/fa";

// Extended type that includes the yearsOfExperience field
interface EnhancedMentorProfile extends MentorProfile {
  yearsOfExperience?: number;
}

interface MentorCardProps {
  mentor: EnhancedMentorProfile;
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  // const { authState } = useAuth();
  // const isMentee = authState?.user?.role === "mentee";

  // Calculate average rating if ratings exist
  const hasRatings = mentor.ratings && mentor.ratings.length > 0;
  const averageRating =
    hasRatings && mentor.ratings
      ? (
          mentor.ratings.reduce((acc, r) => acc + r.score, 0) /
          mentor.ratings.length
        ).toFixed(1)
      : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        className="w-full h-48 object-cover"
        src={mentor.profilePicture || "https://via.placeholder.com/300"}
        alt={mentor.name}
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{mentor.name}</h3>
        <p className="text-gray-600">
          {mentor.expertise?.join(", ") || "General Mentorship"}
        </p>

        {/* Experience info */}
        {mentor.yearsOfExperience !== undefined && (
          <p className="text-gray-600 text-sm mt-1">
            {mentor.yearsOfExperience > 0
              ? `${mentor.yearsOfExperience} years experience`
              : "New Mentor"}
          </p>
        )}

        {/* Price info */}
        <div className="mt-2 text-blue-600 font-semibold">
          ${mentor.sessionPrice}/session
        </div>

        <div className="flex items-center justify-between mt-4">
          <Link
            to={`/mentors/${mentor.id}`}
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            View Profile
          </Link>

          {/* Show rating with star icon */}
          {hasRatings && mentor.ratings && (
            <div className="flex items-center">
              <FaStar className="text-yellow-500 mr-1" />
              <span className="text-yellow-700 font-bold mr-1">
                {averageRating}
              </span>
              <span className="text-gray-500">({mentor.ratings.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
