import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MentorProfile } from '../../types';
import BookingModal from '../BookingModal';

interface MentorCardProps {
  mentor: MentorProfile;
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookSession = () => {
    setShowBookingModal(true);
    setBookingSuccess(false); // Reset success state when modal opens
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
  };

  const handleSessionBooked = (availabilitySlotId: string) => {
    console.log('Session booked for slot ID:', availabilitySlotId);
    setShowBookingModal(false);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false); // Clear success message after a delay
    }, 3000); // Success message disappears after 3 seconds
  };


  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img className="w-full h-48 object-cover" src={mentor.profilePicture || 'https://via.placeholder.com/300'} alt={mentor.name} />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{mentor.name}</h3>
        <p className="text-gray-600">{mentor.expertise.join(', ')}</p>
        <div className="mt-4 flex justify-between items-center">
          <Link to={`/mentor/${mentor.id}`} className="text-blue-500 hover:underline">View Profile</Link>
          <button
            onClick={handleBookSession}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Book Session
          </button>
        </div>
        {bookingSuccess && <div className="mt-2 text-green-600">Session booked successfully!</div>}
      </div>

      <BookingModal
        show={showBookingModal}
        onClose={closeBookingModal}
        mentorId={mentor.id}
        mentorName={mentor.name}
        onBook={handleSessionBooked}
      />
    </div>
  );
};

export default MentorCard;
