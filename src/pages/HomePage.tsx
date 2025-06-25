import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMentors } from "../services/userService";
import { Mentor } from "../types";
import { motion } from "framer-motion";

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
    <div className="min-h-screen dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-4 md:py-24 px-4 bg-gradient-to-br from-indigo-700 via-purple-700 to-purple-800 dark:from-indigo-900 dark:via-purple-900 dark:to-purple-950 text-white shadow-xl overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated circles */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-300 dark:bg-purple-400 rounded-full blur-2xl"
          ></motion.div>
          
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2],
              x: [0, 20, 0]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-400 dark:bg-indigo-500 rounded-full blur-2xl"
          ></motion.div>
          
          {/* Additional floating bubbles */}
          <motion.div 
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.1, 0.2, 0.1],
              y: [0, -30, 0]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-300 dark:bg-pink-400 rounded-full blur-xl"
          ></motion.div>
          
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [0, -25, 0],
              y: [0, 15, 0]
            }}
            transition={{ 
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-1/3 right-1/3 w-48 h-48 bg-yellow-300 dark:bg-yellow-400 rounded-full blur-xl"
          ></motion.div>
          
          {/* Geometric shapes */}
          <motion.div 
            animate={{ 
              rotate: [0, 10, 0],
              y: [0, -15, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-32 right-1/4 w-32 h-32 border-4 border-white/20 rounded-xl"
          ></motion.div>
          
          <motion.div 
            animate={{ 
              rotate: [0, -5, 0],
              x: [0, 10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-20 left-1/3 w-20 h-20 border-4 border-white/20 rounded-full"
          ></motion.div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: Math.random() * 0.5 + 0.2
                }}
                animate={{ 
                  y: [0, "-20px", 0, "20px", 0],
                  opacity: [
                    Math.random() * 0.3 + 0.2,
                    Math.random() * 0.4 + 0.4,
                    Math.random() * 0.3 + 0.2,
                    Math.random() * 0.4 + 0.4,
                    Math.random() * 0.3 + 0.2
                  ]
                }}
                transition={{ 
                  duration: Math.random() * 10 + 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 bg-white rounded-full shadow-sm"
              ></motion.div>
            ))}
          </div>
        </div>

        {/* Content container */}
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-5 gap-10 items-center">
            {/* Left side content */}
            <div className="md:col-span-3 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-2 inline-block px-3 py-1 text-sm bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
              >
                <span className="mr-1 text-purple-200">✨</span> Connect with industry experts
              </motion.div>
            
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Find Your Perfect <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-300 dark:to-indigo-300">
                  Mentor
                </span>
                <span className="text-white/40 ml-1 animate-pulse">_</span>
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <p className="text-xl md:text-2xl mb-2 max-w-2xl font-light leading-relaxed text-indigo-100 dark:text-indigo-200">
                  Connect with experienced professionals who can guide you through your
                  career journey
                </p>
                
                {/* Eye-catching quote */}
                <div className="my-6 border-l-4 border-purple-400 pl-4 py-1 max-w-xl">
                  <p className="text-lg italic text-purple-100 dark:text-purple-200">
                    "The right mentor can help you avoid years of trial and error, shortening your path to success."
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center gap-5 mt-8"
              >
                <Link
                  to="/mentors"
                  className="group bg-white text-indigo-700 hover:bg-indigo-50 dark:bg-white/95 dark:hover:bg-white px-8 py-4 rounded-xl font-medium text-lg shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-indigo-200 focus:ring-opacity-50 focus:outline-none relative overflow-hidden"
                >
                  <span className="relative z-10">Find a Mentor</span>
                  <span className="absolute top-0 -right-10 w-20 h-20 bg-indigo-100 dark:bg-indigo-200 rotate-45 transform -translate-y-8 translate-x-2 group-hover:translate-x-1 group-hover:-translate-y-7 transition-transform duration-500"></span>
                </Link>
                <Link
                  to="/register"
                  className="group bg-purple-700 hover:bg-purple-800 text-white dark:bg-purple-800 dark:hover:bg-purple-900 px-8 py-4 rounded-xl font-medium text-lg shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-white focus:ring-opacity-30 focus:outline-none border border-purple-500 dark:border-purple-600 relative overflow-hidden"
                >
                  <span className="relative z-10">Become a Mentor</span>
                  <span className="absolute top-0 -right-10 w-20 h-20 bg-purple-600 dark:bg-purple-700 rotate-45 transform -translate-y-8 translate-x-2 group-hover:translate-x-1 group-hover:-translate-y-7 transition-transform duration-500"></span>
                </Link>
              </motion.div>
            </div>
            
            {/* Right side - Floating cards */}
            <div className="md:col-span-2 hidden md:block relative h-96">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="absolute z-30 right-10 top-10"
              >
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 w-64">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">J</div>
                    <div className="ml-3">
                      <div className="text-white font-medium">Jane Smith</div>
                      <div className="text-xs text-purple-200">Senior Developer • 4.9 ⭐</div>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-100">"I've mentored over 50 developers in the past 3 years, helping them achieve their career goals."</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                className="absolute z-20 left-0 top-32"
              >
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 w-64">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">M</div>
                    <div className="ml-3">
                      <div className="text-white font-medium">Michael Chen</div>
                      <div className="text-xs text-purple-200">UX Designer • 4.8 ⭐</div>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-100">"My mentee doubled his salary within a year following our design portfolio overhaul."</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 }}
                className="absolute z-10 right-20 bottom-0"
              >
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 w-64">
                  <div className="text-center py-2">
                    <div className="text-4xl font-bold text-white mb-1">500+</div>
                    <div className="text-purple-200 text-sm">Successful Mentorships</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Stats bar - visible on mobile and desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="max-w-5xl mx-auto mt-12 md:mt-16 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 relative z-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {[
              { number: "500+", label: "Mentors" },
              { number: "2,400+", label: "Sessions" },
              { number: "96%", label: "Satisfaction" },
              { number: "45+", label: "Industries" }
            ].map((stat, i) => (
              <div key={i} className="py-4 px-2 text-center">
                <div className="text-2xl font-bold text-white">{stat.number}</div>
                <div className="text-sm text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* How It Works */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
        >
          How It <span className="text-indigo-600 dark:text-indigo-400">Works</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              step: 1,
              title: "Find a Mentor",
              desc: "Browse our diverse community of experienced mentors across various fields and industries."
            },
            {
              step: 2,
              title: "Book a Session",
              desc: "Schedule a one-on-one session at a time that works for both you and your mentor."
            },
            {
              step: 3,
              title: "Grow Together",
              desc: "Connect, learn, and develop your skills with personalized guidance from your mentor."
            }
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-soft dark:shadow-soft-dark hover:shadow-xl dark:hover:shadow-card-dark transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="absolute -top-5 left-5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {item.step}
            </div>
              <h3 className="text-xl font-semibold mb-4 mt-2 text-gray-800 dark:text-gray-100">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-700 dark:to-purple-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative px-6 py-16 md:p-12 z-10">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
            >
              Benefits of Mentorship
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🚀", title: "Accelerated Growth", desc: "Learn from others' experiences to avoid common pitfalls and fast-track your professional development." },
                { icon: "🧠", title: "Expanded Perspective", desc: "Gain valuable insights and new ways of thinking that can transform your approach to challenges." },
                { icon: "🤝", title: "Network Expansion", desc: "Connect with industry leaders and gain access to a broader professional network." },
                { icon: "💡", title: "Goal Clarity", desc: "Define clearer career objectives and create actionable plans to achieve them." }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-white hover:bg-white/15 transition-all duration-300 border border-white/5"
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mt-12"
            >
            <Link
              to="/mentors"
                className="bg-white text-indigo-700 hover:bg-indigo-50 dark:bg-white/95 dark:hover:bg-white px-8 py-3 rounded-lg font-medium shadow-lg inline-block transform transition-all hover:scale-105 focus:ring-4 focus:ring-white focus:ring-opacity-30 focus:outline-none"
            >
              Start Your Journey
            </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-16 md:py-24 px-4 container mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
        >
          Featured <span className="text-indigo-600 dark:text-indigo-400">Mentors</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading mentors...</p>
            </div>
          ) : featuredMentors.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">No mentors available at the moment.</p>
            </div>
          ) : (
            featuredMentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-soft-dark hover:shadow-xl dark:hover:shadow-card-dark transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="relative h-48 overflow-hidden">
                  {mentor.profilePicture ? (
                    <img
                      src={mentor.profilePicture}
                      alt={mentor.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${mentor.profilePicture ? 'hidden' : ''}`}>
                    <span className="text-white text-6xl font-bold">
                      {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{mentor.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {mentor.expertise?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/mentors/${mentor.id}`}
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-opacity-50"
                  >
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            to="/mentors"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 px-8 py-3 rounded-lg shadow-lg font-medium transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-opacity-50"
          >
            View All Mentors
          </Link>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 md:py-24 container mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
        >
          What Our <span className="text-indigo-600 dark:text-indigo-400">Users Say</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {[
            {
              image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
              name: "Jane Mentee",
              role: "Frontend Developer",
              quote: "Working with my mentor has been transformative for my career. I've gained confidence and skills that helped me land my dream job."
            },
            {
              image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
              name: "John Mentee",
              role: "Data Scientist",
              quote: "The guidance I received helped me navigate complex career decisions with confidence. My mentor provided insights I couldn't have gained elsewhere."
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft dark:shadow-soft-dark border border-gray-100 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-card-dark transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-300 dark:ring-indigo-500"
              />
              <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white text-lg">{testimonial.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="mt-4 flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-700 dark:from-indigo-700 dark:to-purple-800 rounded-2xl shadow-xl overflow-hidden border border-indigo-500/20 dark:border-indigo-600/20"
        >
          <div className="px-6 py-12 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Transform Your Career?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join our community today and connect with mentors who can help you achieve your professional goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-50 dark:bg-white/95 dark:hover:bg-white px-8 py-3 rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
            >
              Sign Up Now
            </Link>
            <Link
              to="/mentors"
                className="bg-transparent hover:bg-white/10 text-white border border-white/80 px-8 py-3 rounded-lg font-medium transition-all hover:border-white"
            >
                Explore Mentors
            </Link>
          </div>
        </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
