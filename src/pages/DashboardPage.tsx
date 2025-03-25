import React from "react";
import { useAuth } from "../context/AuthContext";
import MentorDashboard from "../components/dashboard/MentorDashboard";
import MenteeDashboard from "../components/dashboard/MenteeDashboard";

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();

  if (!authState.user) {
    return <div>Loading...</div>; // Or redirect to login
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {authState.user.role === "mentor" ? (
        <MentorDashboard />
      ) : (
        <MenteeDashboard />
      )}
    </div>
  );
};

export default DashboardPage;
