import React, { useState, useEffect } from "react";
import { createRating, hasSessionRating } from "../services/ratingService";
import { FaStar, FaRegStar, FaSpinner, FaCheckCircle } from "react-icons/fa";

interface ReviewFormProps {
  sessionId: string;
  mentorId: string;
  menteeId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  sessionId,
  mentorId,
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
      <div className="w-full bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="text-center text-gray-700">
          <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
          <p>You've already submitted a review for this session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Rate Your Session
      </h3>

      {success ? (
        <div className="text-center py-4">
          <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-700">
            Thank you for your feedback!
          </p>
          <p className="text-gray-600 mt-1">
            Your review helps other mentees choose the right mentor.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={() => handleStarHover(0)}
                  aria-label={`Rate ${star} stars`}
                  className="text-2xl focus:outline-none"
                >
                  {star <= (hoveredStar || score) ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-gray-400" />
                  )}
                </button>
              ))}
              <span className="ml-2 text-gray-600">
                {score > 0 ? `${score} out of 5` : "Select a rating"}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="review" className="block text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this mentor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;
