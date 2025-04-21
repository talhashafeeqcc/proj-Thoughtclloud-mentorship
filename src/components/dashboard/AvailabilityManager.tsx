import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaCalendarPlus, FaTrash, FaCalendarAlt } from "react-icons/fa";
import { AvailabilitySlot } from "../../types";
import {
  getMentorById,
  getMentorAvailabilitySlots,
  addAvailabilitySlot,
  deleteAvailabilitySlot
} from "../../services/mentorService";
import ConfirmationModal from '../shared/ConfirmationModal';

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

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [removingSlotId, setRemovingSlotId] = useState<string | null>(null);

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
            `This time slot overlaps with an existing slot (${slot.startTime} - ${slot.endTime})${slot.isBooked ? " which is already booked" : ""
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

  const handleRemoveClick = (slotId: string) => {
    setShowDeleteModal(slotId);
  };

  const confirmRemoveSlot = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!showDeleteModal) return;
    setRemovingSlotId(showDeleteModal);

    try {
      // Use the existing imported function instead of direct database access
      await deleteAvailabilitySlot(showDeleteModal);

      // Update local state
      setAvailabilitySlots(availabilitySlots.filter(slot => slot.id !== showDeleteModal));
      setSuccessMessage("Availability slot deleted successfully");

      // Notify parent component of the change
      if (onAvailabilityChange) {
        onAvailabilityChange();
      }

      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error removing slot:', error);
      setError('Failed to remove availability slot. Please try again.');
    } finally {
      setRemovingSlotId(null);
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!showDeleteModal}
        title="Remove Availability Slot"
        message="Are you sure you want to remove this availability slot? Any pending bookings for this slot will be affected."
        confirmText="Yes, Remove Slot"
        cancelText="No, Keep Slot"
        onConfirm={confirmRemoveSlot}
        onCancel={() => setShowDeleteModal(null)}
        type="warning"
      />

      <div className="space-y-6 p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-lg">
        <h2 className="text-xl font-semibold dark:text-white flex items-center">
          <FaCalendarPlus className="mr-2 text-blue-500 dark:text-blue-400" /> Manage Your Availability
        </h2>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-400 p-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-400 p-4 rounded">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Form for adding slots */}
        <form onSubmit={handleAddSlot} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 dark:text-white">Add Availability Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label
                htmlFor="date"
                className="block mb-2 text-sm font-medium dark:text-gray-300"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]} // Don't allow past dates
                className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block mb-2 text-sm font-medium dark:text-gray-300"
              >
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block mb-2 text-sm font-medium dark:text-gray-300">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add Slot"
              )}
            </button>
          </div>
        </form>

        {/* Display existing slots */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4 dark:text-white flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500 dark:text-blue-400" /> Your Available Slots
          </h3>

          {loading ? (
            <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="dark:text-gray-300">Loading availability slots...</p>
            </div>
          ) : availabilitySlots.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">No availability slots added yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Add your first slot using the form above.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDates.map((date) => (
                <div key={date} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium dark:text-white">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h4>
                  </div>

                  <div className="divide-y dark:divide-gray-700">
                    {groupedSlots[date].map((slot) => (
                      <div
                        key={slot.id}
                        className="py-3 px-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <span className="dark:text-gray-300 flex items-center">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                            <FaCalendarAlt className="text-blue-500 dark:text-blue-400 text-xs" />
                          </span>
                          {slot.startTime} - {slot.endTime}
                          {slot.isBooked && (
                            <span className="ml-3 text-xs px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full font-medium">
                              Booked
                            </span>
                          )}
                        </span>

                        {!slot.isBooked && (
                          <button
                            onClick={() => handleRemoveClick(slot.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete slot"
                            disabled={removingSlotId === slot.id}
                          >
                            {removingSlotId === slot.id ? (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full animate-pulse">
                                Removing...
                              </span>
                            ) : (
                              <FaTrash />
                            )}
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
    </>
  );
};

export default AvailabilityManager;
