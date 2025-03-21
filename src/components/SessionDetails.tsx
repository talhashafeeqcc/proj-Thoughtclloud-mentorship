import React, { useEffect, useState } from 'react';
    import { useParams } from 'react-router-dom';
    import { getSessions } from '../services/sessionService'; // Assuming a getSessionById function
    import { Session } from '../types';

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
        <div>
          <h1 className="text-2xl font-bold mb-4">{session.title}</h1>
          <p className="text-gray-600">
            Date: {session.date}
            <br />
            Time: {session.startTime} - {session.endTime}
            <br />
            Mentor: {session.mentorName}
            <br />
            Mentee: {session.menteeName}
            <br />
            Status: {session.status}
          </p>
        </div>
      );
    };

    export default SessionDetails;
