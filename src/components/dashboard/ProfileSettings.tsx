import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updateUser,
  updateMentorProfile,
  getUserById,
  getMentorByUserId,
  getMenteeByUserId
} from "../../services/userService";
import {
  updateMenteeProfile,
} from "../../services/menteeService";
import { User, MentorProfile } from "../../types";
import PortfolioManager from '../profile/PortfolioManager';
import EducationManager from '../profile/EducationManager';
import CertificationManager from '../profile/CertificationManager';
import WorkExperienceManager from '../profile/WorkExperienceManager';
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUser, 
  FaBriefcase, 
  FaGraduationCap, 
  FaCertificate, 
  FaFolder, 
  FaSave, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from "react-icons/fa";

// Create a more specific combined type with all possible fields
interface FormDataFields {
  // User fields
  id?: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  role?: "mentor" | "mentee" | "admin";

  // Mentor fields
  bio?: string;
  expertise?: string[];
  sessionPrice?: number | string;
  yearsOfExperience?: number;
  portfolio?: any[];
  certifications?: any[];
  education?: any[];
  workExperience?: any[];

  // Mentee fields
  interests?: string[];
  goals?: string[];
  currentPosition?: string;
}

interface ValidationErrors {
  // User validation
  name?: string;
  email?: string;

  // Mentor validation
  bio?: string;
  sessionPrice?: string;
  expertise?: string;

  // Mentee validation
  interests?: string;
  goals?: string;
  currentPosition?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 24
    }
  }
};

const ProfileSettings: React.FC = () => {
  const { authState, updateUser: updateAuthUser } = useAuth();
  const [formData, setFormData] = useState<FormDataFields>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [initialData, setInitialData] = useState<FormDataFields>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [activeSection, setActiveSection] = useState<string>("basic");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!authState.user?.id) {
        console.error("No user ID found in auth state");
        return;
      }

      try {
        setLoading(true);
        setMessage(null);

        console.log("Attempting to fetch profile data for user ID:", authState.user.id);

        // First get the user data
        let userData = await getUserById(authState.user.id);

        // If user data isn't found in the database but exists in auth state
        if (!userData) {
          console.error("getUserById returned null for user ID:", authState.user.id);

          // Show a more specific error message
          setMessage({
            type: "error",
            text: "Your user profile couldn't be found in the database. Please log out and log in again."
          });
          return;
        }

        await processUserData(userData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Failed to load profile data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    // Helper function to process user data and fetch role-specific data
    const processUserData = async (userData: User) => {
      console.log("Processing user data:", userData);

      // Then get role-specific data
      let roleData;
      if (userData.role === "mentor") {
        try {
          roleData = await getMentorByUserId(userData.id);
          if (!roleData) {
            console.log("Mentor profile not found, will create a default one");

            // Use updateMentorProfile to create a default profile
            const defaultMentorData: Partial<MentorProfile> = {
              bio: "",
              expertise: [],
              sessionPrice: 0,
              portfolio: [],
              certifications: [],
              education: [],
              workExperience: []
            };

            roleData = await updateMentorProfile(userData.id, defaultMentorData);

            if (!roleData) {
              throw new Error("Failed to create mentor profile");
            }
          }
        } catch (error) {
          console.error("Error getting/creating mentor profile:", error);
          throw new Error(
            "Failed to create mentor profile. Please try again or contact support."
          );
        }
      } else if (userData.role === "admin") {
        // Admins might not have mentor/mentee-specific profiles
        roleData = { role: "admin" as const };
      } else {
        try {
          roleData = await getMenteeByUserId(userData.id);
          if (!roleData) {
            // Mentee profile not found, will create a default one

            // Use updateMenteeProfile to create a default profile
            const defaultMenteeData = {
              bio: "",
              interests: [],
              goals: [],
              currentPosition: ""
            };

            roleData = await updateMenteeProfile(userData.id, defaultMenteeData);
            if (!roleData) {
              throw new Error("Failed to create mentee profile");
            }
          }
        } catch (error) {
          console.error("Error getting/creating mentee profile:", error);
          throw new Error(
            "Failed to create mentee profile. Please try again or contact support."
          );
        }
      }

      // Combine user and role data
      const combinedData = {
        ...userData,
        ...roleData,
      };

      setFormData(combinedData);
      setInitialData(combinedData);
    };

    fetchProfileData();
  }, [authState.user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Remove JSON field handling - let component managers handle this
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when field is changed
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (
    field: "expertise" | "interests" | "goals",
    value: string
  ) => {
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[field]) ? [...prev[field]!] : [];
      const index = currentArray.indexOf(value);

      if (index === -1) {
        currentArray.push(value);
      } else {
        currentArray.splice(index, 1);
      }

      return {
        ...prev,
        [field]: currentArray,
      };
    });
    // Clear validation error when field is changed
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : Number(value);

    setFormData((prev) => ({
      ...prev,
      [name]: numValue
    }));

    // Clear validation error when field is changed
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePortfolioChange = (updatedItems: any[]) => {
    setFormData(prev => ({
      ...prev,
      portfolio: updatedItems
    }));
  };

  const handleEducationChange = (updatedItems: any[]) => {
    setFormData(prev => ({
      ...prev,
      education: updatedItems
    }));
  };

  const handleCertificationsChange = (updatedItems: any[]) => {
    setFormData(prev => ({
      ...prev,
      certifications: updatedItems
    }));
  };

  const handleWorkExperienceChange = (updatedItems: any[]) => {
    setFormData(prev => ({
      ...prev,
      workExperience: updatedItems
    }));
  };

  const hasUnsavedChanges = () => {
    try {
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    } catch (e) {
      console.error("Error comparing data:", e);
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate general user fields
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email?.trim())
    ) {
      newErrors.email = "Invalid email address";
      isValid = false;
    }

    // Validate mentor-specific fields
    if (authState.user?.role === "mentor") {
      if (!formData.bio?.trim()) {
        newErrors.bio = "Bio is required";
        isValid = false;
      }

      // Expertise validation
      if (!formData.expertise || formData.expertise.length === 0) {
        newErrors.expertise = "At least one area of expertise is required";
        isValid = false;
      }

      // Session price validation
      if (
        formData.sessionPrice === undefined ||
        formData.sessionPrice === "" ||
        (typeof formData.sessionPrice === 'number' && formData.sessionPrice < 0)
      ) {
        newErrors.sessionPrice = "Valid session price is required";
        isValid = false;
      }
    }

    // Validate mentee-specific fields
    if (authState.user?.role === "mentee") {
      if (!formData.interests || formData.interests.length === 0) {
        newErrors.interests = "At least one interest is required";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages and set loading
    setLoading(true);
    setMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setMessage({
        type: "error",
        text: "Please correct the errors in the form."
      });
      return;
    }

    try {
      // Set temporary saving message
      setMessage({
        type: "success",
        text: "Saving your changes..."
      });

      // Prepare the user data for update
      if (!authState.user?.id) {
        throw new Error("User ID is missing");
      }

      // Use a safer approach by creating properly typed objects
      const userId = authState.user.id;
      const userRole = authState.user.role as "mentor" | "mentee" | "admin";

      // We know these fields can't be undefined at this point because of validateForm
      const name = formData.name?.trim() || "";
      const email = formData.email?.trim() || "";
      const profilePicture = formData.profilePicture || "";

      // Create a properly typed user data object
      const userData = {
        id: userId,
        name,
        email,
        role: userRole,
        profilePicture,
      };

      console.log("Updating user with data:", userData);

      // Update the user's basic info
      const updatedUser = await updateUser(userId, userData);

      if (!updatedUser) {
        throw new Error("Failed to update user profile");
      }

      // Update auth context with new user data
      updateAuthUser({
        ...authState.user,
        name,
        email,
        profilePicture,
      });

      if (userRole === "mentor") {
        // Create a properly typed mentor data object
        const mentorData = {
          bio: formData.bio?.trim() || "",
          expertise: formData.expertise || [],
          sessionPrice: Number(formData.sessionPrice) || 0,
          yearsOfExperience: Number(formData.yearsOfExperience) || 0,
          portfolio: Array.isArray(formData.portfolio) ? formData.portfolio : [],
          certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
          education: Array.isArray(formData.education) ? formData.education : [],
          workExperience: Array.isArray(formData.workExperience) ? formData.workExperience : [],
        };

        console.log("Updating mentor profile with data:", mentorData);

        // Update mentor profile
        const updatedMentorProfile = await updateMentorProfile(
          userId,
          mentorData
        );

        if (!updatedMentorProfile) {
          throw new Error("Failed to update mentor profile");
        }
      } else if (userRole === "mentee") {
        // Create a properly typed mentee data object
        const menteeData = {
          bio: formData.bio?.trim() || "",
          interests: formData.interests || [],
          goals: formData.goals || [],
          currentPosition: formData.currentPosition?.trim() || "",
        };

        console.log("Updating mentee profile with data:", menteeData);

        // Update mentee profile
        const updatedMenteeProfile = await updateMenteeProfile(
          userId,
          menteeData
        );

        if (!updatedMenteeProfile) {
          throw new Error("Failed to update mentee profile");
        }
      }

      // Update initialData to reflect the current state
      setInitialData({ ...formData });
      setMessage({
        type: "success",
        text: "Profile updated successfully!"
      });

      // Auto clear the success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile"
      });
    } finally {
      setLoading(false);
    }
  };

  const expertiseOptions = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Data Science",
    "Machine Learning",
    "UX/UI Design",
    "Product Management",
    "Leadership",
    "Career Development",
  ];

  const interestOptions = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "AI/ML",
    "UI/UX Design",
    "Product Management",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
  ];

  const goalOptions = [
    "Learn a new programming language",
    "Improve coding skills",
    "Get a promotion",
    "Start a new career",
    "Build a portfolio",
    "Network with professionals",
    "Learn best practices",
    "Improve soft skills",
  ];

  // Helper function to safely check if an array includes a value
  const hasValue = (
    field: "expertise" | "interests" | "goals",
    value: string
  ): boolean => {
    return Array.isArray(formData[field])
      ? formData[field]!.includes(value)
      : false;
  };

  const isDisabled = loading || !hasUnsavedChanges();

  // Define the navigation tabs based on user role
  const getTabs = () => {
    const commonTabs = [
      { id: "basic", label: "Basic Information", icon: <FaUser className="mr-2" /> }
    ];

    if (authState.user?.role === "mentor") {
      return [
        ...commonTabs,
        { id: "mentor", label: "Mentor Profile", icon: <FaBriefcase className="mr-2" /> },
        { id: "portfolio", label: "Portfolio", icon: <FaFolder className="mr-2" /> },
        { id: "education", label: "Education", icon: <FaGraduationCap className="mr-2" /> },
        { id: "certifications", label: "Certifications", icon: <FaCertificate className="mr-2" /> },
        { id: "experience", label: "Work Experience", icon: <FaBriefcase className="mr-2" /> }
      ];
    } else if (authState.user?.role === "mentee") {
      return [
        ...commonTabs,
        { id: "mentee", label: "Mentee Profile", icon: <FaUser className="mr-2" /> }
      ];
    }
    
    return commonTabs;
  };

  const tabs = getTabs();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden relative"
    >
      {loading && (
        <div className="absolute inset-0 bg-gray-800/50 dark:bg-gray-900/70 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.5, loop: Infinity, ease: "linear" }}
            className="text-indigo-500 dark:text-indigo-400 text-3xl"
          >
            <FaSpinner />
          </motion.div>
        </div>
      )}

      <div className="p-6 dark:text-white">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
          <FaUser className="mr-2 text-indigo-600 dark:text-indigo-400" /> 
          Profile Settings
        </h2>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`${
                message.type === "success" 
                  ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300" 
                  : "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300"
              } px-4 py-3 rounded border mb-4 flex items-start`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="mt-0.5 mr-2 flex-shrink-0 text-green-500 dark:text-green-400" />
              ) : (
                <FaTimesCircle className="mt-0.5 mr-2 flex-shrink-0 text-red-500 dark:text-red-400" />
              )}
              <p>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm flex items-center whitespace-nowrap
                  ${activeSection === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  } transition-colors`}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === "basic" && (
              <motion.div
                key="basic"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors
                        ${errors.name ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.name}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors
                        ${errors.email ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.email}</p>
                    )}
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label htmlFor="profilePicture" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="text"
                    id="profilePicture"
                    name="profilePicture"
                    value={formData.profilePicture || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter a URL to an image (e.g. https://example.com/image.jpg)
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label htmlFor="role" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role || ""}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Role cannot be changed
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeSection === "mentor" && authState.user?.role === "mentor" && (
              <motion.div
                key="mentor"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Mentor Profile
                </h3>

                <motion.div variants={itemVariants}>
                  <label htmlFor="bio" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors resize-none
                      ${errors.bio ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.bio}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Expertise
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {expertiseOptions.map((option) => (
                      <label key={option} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group transition-colors">
                        <input
                          type="checkbox"
                          name="expertise"
                          value={option}
                          checked={hasValue("expertise", option)}
                          onChange={(e) =>
                            handleSelectChange(e.target.name as "expertise", e.target.value)
                          }
                          className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400 transition duration-150 ease-in-out rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.expertise && (
                    <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.expertise}</p>
                  )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <motion.div variants={itemVariants}>
                    <label htmlFor="sessionPrice" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Session Price (USD)
                    </label>
                    <input
                      type="number"
                      id="sessionPrice"
                      name="sessionPrice"
                      value={formData.sessionPrice || ""}
                      onChange={handleNumberChange}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors
                        ${errors.sessionPrice ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    {errors.sessionPrice && (
                      <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.sessionPrice}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="yearsOfExperience" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience || ""}
                      onChange={handleNumberChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors"
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeSection === "portfolio" && authState.user?.role === "mentor" && (
              <motion.div
                key="portfolio"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Portfolio
                </h3>
                <PortfolioManager
                  portfolioItems={formData.portfolio || []}
                  onChange={handlePortfolioChange}
                />
              </motion.div>
            )}

            {activeSection === "education" && authState.user?.role === "mentor" && (
              <motion.div
                key="education"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Education
                </h3>
                <EducationManager
                  educationItems={formData.education || []}
                  onChange={handleEducationChange}
                />
              </motion.div>
            )}

            {activeSection === "certifications" && authState.user?.role === "mentor" && (
              <motion.div
                key="certifications"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Certifications
                </h3>
                <CertificationManager
                  certificationItems={formData.certifications || []}
                  onChange={handleCertificationsChange}
                />
              </motion.div>
            )}

            {activeSection === "experience" && authState.user?.role === "mentor" && (
              <motion.div
                key="experience"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Work Experience
                </h3>
                <WorkExperienceManager
                  workExperienceItems={formData.workExperience || []}
                  onChange={handleWorkExperienceChange}
                />
              </motion.div>
            )}

            {activeSection === "mentee" && authState.user?.role === "mentee" && (
              <motion.div
                key="mentee"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                  Mentee Profile
                </h3>

                <motion.div variants={itemVariants}>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Interests
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {interestOptions.map((option) => (
                      <label key={option} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group transition-colors">
                        <input
                          type="checkbox"
                          name="interests"
                          value={option}
                          checked={hasValue("interests", option)}
                          onChange={(e) =>
                            handleSelectChange(e.target.name as "interests", e.target.value)
                          }
                          className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400 transition duration-150 ease-in-out rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.interests && (
                    <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.interests}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label htmlFor="bio" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors resize-none"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Goals
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {goalOptions.map((option) => (
                      <label key={option} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group transition-colors">
                        <input
                          type="checkbox"
                          name="goals"
                          value={option}
                          checked={hasValue("goals", option)}
                          onChange={(e) =>
                            handleSelectChange(e.target.name as "goals", e.target.value)
                          }
                          className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400 transition duration-150 ease-in-out rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.goals && (
                    <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.goals}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4">
                  <label htmlFor="currentPosition" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Current Position
                  </label>
                  <input
                    type="text"
                    id="currentPosition"
                    name="currentPosition"
                    value={formData.currentPosition || ""}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200 transition-colors
                      ${errors.currentPosition ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {errors.currentPosition && (
                    <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{errors.currentPosition}</p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save button with animation */}
        <div className="flex justify-between items-center mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={isDisabled}
            className={`flex items-center px-6 py-2 rounded-md text-white font-medium shadow-sm transition-all 
              ${isDisabled 
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60" 
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Changes
              </>
            )}
          </motion.button>

          {hasUnsavedChanges() && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium"
            >
              <FaExclamationTriangle className="mr-2" />
              You have unsaved changes
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;