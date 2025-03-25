import React, { useState } from "react";
import { AvailabilitySlot } from "../types";
import { useNavigate } from "react-router-dom";

interface BookingModalProps {
  show: boolean;
  selectedSlot: AvailabilitySlot;
  onClose: () => void;
  onBook: () => Promise<string>;
  mentorId: string;
  mentorName: string;
  sessionPrice?: number;
}

const BookingModal: React.FC<BookingModalProps> = ({
  show,
  selectedSlot,
  onClose,
  onBook,
  // mentorId,
  mentorName,
  sessionPrice = 0,
}) => {
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);
  
  if (!show || !selectedSlot) {
    return null; // Don't render anything if the modal is closed or no slot is selected
  }

  const formattedDate = new Date(selectedSlot.date).toLocaleDateString();

  const handleConfirmBooking = async () => {
    if (isBooking) return; // Prevent multiple submissions
    
    setIsBooking(true);
    try {
      // Call onBook and wait for the session ID
      const newSessionId = await onBook();
      console.log("Session created with ID:", newSessionId);
      
      // Close the modal
      onClose();
      
      // Redirect to payment page with the session ID
      navigate(`/payment/${newSessionId}`);
    } catch (error) {
      console.error("Error during booking:", error);
      // Error will be displayed by the parent component
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className="fixed z-10 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Confirm Booking with {mentorName}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Date: {formattedDate}
                  </p>
                  <p className="text-sm text-gray-500">
                    Time: {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                  {sessionPrice > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Session Price:{" "}
                      <span className="font-medium">
                        ${sessionPrice.toFixed(2)}
                      </span>
                    </p>
                  )}
                  <div className="mt-4 text-sm text-gray-500">
                    <p>By confirming this booking:</p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>You'll be redirected to the payment page</li>
                      <li>The session will be added to your calendar</li>
                      <li>You'll receive a confirmation email</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isBooking}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${isBooking ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleConfirmBooking}
            >
              {isBooking ? 'Processing...' : 'Confirm Booking'}
            </button>
            <button
              type="button"
              disabled={isBooking}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
