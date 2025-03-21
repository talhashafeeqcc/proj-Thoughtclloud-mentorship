import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUser, updateMentorProfile } from '../../services/userService';
import { User, MentorProfile } from '../../types';

const ProfileSettings: React.FC = () => {
  const { authState, logout } = useAuth();
  const [formData, setFormData] = useState<Partial<User | MentorProfile>>(authState.user || {});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Update local form data when authState.user changes
    setFormData(authState.user || {});
  }, [authState.user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpertiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    if (!formData.expertise) {
      formData.expertise = [];
    }

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...(prev.expertise || []), value],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        expertise: (prev.expertise || []).filter((item) => item !== value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      if (!authState.user?.id) {
        throw new Error('User ID is required');
      }

      // Update user data based on role
      if (authState.user.role === 'mentor') {
        await updateMentorProfile(authState.user.id, formData as Partial<MentorProfile>);
      } else {
        await updateUser(authState.user.id, formData as Partial<User>);
      }

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

    const handleLogout = () => {
    logout();
  }

  const expertiseOptions = [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Data Science',
    'Machine Learning',
    'UX/UI Design',
    'Product Management',
    'Leadership',
    'Career Development',
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
          Logout
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">
              Profile Picture URL
            </label>
            <input
              type="url"
              id="profilePicture"
              name="profilePicture"
              value={formData.profilePicture || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {authState.user?.role === 'mentor' && (
            <>
              <div className="mb-4">
                <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={4}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Expertise</label>
                <div className="grid grid-cols-2 gap-2">
                  {expertiseOptions.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        name="expertise"
                        value={option}
                        checked={(formData.expertise || []).includes(option)}
                        onChange={handleExpertiseChange}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            <div className="mb-4">
                <label htmlFor="sessionPrice" className="block text-gray-700 text-sm font-bold mb-2">
                  Session Price (USD)
                </label>
                <input
                  type="number"
                  id="sessionPrice"
                  name="sessionPrice"
                  value={formData.sessionPrice || ''}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
