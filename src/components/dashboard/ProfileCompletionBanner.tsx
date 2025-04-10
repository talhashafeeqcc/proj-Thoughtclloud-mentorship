import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

    useEffect(() => {
        // Check profile completion status when user data changes
        if (authState.user) {
            checkProfileCompletion();
        }
    }, [authState.user]);

    const checkProfileCompletion = () => {
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
            // Access mentor-specific data
            const mentor = user as any; // Type assertion for accessing mentor properties

            totalFields += 5; // bio, expertise, sessionPrice, yearsOfExperience, availability

            if (!mentor.bio || mentor.bio.trim() === '')
                missingFields.push('Bio');
            else completedFields++;

            if (!mentor.expertise || !Array.isArray(mentor.expertise) || mentor.expertise.length === 0)
                missingFields.push('Expertise');
            else completedFields++;

            if (mentor.sessionPrice === undefined || mentor.sessionPrice <= 0)
                missingFields.push('Session Price');
            else completedFields++;

            if (mentor.yearsOfExperience === undefined || mentor.yearsOfExperience < 0)
                missingFields.push('Years of Experience');
            else completedFields++;

            if (!mentor.availability || !Array.isArray(mentor.availability) || mentor.availability.length === 0)
                missingFields.push('Availability Schedule');
            else completedFields++;
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

    // Don't show anything if profile is complete or for admins
    if (profileStatus.isComplete || authState.user?.role === 'admin') {
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