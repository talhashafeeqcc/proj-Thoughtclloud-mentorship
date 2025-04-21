import React, { useState } from "react";
import { AvailabilitySlot, MentorProfile } from "../types";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  slot: AvailabilitySlot | null;
  mentor: MentorProfile | null;
  onClose: () => void;
  onConfirm: () => Promise<string>;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  slot,
  mentor,
  onClose,
  onConfirm
}) => {
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen || !slot || !mentor) {
    return null; // Don't render anything if the modal is closed or no slot/mentor is selected
  }

  const formattedDate = new Date(slot.date).toLocaleDateString();
  const mentorName = mentor.name || 'Mentor';
  const sessionPrice = mentor.sessionPrice || 0;

  const handleConfirmBooking = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBooking) return; // Prevent multiple submissions
    
    setIsBooking(true);
    setError(null);
    
    try {
      // Call onConfirm and wait for the session ID
      const newSessionId = await onConfirm();
      console.log("Session created with ID:", newSessionId);
      
      // Close the modal
      onClose();
      
      // Redirect to payment page with the session ID
      navigate(`/payment/${newSessionId}`);
    } catch (error) {
      console.error("Error during booking:", error);
      // Set the error message from the parent component or a default
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
      
      // Don't close the modal so user can see the error
      setIsBooking(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed z-50 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={onClose}
      >
        {/* Transparent overlay - no background coloring */}
        <div
          className="fixed inset-0 transition-opacity bg-transparent"
          aria-hidden="true"
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3 }}
          className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={handleModalClick}
        >
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                  id="modal-title"
                >
                  Confirm Booking with {mentorName}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Date: {formattedDate}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Time: {slot.startTime} - {slot.endTime}
                  </p>
                  {sessionPrice > 0 && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">
                      Session Price:{" "}
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">
                        ${sessionPrice.toFixed(2)}
                      </span>
                    </p>
                  )}
                  <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium">By confirming this booking:</p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>You'll be redirected to the payment page</li>
                      <li>The session will be added to your calendar</li>
                      <li>You'll receive a confirmation email</li>
                    </ul>
                  </div>
                  
                  {/* Error message display */}
                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        <span className="text-red-700 dark:text-red-300">{error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBooking}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${isBooking ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleConfirmBooking}
            >
              {isBooking ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Confirm Booking'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isBooking}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingModal;
