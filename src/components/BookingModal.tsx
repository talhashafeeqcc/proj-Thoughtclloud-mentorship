import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendar, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { bookSession } from '../services/sessionService';
import { AvailabilitySlot } from '../types';

interface BookingModalProps {
  show: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  onBook: (availabilitySlotId: string) => void;
  selectedSlot?: AvailabilitySlot | null; // Optional selectedSlot prop
}

const BookingModal: React.FC<BookingModalProps> = ({ show, onClose, mentorId, mentorName, onBook, selectedSlot }) => {
  const [error, setError] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null);


  const simulatePayment = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsPaymentProcessing(true);
      setPaymentSuccess(null); // Reset payment status
      setTimeout(() => {
        // Simulate successful payment 80% of the time
        const isSuccessful = Math.random() < 0.8;
        setIsPaymentProcessing(false);
        setPaymentSuccess(isSuccessful);
        resolve(isSuccessful);
      }, 2000); // Simulate payment processing for 2 seconds
    });
  };


  const handleBook = async () => {
    if (!selectedSlot) {
      setError('No time slot selected.');
      return;
    }
    setError(null);

    const paymentSuccessful = await simulatePayment();
    if (paymentSuccessful) {
      try {
        await bookSession({
          mentorId: mentorId,
          menteeId: '2', // Assuming current user is always mentee with ID '2' for now
          mentorName: mentorName,
          menteeName: 'Jane Mentee', // Assuming current user is always Jane Mentee for now
          date: selectedSlot.date, // Use date from selectedSlot
          startTime: selectedSlot.startTime, // Use startTime from selectedSlot
          endTime: selectedSlot.endTime,     // Use endTime from selectedSlot
          status: 'upcoming',
          title: 'Mentoring Session',
          availabilitySlotId: selectedSlot.id,
        });
        onBook(selectedSlot.id); // Call onBook to handle UI update in parent component
      } catch (bookingError: any) {
        setError(bookingError.message || 'Failed to book session.');
        setPaymentSuccess(false); // Payment might be successful, but booking failed
      }
    } else {
      setError('Payment failed. Please try again.');
    }
  };

  if (!show) {
    return null;
  }


  if (error) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center text-red-600">{error}</div>;
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Book Session with {mentorName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Time slot display - now displaying date, start and end times */}
        {selectedSlot && (
          <div className="mb-4">
            <p className="block text-gray-700 flex items-center"><FaClock className="mr-2" /> Selected Time Slot:</p>
            <p className="font-semibold">
              {new Date(selectedSlot.date).toLocaleDateString()} <br />
              {selectedSlot.startTime} - {selectedSlot.endTime}
            </p>
          </div>
        )}


        {error && <div className="text-red-600 mb-4 flex items-center"><FaExclamationTriangle className="mr-2" />{error}</div>}

        {isPaymentProcessing && <div className="mb-4 text-blue-500">Processing Payment...</div>}

        {paymentSuccess === true && (
          <div className="mb-4 text-green-600 flex items-center"><FaCheckCircle className="mr-2" /> Payment Successful! Booking session...</div>
        )}

        {paymentSuccess === false && (
          <div className="mb-4 text-red-600 flex items-center"><FaExclamationTriangle className="mr-2" /> Payment Failed. Please try again.</div>
        )}


        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            disabled={isPaymentProcessing} // Disable cancel during payment
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isPaymentProcessing || paymentSuccess === true || !selectedSlot} // Disable book during payment or after success or if no slot selected
          >
            Book & Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
