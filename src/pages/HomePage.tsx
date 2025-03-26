import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMentors } from "../services/userService";
import { Mentor } from "../types";

const HomePage: React.FC = () => {
  const [featuredMentors, setFeaturedMentors] = useState<Partial<Mentor>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const mentors = await getMentors();
        // Get random 3 mentors for featured section
        const randomMentors = mentors
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setFeaturedMentors(randomMentors);
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Find Your Perfect Mentor
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Connect with experienced professionals who can guide you through your
          career journey
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/mentors"
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-md font-semibold text-lg"
          >
            Find a Mentor
          </Link>
          <Link
            to="/register"
            className="bg-indigo-800 hover:bg-indigo-900 text-white px-8 py-3 rounded-md font-semibold text-lg"
          >
            Become a Mentor
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Find a Mentor</h3>
            <p className="text-gray-600">
              Browse our diverse community of experienced mentors across various
              fields and industries.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Book a Session</h3>
            <p className="text-gray-600">
              Schedule a one-on-one session at a time that works for both you
              and your mentor.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Grow Together</h3>
            <p className="text-gray-600">
              Connect, learn, and develop your skills with personalized guidance
              from your mentor.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-12 bg-gray-100 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">
          Featured Mentors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-8">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading mentors...</p>
            </div>
          ) : featuredMentors.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-600">No mentors available at the moment.</p>
            </div>
          ) : (
            featuredMentors.map((mentor) => (
              <div key={mentor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={mentor.profilePicture || "https://via.placeholder.com/300x200?text=Mentor"}
                  alt={mentor.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{mentor.name}</h3>
                  <p className="text-gray-600 mb-3">{mentor.bio?.substring(0, 80)}...</p>
                  <div className="flex flex-wrap mb-3">
                    {mentor.expertise?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/mentors/${mentor.id}`}
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/mentors"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md"
          >
            View All Mentors
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Jane Mentee"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h4 className="font-semibold">Jane Mentee</h4>
                <p className="text-gray-600 text-sm">Frontend Developer</p>
              </div>
            </div>
            <p className="text-gray-700 italic">
              "Working with my mentor has been transformative for my career.
              I've gained confidence and skills that helped me land my dream
              job."
            </p>
          </div>

          {/* Add more testimonials here */}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
