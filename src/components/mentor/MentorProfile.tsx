import React, { useState } from 'react';
import { Mentor, Rating } from '../../types';
import { FaStar, FaGraduationCap, FaBriefcase, FaCertificate, FaComment } from 'react-icons/fa';

interface MentorProfileProps {
  mentor: Partial<Mentor>;
}

const MentorProfile: React.FC<MentorProfileProps> = ({ mentor }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Calculate average rating
  const averageRating = mentor.ratings && mentor.ratings.length > 0
    ? mentor.ratings.reduce((sum, rating) => sum + rating.score, 0) / mentor.ratings.length
    : 0;

  // Sort ratings by date (newest first)
  const sortedRatings = mentor.ratings 
    ? [...mentor.ratings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  
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
            className={`${
              star <= score ? 'text-yellow-400' : 'text-gray-300'
            } w-4 h-4`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with profile picture and basic info */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <img
              src={mentor.profilePicture || 'https://via.placeholder.com/150'}
              alt={`${mentor.name}'s profile`}
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{mentor.name}</h1>
            {mentor.expertise && (
              <div className="flex flex-wrap mt-2">
                {mentor.expertise.map((skill, index) => (
                  <span key={index} className="bg-blue-700 text-white text-xs px-2 py-1 rounded-full mr-2 mb-2">
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
                      className={`${
                        star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
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
              <div className="mt-2 bg-blue-700 rounded-lg px-4 py-2 inline-block">
                <p className="text-xl font-semibold">${mentor.sessionPrice}/hour</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-4">About Me</h2>
        <p className="text-gray-700">{mentor.bio || 'No bio available.'}</p>
      </div>

      {/* Education */}
      {mentor.education && mentor.education.length > 0 && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaGraduationCap className="mr-2" /> Education
          </h2>
          <div className="space-y-4">
            {mentor.education.map((edu) => (
              <div key={edu.id} className="flex">
                <div className="mr-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p className="text-gray-700">
                    {edu.degree} in {edu.field}
                  </p>
                  <p className="text-gray-500 text-sm">
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
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBriefcase className="mr-2" /> Work Experience
          </h2>
          <div className="space-y-4">
            {mentor.workExperience.map((exp) => (
              <div key={exp.id} className="flex">
                <div className="mr-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold">{exp.position}</h3>
                  <p className="text-gray-700">{exp.company}</p>
                  <p className="text-gray-500 text-sm">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </p>
                  <p className="text-gray-600 mt-1">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {mentor.certifications && mentor.certifications.length > 0 && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaCertificate className="mr-2" /> Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentor.certifications.map((cert) => (
              <div key={cert.id} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{cert.name}</h3>
                <p className="text-gray-700">Issued by {cert.issuer}</p>
                <p className="text-gray-500 text-sm">
                  {cert.date}
                  {cert.expiryDate && ` - Expires: ${cert.expiryDate}`}
                </p>
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-1 inline-block"
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
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaComment className="mr-2" /> Reviews
        </h2>
        
        {sortedRatings.length > 0 ? (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-blue-600 mr-4">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex mb-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <div className="text-gray-600">
                    Based on {mentor.ratings?.length} reviews
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {displayedRatings.map((rating: Rating) => (
                <div key={rating.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      {renderStars(rating.score)}
                      <p className="font-medium mt-2">Anonymous Mentee</p>
                    </div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(rating.date)}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{rating.review}</p>
                </div>
              ))}
            </div>
            
            {sortedRatings.length > 3 && (
              <button 
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="mt-6 text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAllReviews ? 'Show fewer reviews' : `Show all ${sortedRatings.length} reviews`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-gray-500 italic">No reviews yet.</div>
        )}
      </div>
    </div>
  );
};

export default MentorProfile;
