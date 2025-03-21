import React, { useState } from 'react';
    import { MentorProfile, Session } from '../../types';
    import { Link } from 'react-router-dom';
    import { bookSession } from '../../services/sessionService';
    import { useAuth } from '../../context/AuthContext';
    import BookingModal from '../BookingModal'; // Import the modal

    interface MentorCardProps {
      mentor: MentorProfile;
    }

    const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
      const [showModal, setShowModal] = useState(false);
      const [bookingSuccess, setBookingSuccess] = useState(false);
      const [bookingError, setBookingError] = useState<string | null>(null);
      const { authState } = useAuth();

      const handleBookSession = async (date: string, startTime: string, endTime: string) => {

        if (!authState.user) {
          setBookingError('You must be logged in to book a session.');
          setShowModal(false);
          return;
        }

        const newSession: Omit<Session, 'id'> = {
          mentorId: mentor.id,
          menteeId: authState.user.id,
          mentorName: mentor.name,
          menteeName: authState.user.name,
          date,
          startTime,
          endTime,
          status: 'upcoming',
          title: `Session with ${mentor.name}`,
        };

        try {
          const session = await bookSession(newSession);
          console.log('Booked session:', session);
          setBookingSuccess(true);
          setShowModal(false);
        } catch (error: any) {
          setBookingError(error.message);
        }
      };

      return (
        <div className="bg-white rounded-lg shadow-md p-4">
          <img src={mentor.profilePicture || 'https://via.placeholder.com/150'} alt={mentor.name} className="w-full h-32 object-cover rounded-md mb-4" />
          <h2 className="text-lg font-semibold">{mentor.name}</h2>
          <p className="text-gray-600 mb-2">{mentor.expertise?.join(', ') || 'No expertise listed'}</p>
          <Link to={`/mentors/${mentor.id}`} className="text-blue-500 hover:underline block mb-2">View Profile</Link>

          <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Book Session
          </button>

          {bookingSuccess && (
            <div className="mt-2 text-green-600">Session booked successfully!</div>
          )}
          {bookingError && (
            <div className="mt-2 text-red-600">{bookingError}</div>
          )}

          <BookingModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onBook={handleBookSession}
            mentorName={mentor.name}
          />
        </div>
      );
    };

    export default MentorCard;
