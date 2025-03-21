import React, { useState, useEffect } from "react";
import { MentorProfile } from "../../types";
import MentorCard from "./MentorCard";
import { getMentors } from "../../services/mentorService";
import { getDatabase } from "../../services/database/db";

const MentorList: React.FC = () => {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await getDatabase();
      } catch (err: any) {
        console.error("Error initializing database:", err);
        setError(err.message || "Failed to initialize database");
        setLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch mentors from service
        const mentorData = await getMentors();
        setMentors(mentorData);
      } catch (err: any) {
        console.error("Error fetching mentors:", err);
        setError(err.message || "Failed to load mentors");
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [refreshKey]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1); // Increment refresh key to trigger useEffect
  };

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise?.some((e: string) =>
        e.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-semibold">Loading mentors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Find a Mentor</h1>
        <button
          onClick={handleRefresh}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or expertise..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search mentors"
        />
      </div>

      {filteredMentors.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">
            No mentors found matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorList;
