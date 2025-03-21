import React, { useState } from 'react';
import AvailabilityCalendar from './AvailabilityCalendar';
import BookingModal from '../BookingModal';
import { AvailabilitySlot } from '../../types';

const MentorDashboard: React.FC = () => {
  const mentorId = '1'; // Replace with actual mentor ID
  const mentorName = 'John Mentor'; // Replace with actual mentor name
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);


  const openBookingModal = () => {
    setIsBookingModalOpen(true);
    setBookingSuccess(false); // Reset success state when modal opens
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedSlot(null); // Clear selected slot when modal is closed
  };

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      openBookingModal(); // Open booking modal when a slot is selected
    }
  };

  const handleSessionBooked = (availabilitySlotId: string) => {
    console.log('Session booked for slot ID:', availabilitySlotId);
    setIsBookingModalOpen(false);
    setSelectedSlot(null); // Clear selected slot after booking
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false); // Clear success message after a delay
    }, 3000); // Success message disappears after 3 seconds
  };


  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Mentor Dashboard</h2>
      <AvailabilityCalendar mentorId={mentorId} onSlotSelect={handleSlotSelect} />

      {selectedSlot && (
        <BookingModal
          show={isBookingModalOpen}
          onClose={closeBookingModal}
          mentorId={mentorId}
          mentorName={mentorName}
          onBook={handleSessionBooked}
          selectedSlot={selectedSlot} // Pass the entire selectedSlot object
        />
      )}

      {bookingSuccess && <div className="mt-4 text-green-600">Session booked successfully!</div>}
    </div>
  );
};

export default MentorDashboard;
