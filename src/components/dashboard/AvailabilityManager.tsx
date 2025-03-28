import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaCalendarPlus, FaTrash } from "react-icons/fa";
import { AvailabilitySlot } from "../../types";
import {
  getMentorById,
  getMentorAvailabilitySlots,
  addAvailabilitySlot,
  deleteAvailabilitySlot
} from "../../services/mentorService";

interface AvailabilityManagerProps {
  mentorId: string;
  onAvailabilityChange?: () => void;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  mentorId,
  onAvailabilityChange
}) => {
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

        // First verify the mentor exists
        const currentProfile = await getMentorById(mentorId);
        if (!currentProfile) {
          throw new Error("Failed to fetch mentor profile");
        }

        console.log("Mentor profile found:", currentProfile.id);

        // Now get availability slots from separate collection
        const slots = await getMentorAvailabilitySlots(mentorId);
        console.log("Found availability slots:", slots.length);
        setAvailabilitySlots(slots);
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
  }, [mentorId]);

  // Add new availability slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      // Validate date and time inputs
      if (!date || !startTime || !endTime) {
        throw new Error("Please fill in all fields");
      }
      
      // Validate that end time is after start time
      if (endTime <= startTime) {
        throw new Error("End time must be after start time");
      }
      
      // Convert times to minutes for comparison
      const startMinutes = convertTimeToMinutes(startTime);
      const endMinutes = convertTimeToMinutes(endTime);
      
      // Check overlap with existing slots for the same date
      const slotsForDay = availabilitySlots.filter(slot => slot.date === date);
      
      for (const slot of slotsForDay) {
        const existingStartMinutes = convertTimeToMinutes(slot.startTime);
        const existingEndMinutes = convertTimeToMinutes(slot.endTime);
        
        // Check for any kind of overlap
        if (
          // New slot starts during existing slot
          (startMinutes >= existingStartMinutes && startMinutes < existingEndMinutes) ||
          // New slot ends during existing slot
          (endMinutes > existingStartMinutes && endMinutes <= existingEndMinutes) ||
          // New slot contains existing slot
          (startMinutes <= existingStartMinutes && endMinutes >= existingEndMinutes)
        ) {
          throw new Error(
            `This time slot overlaps with an existing slot (${slot.startTime} - ${slot.endTime})${
              slot.isBooked ? " which is already booked" : ""
            }`
          );
        }
      }
      
      // Create new availability slot
      const newSlot: AvailabilitySlot = {
        id: uuidv4(),
        date: date,
        startTime,
        endTime,
        isBooked: false,
        mentorId,
      };
      
      console.log("Adding new slot with date format:", date);
      // Log the raw value, safely handling the type
      const dateInput = document.getElementById('date') as HTMLInputElement | null;
      console.log("Date input raw value:", dateInput?.value);
      
      // Add the new slot directly to the availability collection
      const addedSlot = await addAvailabilitySlot(newSlot);
      
      // Update local state with the new slot
      setAvailabilitySlots(prevSlots => [...prevSlots, addedSlot]);
      
      // Reset form fields
      setDate("");
      setStartTime("");
      setEndTime("");
      
      setSuccessMessage("Availability slot added successfully");
      
      // Notify parent component of the change
      if (onAvailabilityChange) {
        onAvailabilityChange();
      }
    } catch (err: any) {
      console.error("Error adding availability slot:", err);
      setError(err.message || "Failed to add availability slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert time string (HH:MM) to minutes for comparison
  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
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
      // Delete the slot directly from availability collection
      await deleteAvailabilitySlot(slotId);
      
      // Update local state
      setAvailabilitySlots(availabilitySlots.filter(slot => slot.id !== slotId));
      setSuccessMessage("Availability slot deleted successfully");
      
      // Notify parent component of the change
      if (onAvailabilityChange) {
        onAvailabilityChange();
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
