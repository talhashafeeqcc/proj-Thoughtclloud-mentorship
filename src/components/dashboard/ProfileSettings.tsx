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
            console.log("Created default mentor profile:", roleData);
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
            console.log("Mentee profile not found, will create a default one");

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
            console.log("Created default mentee profile:", roleData);
          }
        } catch (error) {
          console.error("Error getting/creating mentee profile:", error);
          throw new Error(
            "Failed to create mentee profile. Please try again or contact support."
          );
        }
      }

      console.log("Fetched/created role data:", roleData);

      // Combine user and role data
      const combinedData = {
        ...userData,
        ...roleData,
      };

      console.log("Combined profile data:", combinedData);
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
    console.log(`handleSelectChange - Field: ${field}, Value: ${value}`); // Log input
    console.log("handleSelectChange - Before update:", formData); // Log before
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[field]) ? [...prev[field]!] : [];
      const index = currentArray.indexOf(value);

      if (index === -1) {
        currentArray.push(value);
      } else {
        currentArray.splice(index, 1);
      }

      const newState = {
        ...prev,
        [field]: currentArray,
      };
      console.log("handleSelectChange - After update:", newState); // Log after
      return newState;
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
    console.log(`handleNumberChange - Field: ${name}, Value: ${value}`); // Log input
    const numValue = value === "" ? "" : Number(value);

    console.log("handleNumberChange - Before update:", formData); // Log before
    setFormData((prev) => {
      const newState = { ...prev, [name]: numValue };
      console.log("handleNumberChange - After update:", newState); // Log after
      return newState;
    });

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

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>

        {message && (
          <div
            className={`${message.type === "success" ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700"} px-4 py-3 rounded border mb-4 animate-fadeIn`}
          >
            <p>{message.text}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">
                Profile Picture URL
              </label>
              <input
                type="text"
                id="profilePicture"
                name="profilePicture"
                value={formData.profilePicture || ""}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a URL to an image (e.g. https://example.com/image.jpg)
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role || ""}
                disabled
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
              />
              <p className="text-xs text-gray-500 mt-1">
                Role cannot be changed
              </p>
            </div>
          </div>

          {/* Role-specific sections */}
          {authState.user?.role === "mentor" ? (
            <div className="space-y-6">
              <div className="p-5 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Mentor Profile</h3>

                <div>
                  <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.bio ? "border-red-500" : ""}`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.bio}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Expertise
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {expertiseOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          name="expertise"
                          value={option}
                          checked={hasValue("expertise", option)}
                          onChange={(e) =>
                            handleSelectChange(e.target.name as "expertise", e.target.value)
                          }
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.expertise && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.expertise}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="sessionPrice" className="block text-gray-700 text-sm font-bold mb-2">
                      Session Price (USD)
                    </label>
                    <input
                      type="number"
                      id="sessionPrice"
                      name="sessionPrice"
                      value={formData.sessionPrice || ""}
                      onChange={handleNumberChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.sessionPrice ? "border-red-500" : ""}`}
                    />
                    {errors.sessionPrice && (
                      <p className="text-red-500 text-xs italic mt-1">{errors.sessionPrice}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="yearsOfExperience" className="block text-gray-700 text-sm font-bold mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience || ""}
                      onChange={handleNumberChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Portfolio</h3>
                <PortfolioManager
                  portfolioItems={formData.portfolio || []}
                  onChange={handlePortfolioChange}
                />
              </div>

              <div className="p-5 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Education</h3>
                <EducationManager
                  educationItems={formData.education || []}
                  onChange={handleEducationChange}
                />
              </div>

              <div className="p-5 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Certifications</h3>
                <CertificationManager
                  certificationItems={formData.certifications || []}
                  onChange={handleCertificationsChange}
                />
              </div>

              <div className="p-5 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Work Experience</h3>
                <WorkExperienceManager
                  workExperienceItems={formData.workExperience || []}
                  onChange={handleWorkExperienceChange}
                />
              </div>
            </div>
          ) : authState.user?.role === "admin" ? (
            <div className="p-5 border border-gray-200 rounded-lg">
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="text-blue-800">
                  As an admin, you have access to site management features.
                  Your profile settings are limited to basic information.
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">
                  Role: <span className="font-medium">Administrator</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Mentee Profile</h3>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Interests
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {interestOptions.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        name="interests"
                        value={option}
                        checked={hasValue("interests", option)}
                        onChange={(e) =>
                          handleSelectChange(e.target.name as "interests", e.target.value)
                        }
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.interests && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.interests}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows={4}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Goals
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {goalOptions.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        name="goals"
                        value={option}
                        checked={hasValue("goals", option)}
                        onChange={(e) =>
                          handleSelectChange(e.target.name as "goals", e.target.value)
                        }
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.goals && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.goals}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="currentPosition" className="block text-gray-700 text-sm font-bold mb-2">
                  Current Position
                </label>
                <input
                  type="text"
                  id="currentPosition"
                  name="currentPosition"
                  value={formData.currentPosition || ""}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.currentPosition ? "border-red-500" : ""}`}
                />
                {errors.currentPosition && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.currentPosition}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Keep only the enhanced bottom button with animations */}
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={isDisabled}
            className={`bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-300 ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              "Save Changes"
            )}
          </button>

          {hasUnsavedChanges() && (
            <div className="text-sm text-amber-600 animate-pulse">
              You have unsaved changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;