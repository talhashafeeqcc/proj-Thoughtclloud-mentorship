import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSessions } from '../services/sessionService'; // Assuming a getSessionById function
import { Session } from '../types';
import { FaCalendarAlt, FaClock, FaUserTie, FaUserGraduate, FaInfoCircle } from 'react-icons/fa';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        if (id) {
          // You'll need a function to get a session by ID.  For now, I'll filter from existing mock data.
          const allSessions = await getSessions('', 'mentor'); // Fetch all sessions (adjust role as needed)
          const foundSession = allSessions.find(s => s.id === id);

          if (foundSession) {
            setSession(foundSession);
          } else {
            setError('Session not found');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) {
    return <div>Loading session details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!session) {
    return <div>Session not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center"><FaInfoCircle className="mr-2" /> Session Details</h1>
        <div className="text-gray-700">
          <p className="flex items-center mb-2"><FaCalendarAlt className="mr-2" /> Date: {session.date}</p>
          <p className="flex items-center mb-2"><FaClock className="mr-2" /> Time: {session.startTime} - {session.endTime}</p>
          <p className="flex items-center mb-2"><FaUserTie className="mr-2" /> Mentor: {session.mentorName}</p>
          <p className="flex items-center mb-2"><FaUserGraduate className="mr-2" /> Mentee: {session.menteeName}</p>
          <p>Status: {session.status}</p>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
