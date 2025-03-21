import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMentorProfileById } from '../../services/userService';
import { MentorProfile as IProfile, Session } from '../../types';
import { bookSession } from '../../services/sessionService';
import { useAuth } from '../../context/AuthContext';
import BookingModal from '../BookingModal';

const MentorProfile: React.FC<{ mentor?: IProfile }> = ({ mentor: propsMentor }) => {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<IProfile | null>(propsMentor || null);
  const [loading, setLoading] = useState(!propsMentor);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const { authState } = useAuth();

  useEffect(() => {
    // If mentor is provided via props, use that
    if (propsMentor) {
      setMentor(propsMentor);
      setLoading(false);
      return;
    }

    // Otherwise fetch mentor data
    const fetchMentor = async () => {
      try {
        if (id) {
          const data = await getMentorProfileById(id);
          setMentor(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [id, propsMentor]);

  const handleBookSession = async (date: string, startTime: string, endTime: string) => {
    if (!authState.user) {
      setBookingError('You must be logged in to book a session.');
      setShowModal(false);
      return;
    }

    if (!mentor) {
      setBookingError('Mentor data not loaded.');
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

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!mentor) {
    return <div>Mentor not found.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{mentor.name}</h1>
      <img src={mentor.profilePicture || 'https://via.placeholder.com/150'} alt={mentor.name} className="w-40 h-40 object-cover rounded-full mb-4" />
      <p className="text-gray-600 mb-2">Expertise: {mentor.expertise?.join(', ') || 'No expertise listed'}</p>
      <p className="mb-4">Bio: {mentor.bio || 'No bio available.'}</p>
      <h2 className="text-xl font-semibold mb-2">Education</h2>
      {mentor.education && mentor.education.length > 0 ? (
        <ul>
          {mentor.education.map((edu) => (
            <li key={edu.id} className="mb-2">
              {edu.degree} in {edu.fieldOfStudy} at {edu.institution} ({edu.from} - {edu.to})
            </li>
          ))}
        </ul>
      ) : (
        <p>No education information available.</p>
      )}
      <h2 className="text-xl font-semibold mb-2">Work Experience</h2>
      {mentor.workExperience && mentor.workExperience.length > 0 ? (
        <ul>
          {mentor.workExperience.map((work) => (
            <li key={work.id} className="mb-2">
              {work.position} at {work.company} ({work.from} - {work.to || 'Present'})
            </li>
          ))}
        </ul>
      ) : (
        <p>No work experience information available.</p>
      )}

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

export default MentorProfile;
