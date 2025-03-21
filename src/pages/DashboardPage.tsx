import React from 'react';
import { useAuth } from '../context/AuthContext';
import MentorDashboard from '../components/dashboard/MentorDashboard';
import MenteeDashboard from '../components/dashboard/MenteeDashboard';
import ProfileSettings from '../components/dashboard/ProfileSettings';

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();

  if (!authState.user) {
    return <div>Loading...</div>; // Or redirect to login
  }

  return (
    <div className="container mx-auto p-4">
      {authState.user.role === 'mentor' ? (
        <MentorDashboard />
      ) : (
        <MenteeDashboard />
      )}
      <ProfileSettings />
    </div>
  );
};

export default DashboardPage;
