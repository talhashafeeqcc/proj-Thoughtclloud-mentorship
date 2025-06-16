import React from "react";
import { Link } from "react-router-dom";
import { MentorProfile } from "../../types";
// import { useAuth } from "../../context/AuthContext";
import { Star, Clock, DollarSign, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        <div className="w-full h-56 overflow-hidden">
          {mentor.profilePicture ? (
            <img
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              src={mentor.profilePicture}
              alt={mentor.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ${mentor.profilePicture ? 'hidden' : ''}`}>
            <span className="text-white text-6xl font-bold">
              {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
            </span>
          </div>
        </div>
        {hasRatings && mentor.ratings && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center bg-black/50 backdrop-blur-sm py-1 px-2 rounded-full">
            <Star className="text-yellow-400 w-4 h-4 mr-1 fill-yellow-400" />
            <span className="text-white font-medium text-sm mr-1">
              {averageRating}
            </span>
            <span className="text-gray-300 text-xs">({mentor.ratings.length})</span>
          </div>
        )}
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="font-semibold text-xl text-gray-900 dark:text-white">{mentor.name}</h3>
        
        {mentor.expertise && mentor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {mentor.expertise.slice(0, 3).map((skill, index) => (
              <span 
                key={index} 
                className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 py-1 px-2 rounded-full"
              >
                {skill}
              </span>
            ))}
            {mentor.expertise.length > 3 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-2 rounded-full">
                +{mentor.expertise.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-3 space-y-2 flex-grow">
          {mentor.yearsOfExperience !== undefined && (
            <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              {mentor.yearsOfExperience > 0
                ? `${mentor.yearsOfExperience} years experience`
                : "New Mentor"}
            </div>
          )}

          {mentor.bio && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
              {mentor.bio}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
            <DollarSign className="w-4 h-4 mr-1" />
            ${mentor.sessionPrice}/session
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={`/mentors/${mentor.id}`}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              View Profile
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
