import React, { useState, useEffect } from "react";
import { createRating, hasSessionRating } from "../services/ratingService";
import { FaStar, FaRegStar, FaSpinner, FaCheckCircle, FaCommentAlt } from "react-icons/fa";
import { motion } from "framer-motion";

interface ReviewFormProps {
  sessionId: string;
  mentorId: string;
  menteeId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  sessionId,
  menteeId,
  onReviewSubmitted,
}) => {
  const [score, setScore] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false);

  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const hasRating = await hasSessionRating(sessionId);
        setAlreadyReviewed(hasRating);
      } catch (err) {
        console.error("Error checking for existing review:", err);
      }
    };

    checkExistingReview();
  }, [sessionId]);

  const handleStarClick = (rating: number) => {
    setScore(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredStar(rating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (score === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createRating({
        sessionId,
        menteeId,
        score,
        review,
        date: new Date().toISOString().split("T")[0],
      });

      setSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyReviewed) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="text-center text-gray-700 dark:text-gray-300">
          <FaCheckCircle className="text-green-500 dark:text-green-400 text-3xl mx-auto mb-2" />
          <p>You've already submitted a review for this session.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <FaCommentAlt className="text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Rate Your Session
        </h3>
      </div>

      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-4"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <FaCheckCircle className="text-green-500 dark:text-green-400 text-4xl mx-auto mb-2" />
          </motion.div>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium text-gray-700 dark:text-gray-200"
          >
            Thank you for your feedback!
          </motion.p>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 mt-1"
          >
            Your review helps other mentees choose the right mentor.
          </motion.p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md border-l-4 border-red-500"
            >
              {error}
            </motion.div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={() => handleStarHover(0)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Rate ${star} stars`}
                  className="text-2xl focus:outline-none"
                >
                  {star <= (hoveredStar || score) ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-gray-400 dark:text-gray-500" />
                  )}
                </motion.button>
              ))}
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {score > 0 ? `${score} out of 5` : "Select a rating"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="review" className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Your Review (Optional)
            </label>
            <motion.textarea
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this mentor..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:text-gray-200"
              rows={4}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-sm transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
};

export default ReviewForm;
