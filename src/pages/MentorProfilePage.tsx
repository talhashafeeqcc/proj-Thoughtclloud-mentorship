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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!mentorId) {
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
          setError("Mentor not found");
        } else {
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
    setSelectedSlot(slot);
    if (slot) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !mentor || !authState.user) {
      setBookingError("Missing required information for booking");
      return;
    }

    setBookingError(null);

    try {
      // Create a new session
      await bookSession({
        mentorId: mentor.id,
        menteeId: authState.user.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentAmount: mentor.sessionPrice || 0,
        availabilitySlotId: selectedSlot.id,
      });

      setBookingSuccess(true);
      setIsModalOpen(false);

      // Redirect to dashboard after successful booking
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error booking session:", err);
      setBookingError(err.message || "Failed to book session");
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
        <div className="md:col-span-2">
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

        <div>
          <h2 className="text-xl font-semibold mb-4">Book a Session</h2>
          <p className="mb-4">
            Select an available time slot to book a session with {mentor.name}.
          </p>
          <AvailabilityCalendar
            mentorId={mentor.id}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      </div>

      {selectedSlot && (
        <BookingModal
          show={isModalOpen}
          selectedSlot={selectedSlot}
          onClose={handleCloseModal}
          onBook={handleConfirmBooking}
          mentorId={mentor.id}
          mentorName={mentor.name}
        />
      )}
    </div>
  );
};

export default MentorProfilePage;
