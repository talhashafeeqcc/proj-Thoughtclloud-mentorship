import React, { useState, useEffect } from 'react';
import { MentorProfile as MentorProfileType, Rating } from '../../types';
import { FaStar, FaGraduationCap, FaBriefcase, FaCertificate, FaComment } from 'react-icons/fa';

interface MentorProfileProps {
  mentor: Partial<MentorProfileType>;
}

const MentorProfile: React.FC<MentorProfileProps> = ({ mentor }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Add debugging logs
  useEffect(() => {
    console.log('MentorProfile component mounted with mentor:', mentor);
    console.log('Ratings available:', mentor.ratings);
    console.log('Average rating:', mentor.averageRating);
  }, [mentor]);

  // Calculate average rating, use the provided averageRating or calculate it
  const averageRating = mentor.averageRating !== undefined
    ? mentor.averageRating
    : (mentor.ratings && mentor.ratings.length > 0
      ? mentor.ratings.reduce((sum, rating) => sum + rating.score, 0) / mentor.ratings.length
      : 0);

  // Sort ratings by date (newest first)
  const sortedRatings = mentor.ratings && Array.isArray(mentor.ratings)
    ? [...mentor.ratings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  console.log('Sorted ratings:', sortedRatings);

  // Show only first 3 reviews unless "show all" is clicked
  const displayedRatings = showAllReviews ? sortedRatings : sortedRatings.slice(0, 3);

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render stars for a given rating
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-card-dark overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      {/* Header with profile picture and basic info */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <img
              src={mentor.profilePicture || 'https://via.placeholder.com/150'}
              alt={`${mentor.name}'s profile`}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-200 object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{mentor.name}</h1>
            {mentor.expertise && (
              <div className="flex flex-wrap mt-2">
                {mentor.expertise.map((skill, index) => (
                  <span key={index} className="bg-blue-700 dark:bg-blue-900 text-white text-xs px-2 py-1 rounded-full mr-2 mb-2">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {averageRating > 0 && (
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'
                        }`}
                    />
                  ))}
                </div>
                <span className="ml-2">
                  {averageRating.toFixed(1)} ({mentor.ratings?.length || 0} reviews)
                </span>
              </div>
            )}
            {mentor.sessionPrice !== undefined && (
              <div className="mt-2 bg-blue-700 dark:bg-blue-900 rounded-lg px-4 py-2 inline-block">
                <p className="text-xl font-semibold">${mentor.sessionPrice}/hour</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">About Me</h2>
        <p className="text-gray-700 dark:text-gray-300">{mentor.bio || 'No bio available.'}</p>
      </div>

      {/* Education */}
      {mentor.education && mentor.education.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FaGraduationCap className="mr-2" /> Education
          </h2>
          <div className="space-y-4">
            {mentor.education.map((edu) => (
              <div key={edu.id} className="flex">
                <div className="mr-4">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{edu.institution}</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {edu.degree} in {edu.field}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {mentor.workExperience && mentor.workExperience.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FaBriefcase className="mr-2" /> Work Experience
          </h2>
          <div className="space-y-4">
            {mentor.workExperience.map((exp) => (
              <div key={exp.id} className="flex">
                <div className="mr-4">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{exp.position}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{exp.company}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {mentor.certifications && mentor.certifications.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FaCertificate className="mr-2" /> Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentor.certifications.map((cert) => (
              <div key={cert.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white">{cert.name}</h3>
                <p className="text-gray-700 dark:text-gray-300">Issued by {cert.issuer}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {cert.date}
                  {cert.expiryDate && ` - Expires: ${cert.expiryDate}`}
                </p>
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 inline-block"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <FaComment className="mr-2" /> Reviews
        </h2>

        {sortedRatings.length > 0 ? (
          <div>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mr-4">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex mb-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    Based on {mentor.ratings?.length} reviews
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {displayedRatings.map((rating: Rating) => (
                <div key={rating.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      {renderStars(rating.score)}
                      <p className="font-medium mt-2 text-gray-800 dark:text-white">Anonymous Mentee</p>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      {formatDate(rating.date)}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{rating.review}</p>
                </div>
              ))}
            </div>

            {sortedRatings.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="mt-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {showAllReviews ? 'Show fewer reviews' : `Show all ${sortedRatings.length} reviews`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">No reviews yet.</div>
        )}
      </div>
    </div>
  );
};

export default MentorProfile;
