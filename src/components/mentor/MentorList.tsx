import React, { useState, useEffect } from "react";
import { MentorProfile } from "../../types";
import MentorCard from "./MentorCard";
import { getMentors } from "../../services/mentorService";
import { getDatabase } from "../../services/database/db";
import { motion } from "framer-motion";
import { Search, RefreshCw, AlertCircle, Users } from "lucide-react";

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
      mentor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise?.some((e: string) =>
        e?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading mentors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto px-4 py-8"
      >
        <div
          className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-5 rounded-lg shadow-sm relative mb-6 flex items-start"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-semibold">Error: </strong>
            <span>{error}</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRefresh}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm inline-flex items-center transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or expertise..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            aria-label="Search mentors"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {filteredMentors.length}{" "}
            {filteredMentors.length === 1 ? "Mentor" : "Mentors"} Available
          </span>
        </div>
      </div>

      {filteredMentors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <Search className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            No results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            No mentors found matching your search criteria. Try adjusting your
            search or browse all mentors.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            Clear search
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredMentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MentorCard mentor={mentor} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MentorList;
