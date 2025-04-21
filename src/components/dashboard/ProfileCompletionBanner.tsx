import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMentorByUserId, getMentorAvailabilitySlots } from '../../services/mentorService';
import { motion } from 'framer-motion';
import { FaUserEdit, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';

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

                    // Check availability slots from the separate collection
                    const availabilitySlots = await getMentorAvailabilitySlots(mentorData.id);
                    if (!availabilitySlots || availabilitySlots.length === 0)
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
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-l-4 border-amber-500 p-5 mb-6 rounded-md shadow-sm"
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <FaUserEdit className="text-amber-600 dark:text-amber-400" />
                        Complete Your Profile
                    </h3>
                    <p className="text-amber-700 dark:text-amber-400 mt-1">
                        Your profile is {profileStatus.completionPercentage}% complete.
                        {profileStatus.missingFields.length > 0 &&
                            ` Please add the following information: ${profileStatus.missingFields.join(', ')}.`}
                    </p>
                    <div className="mt-3">
                        <motion.div 
                            className="w-full bg-amber-200 dark:bg-amber-800/50 rounded-full h-2.5 overflow-hidden"
                        >
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${profileStatus.completionPercentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="bg-amber-600 dark:bg-amber-500 h-2.5 rounded-full"
                            ></motion.div>
                        </motion.div>
                    </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                        to="/settings"
                        className="inline-flex items-center bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                    >
                        <FaClipboardList className="mr-2" />
                        Complete Now
                    </Link>
                </motion.div>
            </div>
            {authState.user?.role === 'mentor' && profileStatus.missingFields.includes('Availability Schedule') && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mt-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2 bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-md"
                >
                    <FaCalendarAlt className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p>
                        <span className="font-semibold">Note:</span> Setting up your availability schedule is essential
                        before mentees can book sessions with you.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default ProfileCompletionBanner; 