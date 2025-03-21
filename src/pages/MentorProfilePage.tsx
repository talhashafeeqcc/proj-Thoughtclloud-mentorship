import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMentorProfileById } from '../services/userService';
import { MentorProfile } from '../types';
import MentorProfile from '../components/mentor/MentorProfile';

const MentorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        if (!id) {
          throw new Error('Mentor ID is required');
        }
        
        const data = await getMentorProfileById(id);
        if (!data) {
          throw new Error('Mentor not found');
        }
        
        setMentor(data);
      } catch (error) {
        console.error('Error fetching mentor profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to load mentor profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMentorProfile();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !mentor) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-6">{error || 'Failed to load mentor profile'}</p>
        <Link 
          to="/mentors" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
        >
          Back to Mentors
        </Link>
      </div>
    );
  }
  
  return <MentorProfile mentor={mentor} />;
};

export default MentorProfilePage;
