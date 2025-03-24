import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaCalendarPlus, FaTrash } from "react-icons/fa";
import { AvailabilitySlot } from "../../types";
import {
  updateMentorProfile,
  getMentorByUserId,
} from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

interface AvailabilityManagerProps {
  mentorId: string;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  mentorId,
}) => {
  const { authState } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for new availability slot
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing availability slots
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching availability for mentorId:", mentorId);

        // First get the current mentor profile to ensure we're working with the latest data
        if (authState.user?.id) {
          const currentProfile = await getMentorByUserId(authState.user.id);
          if (!currentProfile) {
            throw new Error("Failed to fetch mentor profile");
          }

          console.log("Mentor profile found:", currentProfile.id);

          // Use the availability directly from the mentor profile
          const slots = currentProfile.availability || [];
          console.log("Found availability slots:", slots.length);
          setAvailabilitySlots(slots);
        } else {
          throw new Error("User not authenticated");
        }
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError(err.message || "Failed to load availability slots");
      } finally {
        setLoading(false);
      }
    };

    if (mentorId) {
      fetchAvailability();
    }
  }, [mentorId, authState.user?.id]);

  // Add new availability slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!date || !startTime || !endTime) {
      setError("Please fill in all fields");
      return;
    }

    // Validate times
    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Cannot add slots for past dates");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create new slot
      const newSlot: AvailabilitySlot = {
        id: uuidv4(),
        date,
        startTime,
        endTime,
        isBooked: false,
        mentorId: mentorId,
      };

      // Create updated slots array including existing and new slot
      const updatedSlots = [...availabilitySlots, newSlot];

      // Update mentor profile with new availability
      if (authState.user?.id) {
        console.log(
          "Updating mentor profile with new availability:",
          updatedSlots
        );

        // First get the current mentor profile
        const currentProfile = await getMentorByUserId(authState.user.id);
        if (!currentProfile) {
          throw new Error("Failed to fetch current mentor profile");
        }

        // Update the profile with new availability
        const updatedProfile = await updateMentorProfile(authState.user.id, {
          ...currentProfile,
          availability: updatedSlots,
        });

        if (!updatedProfile) {
          throw new Error("Failed to update mentor profile");
        }

        // Update local state with the new slots
        setAvailabilitySlots(updatedSlots);
        setSuccessMessage("Availability slot added successfully");

        // Reset form
        setDate("");
        setStartTime("");
        setEndTime("");
      } else {
        throw new Error("User not authenticated");
      }
    } catch (err: any) {
      console.error("Error adding availability slot:", err);
      setError(err.message || "Failed to add availability slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this availability slot?")
    ) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      // Filter out the slot to be deleted
      const updatedSlots = availabilitySlots.filter(
        (slot) => slot.id !== slotId
      );

      // Update mentor profile with filtered slots
      if (authState.user?.id) {
        console.log(
          "Updating mentor profile with filtered availability:",
          updatedSlots
        );

        const updatedProfile = await updateMentorProfile(authState.user.id, {
          availability: updatedSlots,
        });

        // Get the availability slots directly from the updated profile
        console.log("Updated profile:", updatedProfile.id);
        setAvailabilitySlots(updatedProfile.availability || []);
        setSuccessMessage("Availability slot deleted successfully");
      } else {
        throw new Error("User not authenticated");
      }
    } catch (err: any) {
      console.error("Error deleting availability slot:", err);
      setError(err.message || "Failed to delete availability slot");
    }
  };

  // Group slots by date for display
  const groupedSlots = availabilitySlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  // Sort dates for display
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaCalendarPlus className="mr-2" /> Manage Your Availability
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}

      {/* Add new slot form */}
      <form
        onSubmit={handleAddSlot}
        className="mb-6 p-4 border rounded bg-gray-50"
      >
        <h3 className="text-lg font-medium mb-3">Add New Availability Slot</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="block mb-1 text-sm font-medium">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]} // Don't allow past dates
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="block mb-1 text-sm font-medium"
            >
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block mb-1 text-sm font-medium">
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Adding..." : "Add Slot"}
          </button>
        </div>
      </form>

      {/* Display existing slots */}
      <div>
        <h3 className="text-lg font-medium mb-3">Your Available Slots</h3>

        {loading ? (
          <p>Loading availability slots...</p>
        ) : availabilitySlots.length === 0 ? (
          <p className="text-gray-500">No availability slots added yet.</p>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="border rounded p-3">
                <h4 className="font-medium mb-2">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>

                <div className="divide-y">
                  {groupedSlots[date].map((slot) => (
                    <div
                      key={slot.id}
                      className="py-2 flex justify-between items-center"
                    >
                      <span>
                        {slot.startTime} - {slot.endTime}
                        {slot.isBooked && (
                          <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            Booked
                          </span>
                        )}
                      </span>

                      {!slot.isBooked && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete slot"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManager;
