import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMentorById } from "../services/userService";
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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!mentorId) {
        console.error("No mentorId in URL params");
        setError("No mentor ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log("Fetching mentor with ID:", mentorId);
        const profile = await getMentorById(mentorId);
        if (!profile) {
          console.error("Mentor not found for ID:", mentorId);
          setError("Mentor not found");
        } else {
          console.log("Successfully loaded mentor profile:", profile.id);
          console.log(
            "Mentor availability:",
            profile.availability ? profile.availability.length : 0,
            "slots"
          );
          setMentor(profile as MentorProfileType);
        }
      } catch (err: any) {
        console.error("Error fetching mentor profile:", err);
        setError(err.message || "Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchMentorProfile();
  }, [mentorId]);

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    if (!isAuthenticated) {
      // Redirect unauthenticated users to login when they try to book
      navigate("/login", { state: { redirect: `/mentors/${mentorId}` } });
      return;
    }

    if (!canBook) {
      // If not a mentee, don't allow booking
      setBookingError("Only mentees can book sessions with mentors");
      return;
    }

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
    if (!selectedSlot || !mentor || !authState.user || !isMentee) {
      setBookingError(
        "Missing required information for booking or not a mentee"
      );
      return;
    }

    setBookingError(null);

    try {
      // Create a new session and store the result
      await bookSession({
        mentorId: mentor.id,
        menteeId: authState.user.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentAmount: mentor.sessionPrice || 0,
        availabilitySlotId: selectedSlot.id,
        notes: `Session with ${mentor.name}`,
      });

      // Show success message
      setBookingSuccess(true);
      // Don't close modal immediately - payment needs to be processed
    } catch (error) {
      console.error("Error booking session:", error);
      setBookingError(
        error instanceof Error
          ? error.message
          : "Failed to book session. Please try again."
      );
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate("/mentors")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Mentor List
        </button>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Mentor not found</p>
        </div>
        <button
          onClick={() => navigate("/mentors")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Mentor List
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className={`md:col-span-${canBook || showLoginPrompt ? "2" : "3"}`}
        >
          <MentorProfile mentor={mentor} />

          {bookingSuccess && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
              Session booked successfully! Redirecting to your dashboard...
            </div>
          )}

          {bookingError && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
              Error: {bookingError}
            </div>
          )}
        </div>

        {/* Show different content in the right column based on user status */}
        {showLoginPrompt && (
          <div className="bg-blue-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Want to book a session?
            </h2>
            <p className="mb-4">
              Please log in or create an account to book a session with{" "}
              {mentor.name}.
            </p>
            <div className="space-x-3">
              <button
                onClick={() =>
                  navigate("/login", {
                    state: { redirect: `/mentors/${mentorId}` },
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Log In
              </button>
              <button
                onClick={() =>
                  navigate("/register", {
                    state: { redirect: `/mentors/${mentorId}`, role: "mentee" },
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

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
  );
};

export default MentorProfilePage;
