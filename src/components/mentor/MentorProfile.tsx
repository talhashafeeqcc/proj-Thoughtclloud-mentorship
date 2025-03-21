import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMentor } from '../../services/userService';
import { MentorProfile } from '../../types';
import BookingModal from '../BookingModal';

const MentorProfileComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);


  useEffect(() => {
    const fetchMentor = async () => {
      if (id) {
        try {
          setLoading(true);
          const mentorData = await getMentor(id);
          setMentor(mentorData);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMentor();
  }, [id]);

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


  if (loading) {
    return <div>Loading mentor profile...</div>;
  }

  if (error || !mentor) {
    return <div>Error loading mentor profile: {error}</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <img className="w-24 h-24 rounded-full object-cover mr-4" src={mentor.profilePicture || 'https://via.placeholder.com/150'} alt={mentor.name} />
        <div>
          <h2 className="text-2xl font-bold">{mentor.name}</h2>
          <p className="text-gray-700">{mentor.expertise.join(', ')}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">About Me</h3>
        <p className="text-gray-800">{mentor.bio}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Education</h3>
        <ul>
          {mentor.education.map(edu => (
            <li key={edu.id} className="mb-2">
              <strong>{edu.degree}</strong> in {edu.fieldOfStudy} from {edu.institution} ({edu.from} - {edu.to})
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Work Experience</h3>
        <ul>
          {mentor.workExperience.map(exp => (
            <li key={exp.id} className="mb-2">
              <strong>{exp.position}</strong> at {exp.company} ({exp.from} - {exp.to || 'Present'})
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Certifications</h3>
        <ul>
          {mentor.certifications.map(cert => (
            <li key={cert.id} className="mb-2">
              {cert.name} from {cert.organization} (Issued on {cert.issueDate})
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          onClick={handleBookSession}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Book a Session
        </button>
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

export default MentorProfileComponent;
