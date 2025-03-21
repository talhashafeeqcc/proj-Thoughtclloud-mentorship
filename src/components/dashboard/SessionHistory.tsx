import React from 'react';
import { Session } from '../../types';

interface SessionHistoryProps {
  sessions: Session[];
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Session History</h2>
      {sessions.length === 0 ? (
        <p>No past sessions.</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
              <h3 className="text-lg font-semibold">{session.title}</h3>
              <p className="text-gray-600">
                Date: {session.date} <br />
                Time: {session.startTime} - {session.endTime} <br />
                Status: {session.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionHistory;
