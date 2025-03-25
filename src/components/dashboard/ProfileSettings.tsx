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
import { User, MentorProfile, Mentee } from "../../types";

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

        // First get the user data
        const userData = await getUserById(authState.user.id);
        if (!userData) {
          throw new Error("User data not found");
        }

        console.log("Fetched user data:", userData);

        // Then get role-specific data
        let roleData;
        if (userData.role === "mentor") {
          roleData = await getMentorByUserId(userData.id);
          if (!roleData) {
            throw new Error(
              "Mentor profile not found. Please complete your mentor profile setup."
            );
          }
        } else if (userData.role === "admin") {
          // Admins might not have mentor/mentee-specific profiles
          roleData = { role: "admin" as const };
        } else {
          roleData = await getMenteeByUserId(userData.id);
          if (!roleData) {
            throw new Error(
              "Mentee profile not found. Please complete your mentee profile setup."
            );
          }
        }

        console.log("Fetched role data:", roleData);

        // Combine user and role data
        const combinedData = {
          ...userData,
          ...roleData,
        };

        console.log("Combined profile data:", combinedData);
        setFormData(combinedData);
        setInitialData(combinedData);
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

    fetchProfileData();
  }, [authState.user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "expertise" | "interests" | "goals"
  ) => {
    const { value, checked } = e.target;
    const currentArray = Array.isArray(formData[field])
      ? [...formData[field]!]
      : [];

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...currentArray, value],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: currentArray.filter((item) => item !== value),
      }));
    }
  };

  // New function to handle JSON textarea fields
  const handleJsonFieldChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: "portfolio" | "education" | "certifications" | "workExperience"
  ) => {
    try {
      const value = e.target.value.trim();
      // If empty, set as empty array
      if (!value) {
        setFormData((prev) => ({
          ...prev,
          [field]: [],
        }));
        return;
      }

      // Try to parse as JSON
      const parsedArray = JSON.parse(value);
      if (Array.isArray(parsedArray)) {
        setFormData((prev) => ({
          ...prev,
          [field]: parsedArray,
        }));
      } else {
        console.error(`Field ${field} must be an array`);
      }
    } catch (err) {
      console.error(`Invalid JSON for ${field}:`, err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // User validation
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Name is required";
    }

    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Role-specific validation
    if (authState.user?.role === "mentor") {
      if (!formData.bio || formData.bio.trim() === "") {
        newErrors.bio = "Bio is required for mentors";
      }

      if (formData.sessionPrice !== undefined) {
        const price = Number(formData.sessionPrice);
        if (isNaN(price) || price < 0) {
          newErrors.sessionPrice = "Session price must be a valid number";
        }
      }

      if (!formData.expertise || formData.expertise.length === 0) {
        newErrors.expertise = "Please select at least one expertise area";
      }
    } else if (authState.user?.role === "admin") {
      // No specific validation for admin role - they don't have mentor/mentee profiles
    } else {
      if (!formData.interests || formData.interests.length === 0) {
        newErrors.interests = "Please select at least one interest";
      }

      if (!formData.goals || formData.goals.length === 0) {
        newErrors.goals = "Please add at least one goal";
      }

      if (!formData.currentPosition || formData.currentPosition.trim() === "") {
        newErrors.currentPosition = "Current position is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasUnsavedChanges = (): boolean => {
    return JSON.stringify(initialData) !== JSON.stringify(formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      if (!authState.user?.id) {
        throw new Error("User ID is required");
      }

      // Process the session price for mentors (convert to number)
      const processedData = { ...formData };
      if (
        authState.user.role === "mentor" &&
        processedData.sessionPrice !== undefined
      ) {
        processedData.sessionPrice = Number(processedData.sessionPrice);
      }

      // First update user data
      const userUpdateData = {
        name: processedData.name,
        email: processedData.email,
        profilePicture: processedData.profilePicture,
      };

      await updateUser(authState.user.id, userUpdateData);

      // Then update role-specific data
      let updatedProfile;
      if (authState.user.role === "mentor") {
        updatedProfile = await updateMentorProfile(
          authState.user.id,
          processedData as Partial<MentorProfile>
        );
      } else if (authState.user.role === "admin") {
        // Admin users don't have separate profile data to update
        updatedProfile = {
          ...authState.user,
          ...userUpdateData,
          role: "admin" as const,
        };
      } else {
        updatedProfile = await updateMenteeProfile(
          authState.user.id,
          processedData as Partial<Mentee>
        );
      }

      if (updatedProfile) {
        // Update the auth context with the refreshed user data
        updateAuthUser(updatedProfile as User);
        // Update the form data with the refreshed data
        setFormData(updatedProfile);
        setInitialData(updatedProfile);
        setMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
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

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          {hasUnsavedChanges() && (
            <p className="text-sm text-amber-600 mt-1">
              You have unsaved changes
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* User Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs italic mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs italic mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="profilePicture"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  id="profilePicture"
                  name="profilePicture"
                  value={formData.profilePicture || ""}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>

          {/* Role-specific Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">
              {authState.user?.role === "mentor"
                ? "Mentor Profile"
                : authState.user?.role === "admin"
                ? "Admin Profile"
                : "Mentee Profile"}
            </h3>

            {authState.user?.role === "mentor" ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.bio ? "border-red-500" : ""
                    }`}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.bio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Expertise
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {expertiseOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          name="expertise"
                          value={option}
                          checked={hasValue("expertise", option)}
                          onChange={(e) => handleArrayChange(e, "expertise")}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.expertise && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.expertise}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sessionPrice"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Session Price (USD)
                  </label>
                  <input
                    type="number"
                    id="sessionPrice"
                    name="sessionPrice"
                    value={formData.sessionPrice || ""}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.sessionPrice ? "border-red-500" : ""
                    }`}
                  />
                  {errors.sessionPrice && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.sessionPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="yearsOfExperience"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience || ""}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>

                <div>
                  <label
                    htmlFor="portfolio"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Portfolio (JSON format)
                  </label>
                  <textarea
                    id="portfolio"
                    name="portfolio"
                    value={
                      formData.portfolio
                        ? JSON.stringify(formData.portfolio, null, 2)
                        : "[]"
                    }
                    onChange={(e) => handleJsonFieldChange(e, "portfolio")}
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: [{"{"}"id":"1","title":"Project
                    Name","description":"Project
                    Description","link":"https://example.com"{"}"}]
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="education"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Education (JSON format)
                  </label>
                  <textarea
                    id="education"
                    name="education"
                    value={
                      formData.education
                        ? JSON.stringify(formData.education, null, 2)
                        : "[]"
                    }
                    onChange={(e) => handleJsonFieldChange(e, "education")}
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: [{"{"}
                    "id":"1","institution":"University","degree":"Bachelor's","field":"Computer
                    Science","startDate":"2015","endDate":"2019"{"}"}]
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="certifications"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Certifications (JSON format)
                  </label>
                  <textarea
                    id="certifications"
                    name="certifications"
                    value={
                      formData.certifications
                        ? JSON.stringify(formData.certifications, null, 2)
                        : "[]"
                    }
                    onChange={(e) => handleJsonFieldChange(e, "certifications")}
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: [{"{"}"id":"1","name":"AWS
                    Certification","issuer":"Amazon","date":"2021"{"}"}]
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="workExperience"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Work Experience (JSON format)
                  </label>
                  <textarea
                    id="workExperience"
                    name="workExperience"
                    value={
                      formData.workExperience
                        ? JSON.stringify(formData.workExperience, null, 2)
                        : "[]"
                    }
                    onChange={(e) => handleJsonFieldChange(e, "workExperience")}
                    rows={4}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: [{"{"}"id":"1","company":"Company
                    Name","position":"Position","startDate":"2020-01","endDate":"2022-01","description":"Job
                    description"{"}"}]
                  </p>
                </div>
              </div>
            ) : authState.user?.role === "admin" ? (
              <div className="space-y-4">
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
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Interests
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {interestOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          name="interests"
                          value={option}
                          checked={hasValue("interests", option)}
                          onChange={(e) => handleArrayChange(e, "interests")}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.interests && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.interests}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Goals
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {goalOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          name="goals"
                          value={option}
                          checked={hasValue("goals", option)}
                          onChange={(e) => handleArrayChange(e, "goals")}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.goals && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.goals}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="currentPosition"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Current Position
                  </label>
                  <input
                    type="text"
                    id="currentPosition"
                    name="currentPosition"
                    value={formData.currentPosition || ""}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.currentPosition ? "border-red-500" : ""
                    }`}
                  />
                  {errors.currentPosition && (
                    <p className="text-red-500 text-xs italic mt-1">
                      {errors.currentPosition}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setFormData(initialData)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={!hasUnsavedChanges() || loading}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={loading || !hasUnsavedChanges()}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading || !hasUnsavedChanges()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
