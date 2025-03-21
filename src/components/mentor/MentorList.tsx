import React, { useState, useEffect } from 'react';
    import { User, MentorProfile } from '../../types';
    import MentorCard from './MentorCard';
    import { getUsers } from '../../services/userService';

    const MentorList: React.FC = () => {
      const [mentors, setMentors] = useState<MentorProfile[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [searchQuery, setSearchQuery] = useState('');

      useEffect(() => {
        const fetchMentors = async () => {
          try {
            const users = await getUsers();
            // Filter users to get only mentors
            const mentorProfiles = users.filter(user => user.role === 'mentor') as MentorProfile[];
            setMentors(mentorProfiles);

          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };

        fetchMentors();
      }, []);

      const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
      };

      const filteredMentors = mentors.filter((mentor) =>
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.expertise?.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
      );


      if (loading) {
        return <div>Loading mentors...</div>;
      }

      if (error) {
        return <div>Error: {error}</div>;
      }

      return (
        <div>
          <h1 className="text-2xl font-bold mb-4">Find a Mentor</h1>
          <input
            type="text"
            placeholder="Search by name or expertise..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="mb-4 p-2 border rounded"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      );
    };

    export default MentorList;
