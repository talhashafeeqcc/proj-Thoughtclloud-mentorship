import React, { useState, useEffect } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityManager from "./AvailabilityManager";
import BookingModal from "../BookingModal";
import { AvailabilitySlot } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getMentorByUserId } from "../../services/mentorService";
import { FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";

const MentorDashboard: React.FC = () => {
  const { authState } = useAuth();
  const [mentorId, setMentorId] = useState<string>("");
  const [mentorName, setMentorName] = useState<string>("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("calendar"); // 'calendar' or 'manage'

  // Fetch mentor profile data
  useEffect(() => {
    const fetchMentorData = async () => {
      if (authState.user?.id) {
        try {
          const mentorProfile = await getMentorByUserId(authState.user.id);
          if (mentorProfile) {
            setMentorId(mentorProfile.id);
            setMentorName(authState.user.name);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMentorData();
  }, [authState.user]);

  const openBookingModal = () => {
    setIsBookingModalOpen(true);
    setBookingSuccess(false); // Reset success state when modal opens
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedSlot(null); // Clear selected slot when modal is closed
  };

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      openBookingModal(); // Open booking modal when a slot is selected
    }
  };

  const handleSessionBooked = (availabilitySlotId: string) => {
    console.log("Session booked for slot ID:", availabilitySlotId);
    setIsBookingModalOpen(false);
    setSelectedSlot(null); // Clear selected slot after booking
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false); // Clear success message after a delay
    }, 3000); // Success message disappears after 3 seconds
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading mentor dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!mentorId) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Mentor Profile Not Found</p>
        <p>Please complete your mentor profile setup.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-6">Mentor Dashboard</h2>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2 text-blue-800">
            Upcoming Sessions
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2 text-green-800">
            Completed Sessions
          </h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2 text-purple-800">
            Average Rating
          </h3>
          <p className="text-2xl font-bold">N/A</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "calendar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaCalendarAlt className="mr-2" /> View Calendar
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaCalendarCheck className="mr-2" /> Manage Availability
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "calendar" ? (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaCalendarAlt className="mr-2" /> Your Availability Calendar
          </h3>
          <p className="mb-4 text-gray-600">
            View your current availability. Slots that are already booked will
            not be shown here.
          </p>
          <AvailabilityCalendar
            mentorId={mentorId}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      ) : (
        <AvailabilityManager mentorId={mentorId} />
      )}

      {selectedSlot && (
        <BookingModal
          show={isBookingModalOpen}
          onClose={closeBookingModal}
          mentorId={mentorId}
          mentorName={mentorName}
          onBook={handleSessionBooked}
          selectedSlot={selectedSlot}
        />
      )}

      {bookingSuccess && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          Session booked successfully!
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
