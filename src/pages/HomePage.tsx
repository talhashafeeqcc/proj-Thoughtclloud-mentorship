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
    <div className="space-y-16 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 px-4 bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-800 dark:to-purple-900 text-white shadow-xl rounded-b-3xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-1/4 w-20 h-20 rounded-full bg-white opacity-10 animate-float"></div>
          <div className="absolute top-40 right-1/3 w-32 h-32 rounded-full bg-white opacity-10 animate-float" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-white opacity-10 animate-float" style={{ animationDelay: "1.5s" }}></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Find Your Perfect Mentor
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto animate-slide-up opacity-0 fill-mode-forwards" style={{ animationDelay: "0.2s" }}>
            Connect with experienced professionals who can guide you through your
            career journey
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up opacity-0 fill-mode-forwards" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/mentors"
              className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-purple-200 dark:text-purple-900 px-8 py-3 rounded-md font-semibold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-glow"
            >
              Find a Mentor
            </Link>
            <Link
              to="/register"
              className="bg-purple-800 hover:bg-purple-900 text-white dark:bg-purple-700 dark:hover:bg-purple-800 px-8 py-3 rounded-md font-semibold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-glow"
            >
              Become a Mentor
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 md:py-20 container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-slide-down">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-glow animate-zoom-in opacity-0 fill-mode-forwards" style={{ animationDelay: "0.1s" }}>
            <div className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Find a Mentor</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Browse our diverse community of experienced mentors across various
              fields and industries.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-glow animate-zoom-in opacity-0 fill-mode-forwards" style={{ animationDelay: "0.3s" }}>
            <div className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Book a Session</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Schedule a one-on-one session at a time that works for both you
              and your mentor.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-glow animate-zoom-in opacity-0 fill-mode-forwards" style={{ animationDelay: "0.5s" }}>
            <div className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Grow Together</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Connect, learn, and develop your skills with personalized guidance
              from your mentor.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-800 dark:to-purple-900 text-white rounded-lg mx-4 md:mx-8 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-slide-down">Benefits of Mentorship</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-xs p-6 rounded-lg animate-scale-in opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.1s" }}>
              <div className="text-3xl mb-4 animate-bounce-slow">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Accelerated Growth</h3>
              <p>Learn from others' experiences to avoid common pitfalls and fast-track your professional development.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-6 rounded-lg animate-scale-in opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.2s" }}>
              <div className="text-3xl mb-4 animate-bounce-slow">🧠</div>
              <h3 className="text-xl font-semibold mb-3">Expanded Perspective</h3>
              <p>Gain valuable insights and new ways of thinking that can transform your approach to challenges.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-6 rounded-lg animate-scale-in opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.3s" }}>
              <div className="text-3xl mb-4 animate-bounce-slow">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Network Expansion</h3>
              <p>Connect with industry leaders and gain access to a broader professional network.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-6 rounded-lg animate-scale-in opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.4s" }}>
              <div className="text-3xl mb-4 animate-bounce-slow">💡</div>
              <h3 className="text-xl font-semibold mb-3">Goal Clarity</h3>
              <p>Define clearer career objectives and create actionable plans to achieve them.</p>
            </div>
          </div>

          <div className="text-center mt-12 animate-slide-up opacity-0 fill-mode-forwards" style={{ animationDelay: "0.5s" }}>
            <Link
              to="/mentors"
              className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-purple-200 dark:text-purple-900 px-8 py-3 rounded-md font-semibold text-lg shadow-md inline-block transform transition-all hover:scale-105 hover:shadow-glow"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-12 px-4 md:py-20 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4 md:mx-8 container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-slide-down">
          Featured Mentors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading mentors...</p>
            </div>
          ) : featuredMentors.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">No mentors available at the moment.</p>
            </div>
          ) : (
            featuredMentors.map((mentor, index) => (
              <div
                key={mentor.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 transform transition-all hover:scale-105 hover:shadow-glow animate-zoom-in opacity-0 fill-mode-forwards"
                style={{ animationDelay: `${0.1 + index * 0.2}s` }}
              >
                <img
                  src={mentor.profilePicture || "https://via.placeholder.com/300x200?text=Mentor"}
                  alt={mentor.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{mentor.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">{mentor.bio?.substring(0, 80)}...</p>
                  <div className="flex flex-wrap mb-3">
                    {mentor.expertise?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-1 rounded mr-2 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/mentors/${mentor.id}`}
                    className="block text-center bg-purple-600 hover:bg-purple-700 bg-opacity-90 text-white py-2 rounded-md transform transition-all hover:scale-105"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-8 animate-slide-up opacity-0 fill-mode-forwards" style={{ animationDelay: "0.7s" }}>
          <Link
            to="/mentors"
            className="inline-block bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-md shadow-lg transform transition-all hover:scale-105 hover:shadow-glow"
          >
            View All Mentors
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 md:py-20 container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-slide-down">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 animate-slide-in-left opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center mb-4">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Jane Mentee"
                className="w-12 h-12 rounded-full mr-4 ring-2 ring-purple-300"
              />
              <div>
                <h4 className="font-semibold">Jane Mentee</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Frontend Developer</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "Working with my mentor has been transformative for my career.
              I've gained confidence and skills that helped me land my dream
              job."
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 animate-slide-in-right opacity-0 fill-mode-forwards hover:shadow-glow transition-all duration-300" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center mb-4">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="John Mentee"
                className="w-12 h-12 rounded-full mr-4 ring-2 ring-purple-300"
              />
              <div>
                <h4 className="font-semibold">John Mentee</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Data Scientist</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">
              "The personalized guidance I received helped me navigate complex career decisions.
              My mentor's industry insights were invaluable in helping me pivot to a new role."
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-800 dark:to-purple-900 text-white rounded-lg mx-4 md:mx-8 mb-16 overflow-hidden relative animate-gradient">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-10 animate-pulse-slow" style={{ animationDelay: "1s" }}></div>

        <div className="max-w-4xl mx-auto text-center animate-fade-in relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Accelerate Your Growth?</h2>
          <p className="text-xl mb-8">
            Join our community today and connect with mentors who can help you reach your full potential.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-purple-200 dark:text-purple-900 px-8 py-3 rounded-md font-semibold text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-glow"
            >
              Sign Up Now
            </Link>
            <Link
              to="/mentors"
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-md font-semibold text-lg shadow-lg transform transition-all hover:scale-105"
            >
              Browse Mentors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
