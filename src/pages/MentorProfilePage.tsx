import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MentorProfileComponent from '../components/mentor/MentorProfile';

const MentorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">Mentor ID is required</p>
        <Link
          to="/mentors"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
        >
          Back to Mentors
        </Link>
      </div>
    );
  }

  return <MentorProfileComponent />;
};

export default MentorProfilePage;
