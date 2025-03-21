import React, { useEffect, useState } from 'react';
    import { getSessions } from '../../services/sessionService';
    import { useAuth } from '../../context/AuthContext';
    import { Session } from '../../types';
    import SessionHistory from './SessionHistory';
    import { Link } from 'react-router-dom';

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
          <h2 className="text-xl font-semibold mb-2">My Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <p>No upcoming sessions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold">{session.title}</h3>
                  <p className="text-gray-600">
                    Date: {session.date}
                    <br />
                    Time: {session.startTime} - {session.endTime}
                    <br />
                    Mentor: {session.mentorName}
                    <br />
                    Status: {session.status}
                  </p>
                   <Link to={`/sessions/${session.id}`} className="text-blue-500 hover:underline">View Details</Link>
                </div>
              ))}
            </div>
          )}
          <SessionHistory sessions={pastSessions}/>
        </div>
      );
    };

    export default MenteeDashboard;
