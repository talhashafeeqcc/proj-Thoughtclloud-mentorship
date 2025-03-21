import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMentorProfileById } from '../services/userService';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import MentorProfile from '../components/mentor/MentorProfile';
import AvailabilityCalendar from '../components/dashboard/AvailabilityCalendar';
import BookingModal from '../components/BookingModal';
import { AvailabilitySlot, Session } from '../types';

const MentorProfilePage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookSession } = useSession();
  
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!mentorId) return;
      
      setLoading(true);
      setError(null);
      try {
        const profile = await getMentorProfileById(mentorId);
        setMentor(profile);
      } catch (err: any) {
        setError(err.message || 'Failed to load mentor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchMentorProfile();
  }, [mentorId]);

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmBooking = async (slot: AvailabilitySlot) => {
    if (!user || !mentor) {
      setBookingError('You must be logged in to book a session');
      return;
    }

    setBookingError(null);
    
    try {
      // Create session data from the selected slot
      const sessionData: Omit<Session, 'id' | 'status' | 'paymentStatus'> = {
        mentorId: mentor.id,
        menteeId: user.id,
        mentorName: mentor.name,
        menteeName: user.name,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: `Session with ${mentor.name}`,
        availabilitySlotId: slot.id,
        paymentAmount: mentor.sessionPrice || 0,
        notes: ''
      };

      // Book the session
      await bookSession(sessionData);
      
      // Close modal and show success message
      setIsModalOpen(false);
      setBookingSuccess(true);
      
      // Reset selected slot
      setSelectedSlot(null);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book session');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading mentor profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!mentor) {
    return <div className="container mx-auto p-4">Mentor not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <MentorProfile mentor={mentor} />
          
          {bookingSuccess && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
              Session booked successfully! Redirecting to your dashboard...
            </div>
          )}
          
          {bookingError && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
              Error: {bookingError}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
          <p className="mb-4">Select an available time slot to book a session with {mentor.name}.</p>
          <AvailabilityCalendar 
            mentorId={mentor.id} 
            onSlotSelect={handleSlotSelect} 
          />
        </div>
      </div>

      <BookingModal 
        isOpen={isModalOpen} 
        slot={selectedSlot} 
        onClose={handleCloseModal} 
        onConfirm={handleConfirmBooking} 
      />
    </div>
  );
};

export default MentorProfilePage;
