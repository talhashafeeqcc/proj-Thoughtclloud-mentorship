import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMentorByUserId } from '../../services/mentorService';

interface ProfileCompletion {
    isComplete: boolean;
    missingFields: string[];
    completionPercentage: number;
}

const ProfileCompletionBanner: React.FC = () => {
    const { authState } = useAuth();
    const [profileStatus, setProfileStatus] = useState<ProfileCompletion>({
        isComplete: true,
        missingFields: [],
        completionPercentage: 100
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check profile completion status when user data changes
        if (authState.user) {
            checkProfileCompletion();
        }
    }, [authState.user]);

    const checkProfileCompletion = async () => {
        const user = authState.user;
        if (!user) return;

        const missingFields: string[] = [];
        let totalFields = 0;
        let completedFields = 0;

        // Common fields for all roles
        totalFields += 3; // name, email, profilePicture
        if (!user.name || user.name.trim() === '') missingFields.push('Name');
        else completedFields++;

        if (!user.email || user.email.trim() === '') missingFields.push('Email');
        else completedFields++;

        if (!user.profilePicture) missingFields.push('Profile Picture');
        else completedFields++;

        // Role-specific fields
        if (user.role === 'mentor') {
            setLoading(true);
            try {
                // Fetch the mentor profile data
                const mentorData = await getMentorByUserId(user.id);
                
                if (mentorData) {
                    // Updated total fields count to include portfolio, certifications, education, and work experience
                    totalFields += 9; // bio, expertise, sessionPrice, yearsOfExperience, availability, portfolio, certifications, education, workExperience

                    if (!mentorData.bio || mentorData.bio.trim() === '')
                        missingFields.push('Bio');
                    else completedFields++;

                    if (!mentorData.expertise || !Array.isArray(mentorData.expertise) || mentorData.expertise.length === 0)
                        missingFields.push('Expertise');
                    else completedFields++;

                    if (mentorData.sessionPrice === undefined || mentorData.sessionPrice <= 0)
                        missingFields.push('Session Price');
                    else completedFields++;

                    if (mentorData.yearsOfExperience === undefined || mentorData.yearsOfExperience < 0)
                        missingFields.push('Years of Experience');
                    else completedFields++;

                    // Check availability from mentor data
                    if (!mentorData.availability || !Array.isArray(mentorData.availability) || mentorData.availability.length === 0)
                        missingFields.push('Availability Schedule');
                    else completedFields++;
                    
                    // Check portfolio
                    if (!mentorData.portfolio || !Array.isArray(mentorData.portfolio) || mentorData.portfolio.length === 0)
                        missingFields.push('Portfolio');
                    else completedFields++;
                    
                    // Check certifications
                    if (!mentorData.certifications || !Array.isArray(mentorData.certifications) || mentorData.certifications.length === 0)
                        missingFields.push('Certifications');
                    else completedFields++;
                    
                    // Check education
                    if (!mentorData.education || !Array.isArray(mentorData.education) || mentorData.education.length === 0)
                        missingFields.push('Education');
                    else completedFields++;
                    
                    // Check work experience
                    if (!mentorData.workExperience || !Array.isArray(mentorData.workExperience) || mentorData.workExperience.length === 0)
                        missingFields.push('Work Experience');
                    else completedFields++;
                } else {
                    // If no mentor profile exists, all mentor fields are missing
                    missingFields.push('Bio', 'Expertise', 'Session Price', 'Years of Experience', 'Availability Schedule', 
                                      'Portfolio', 'Certifications', 'Education', 'Work Experience');
                }
            } catch (error) {
                console.error("Error fetching mentor data for profile completion check:", error);
            } finally {
                setLoading(false);
            }
        }
        else if (user.role === 'mentee') {
            // Access mentee-specific data
            const mentee = user as any; // Type assertion for accessing mentee properties

            totalFields += 3; // bio, interests, goals

            if (!mentee.bio || mentee.bio.trim() === '')
                missingFields.push('Bio');
            else completedFields++;

            if (!mentee.interests || !Array.isArray(mentee.interests) || mentee.interests.length === 0)
                missingFields.push('Interests');
            else completedFields++;

            if (!mentee.goals || !Array.isArray(mentee.goals) || mentee.goals.length === 0)
                missingFields.push('Goals');
            else completedFields++;
        }

        // Calculate completion percentage
        const completionPercentage = Math.round((completedFields / totalFields) * 100);

        setProfileStatus({
            isComplete: missingFields.length === 0,
            missingFields,
            completionPercentage
        });
    };

    // Don't show anything if profile is complete, loading, or for admins
    if (loading || profileStatus.isComplete || authState.user?.role === 'admin') {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 p-4 mb-6 rounded-md shadow-sm">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-amber-800">Complete Your Profile</h3>
                    <p className="text-amber-700 mt-1">
                        Your profile is {profileStatus.completionPercentage}% complete.
                        {profileStatus.missingFields.length > 0 &&
                            ` Please add the following information: ${profileStatus.missingFields.join(', ')}.`}
                    </p>
                    <div className="mt-2">
                        <div className="w-full bg-amber-200 rounded-full h-2.5">
                            <div
                                className="bg-amber-600 h-2.5 rounded-full"
                                style={{ width: `${profileStatus.completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                <Link
                    to="/settings"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                >
                    Complete Now
                </Link>
            </div>
            {authState.user?.role === 'mentor' && profileStatus.missingFields.includes('Availability Schedule') && (
                <div className="mt-3 text-sm text-amber-800">
                    <p>
                        <span className="font-semibold">Note:</span> Setting up your availability schedule is essential
                        before mentees can book sessions with you.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletionBanner; 