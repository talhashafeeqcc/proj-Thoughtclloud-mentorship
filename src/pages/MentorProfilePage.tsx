import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMentorById } from "../services/mentorService";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import MentorProfile from "../components/mentor/MentorProfile";
import AvailabilityCalendar from "../components/dashboard/AvailabilityCalendar";
import BookingModal from "../components/BookingModal";
import { AvailabilitySlot, MentorProfile as MentorProfileType } from "../types";

const MentorProfilePage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { bookSession } = useSession();

  const [mentor, setMentor] = useState<MentorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [calendarVersion, setCalendarVersion] = useState(0);

  // Check if the current user is a mentee
  const isMentee = authState?.user?.role === "mentee";
  const isMentor = authState?.user?.role === "mentor";
  const isAuthenticated = authState?.isAuthenticated;

  // Determine booking permission:
  // - Authenticated mentees can book
  // - Authenticated mentors cannot book
  // - Unauthenticated users see a login prompt
  const canBook = isMentee && isAuthenticated;
  const showLoginPrompt = !isAuthenticated;

  // Fetch the mentor profile data when the component mounts
  useEffect(() => {
    const fetchMentor = async () => {
      if (!mentorId) return;

      setLoading(true);
      setError(null);
      try {
        const mentorData = await getMentorById(mentorId);
        setMentor(mentorData);
      } catch (error) {
        console.error("Error fetching mentor:", error);
        setError("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !authState.user || !mentor) {
      setBookingError("Missing required information for booking");
      return Promise.reject("Missing required information for booking");
    }

    try {
      // Creating a loading state variable to indicate booking is in progress
      setLoading(true);
      const sessionData = {
        mentorId: mentor.id,
        menteeId: authState.user.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentAmount: mentor.sessionPrice || 0,
        availabilitySlotId: selectedSlot.id,
        notes: `Session with ${mentor.name}`,
        // Status and payment status are set by the bookSession function
      };

      const session = await bookSession(sessionData);
      console.log("Session booked successfully with ID:", session.id);

      // Refresh the calendar after successful booking
      setCalendarVersion(prev => prev + 1);

      // Return the session ID for the BookingModal
      return session.id;
    } catch (error) {
      console.error("Error during booking:", error);
      if (error instanceof Error) {
        setBookingError(error.message);
      } else {
        setBookingError("An unknown error occurred during booking");
      }
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading mentor profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Mentor Not Found</p>
          <p>The mentor you're looking for could not be found.</p>
          <button
            onClick={() => navigate("/mentors")}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Browse Mentors
          </button>
        </div>
      </div>
    );
  }

  // Get the current user role for display purposes
  const userRoleDisplay = isAuthenticated
    ? isMentee
      ? "mentee"
      : isMentor
        ? "mentor"
        : "user"
    : "visitor";

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mentor Profile Section */}
        <div className="md:w-1/3">
          <MentorProfile mentor={mentor} />

          {/* Show login prompt for unauthenticated users */}
          {showLoginPrompt && (
            <div className="mt-6 bg-blue-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Want to book a session?</h2>
              <p className="mb-4">
                Please log in or create an account to book a session with this
                mentor.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Booking Section */}
        <div className="md:w-2/3">
          <h1 className="text-2xl font-bold mb-2">
            Book a Session with {mentor.name}
          </h1>
          <p className="text-gray-600 mb-6">
            You are viewing this page as a {userRoleDisplay}.
          </p>

          {/* Only show booking section for mentees */}
          {canBook && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
              <p className="mb-4">
                Select an available time slot to book a session with {mentor.name}
                .
              </p>
              <AvailabilityCalendar
                mentorId={mentor.id}
                onSlotSelect={handleSlotSelect}
                versionKey={calendarVersion}
              />
            </div>
          )}

          {/* Show info message for mentors */}
          {isMentor && isAuthenticated && (
            <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Mentor View</h2>
              <p>
                As a mentor, you're viewing another mentor's profile. Only mentees
                can book sessions.
              </p>
            </div>
          )}
        </div>

        {canBook && selectedSlot && (
          <BookingModal
            show={isModalOpen}
            selectedSlot={selectedSlot}
            onClose={handleCloseModal}
            onBook={handleConfirmBooking}
            mentorId={mentor.id}
            mentorName={mentor.name}
            sessionPrice={mentor.sessionPrice}
          />
        )}

        {bookingError && (
          <div className="container mx-auto p-4 mt-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error:</p>
              <p>{bookingError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorProfilePage;
