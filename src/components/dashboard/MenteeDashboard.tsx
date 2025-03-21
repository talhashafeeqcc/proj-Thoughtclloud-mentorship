import React, { useEffect, useState } from 'react';
import { getSessions } from '../../services/sessionService';
import { useAuth } from '../../context/AuthContext';
import { Session } from '../../types';
import SessionHistory from './SessionHistory';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaUserTie, FaCheckCircle } from 'react-icons/fa';

const MenteeDashboard: React.FC = () => {
  const { authState } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (authState.user?.id) {
          const data = await getSessions(authState.user.id, 'mentee');
          setSessions(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [authState.user]);

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const upcomingSessions = sessions.filter(session => session.status === 'upcoming');
  const pastSessions = sessions.filter(session => session.status === 'completed' || session.status === 'cancelled');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mentee Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center"><FaCalendarAlt className="mr-2" /> My Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p>No upcoming sessions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold">{session.title}</h3>
                <div className="text-gray-600 mt-2">
                  <p className="flex items-center mb-1"><FaCalendarAlt className="mr-2" /> Date: {session.date}</p>
                  <p className="flex items-center mb-1"><FaClock className="mr-2" /> Time: {session.startTime} - {session.endTime}</p>
                  <p className="flex items-center mb-1"><FaUserTie className="mr-2" /> Mentor: {session.mentorName}</p>
                  <p className="flex items-center"><FaCheckCircle className="mr-2" /> Status: {session.status}</p>
                </div>
                <div className="mt-4">
                  <Link to={`/sessions/${session.id}`} className="text-blue-500 hover:underline">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <SessionHistory sessions={pastSessions} />
    </div>
  );
};

export default MenteeDashboard;
