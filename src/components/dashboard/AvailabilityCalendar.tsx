import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaLock,
  FaCheck,
  FaSyncAlt
} from "react-icons/fa";
import { AvailabilitySlot } from "../../types";
// import { getDatabase } from "../../services/database/db";
import { useSession } from "../../context/SessionContext";
import { getMentorAvailabilitySlots } from "../../services/mentorService";

// Add a helper function to normalize date formats
const normalizeDateFormat = (dateStr: string): string => {
  if (!dateStr) return "";
  // If the date includes a T (ISO format with time), strip it
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
};

interface AvailabilityCalendarProps {
  mentorId: string;
  onSlotSelect: (slot: AvailabilitySlot | null) => void;
  versionKey?: number; // Optional prop to force re-fetch when it changes
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  mentorId,
  onSlotSelect,
  versionKey = 0, // Default to 0 if not provided
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDaySlots, setSelectedDaySlots] = useState<AvailabilitySlot[]>(
    []
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<AvailabilitySlot[]>([]);
  const { sessionState } = useSession();
  const { sessions } = sessionState;

  // Add debug state
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching availability for calendar, mentorId:", mentorId, "versionKey:", versionKey);
        
        if (!mentorId) {
          console.error("Cannot fetch availability: mentorId is empty");
          setError("Mentor ID is missing");
          setLoading(false);
          return;
        }

        // Use the dedicated function for fetching availability slots
        const slots = await getMentorAvailabilitySlots(mentorId);
        
        console.log("Retrieved slots:", slots);
        
        if (!Array.isArray(slots)) {
          console.error("Received invalid slots data:", slots);
          setError("Failed to retrieve availability data");
          setLoading(false);
          return;
        }
        
        if (slots.length === 0) {
          console.log("No availability slots found for mentor:", mentorId);
          setAvailabilitySlots([]);
          setBookedSlots([]);
          return;
        }

        // Normalize date formats for all slots
        const normalizedSlots = slots.map(slot => ({
          ...slot,
          date: normalizeDateFormat(slot.date)
        }));

        console.log("All availability slots (normalized):", normalizedSlots.length);

        // Separate available and booked slots
        const booked = normalizedSlots.filter(slot => slot.isBooked);
        const available = normalizedSlots.filter(slot => !slot.isBooked);

        // Filter available slots for the currently selected month and year
        const filteredAvailableSlots = available.filter((slot) => {
          if (!slot.date) return false;
          try {
            // Date should already be normalized at this point
            const slotDate = new Date(slot.date);
            
            // Check if the month and year match the selected date
            return (
              slotDate.getMonth() === selectedDate.getMonth() &&
              slotDate.getFullYear() === selectedDate.getFullYear()
            );
          } catch (e) {
            console.error("Error parsing date for slot:", slot.id, slot.date, e);
            return false;
          }
        });

        // Filter booked slots for the currently selected month and year
        const filteredBookedSlots = booked.filter((slot) => {
          if (!slot.date) return false;
          try {
            // Extract just the YYYY-MM-DD part if the date includes time components
            const dateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
            const slotDate = new Date(dateStr);
            
            // Check if the month and year match the selected date
            return (
              slotDate.getMonth() === selectedDate.getMonth() &&
              slotDate.getFullYear() === selectedDate.getFullYear()
            );
          } catch (e) {
            console.error("Error parsing date for booked slot:", slot.id, slot.date, e);
            return false;
          }
        });

        console.log(
          "Filtered available slots for current month:",
          filteredAvailableSlots.length,
          "Booked slots:",
          filteredBookedSlots.length
        );
        
        setAvailabilitySlots(filteredAvailableSlots);
        setBookedSlots(filteredBookedSlots);
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError(err.message || "Failed to load availability");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [mentorId, selectedDate, sessions, versionKey]); // Add versionKey as a dependency to trigger re-fetch

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
    );
    resetSelection();
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    );
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedDay(null);
    setSelectedDaySlots([]);
    setSelectedSlotId(null);
    onSlotSelect(null);
  };

  const currentMonthName = selectedDate.toLocaleString("default", {
    month: "long",
  });
  const currentYear = selectedDate.getFullYear();
  const days = daysInMonth(selectedDate);
  const startDay = firstDayOfMonth(selectedDate);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="p-2 border text-gray-300"></div>
    );
  }

  const handleDayClick = (
    day: number,
    formattedDate: string
  ) => {
    setSelectedDay(day);
    setSelectedDaySlots([]);
    setSelectedSlotId(null);
    onSlotSelect(null);

    console.log("Handling day click for date:", formattedDate);
    
    // Find slots with matching date, accounting for different date formats
    const slotsForDay = availabilitySlots.filter((slot) => {
      // Normalize slot date by removing any time component
      const slotDateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
      const match = slotDateStr === formattedDate;
      console.log(`Comparing slot date: ${slotDateStr} with formatted date: ${formattedDate}, match: ${match}`);
      return match;
    });
    
    // Include booked slots in the display but make them unselectable
    const bookedSlotsForDay = bookedSlots.filter((slot) => {
      // Normalize slot date by removing any time component
      const slotDateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
      return slotDateStr === formattedDate;
    });
    
    // Combine available and booked slots for display
    const allSlotsForDay = [...slotsForDay, ...bookedSlotsForDay];
    
    if (allSlotsForDay.length > 0) {
      console.log("All slots for selected day:", formattedDate, allSlotsForDay);
      setSelectedDaySlots(allSlotsForDay);
    } else {
      console.log("No slots found for day:", formattedDate);
    }
  };

  const handleSlotClick = (slot: AvailabilitySlot) => {
    setSelectedSlotId(slot.id);
    onSlotSelect(slot); // Pass the selected slot to the parent component
  };

  // Format time to be more readable
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  // Add days of the month
  for (let day = 1; day <= days; day++) {
    // Create a date object representing this day in the current month and year
    const currentDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );

    // Format as YYYY-MM-DD but handle timezone issues
    // Use direct string manipulation to avoid timezone shifts from toISOString
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    console.log(`Calendar day ${day}: formatted as ${formattedDate}`);

    // Check if there are available or booked slots for this day
    const hasAvailableSlots = availabilitySlots.some(
      (slot) => {
        // Normalize slot date format for comparison
        const slotDateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
        const match = slotDateStr === formattedDate;
        if (match) {
          console.log(`Match found for day ${day}: slot date ${slotDateStr} = formatted date ${formattedDate}`);
        }
        return match;
      }
    );
    
    const hasBookedSlots = bookedSlots.some(
      (slot) => {
        // Normalize slot date format for comparison
        const slotDateStr = slot.date.includes('T') ? slot.date.split('T')[0] : slot.date;
        return slotDateStr === formattedDate;
      }
    );
    
    const isSelectedDay = day === selectedDay;
    const today = new Date();
    const isToday =
      today.getDate() === day &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getFullYear() === selectedDate.getFullYear();
    const isPastDay = currentDate < new Date(new Date().setHours(0, 0, 0, 0));

    calendarDays.push(
      <div
        key={`day-${day}`}
        className={`p-2 border hover:bg-gray-100 cursor-pointer relative
          ${hasAvailableSlots ? "bg-green-100 hover:bg-green-200" : ""}
          ${hasBookedSlots ? "bg-purple-100 hover:bg-purple-200" : ""}
          ${hasAvailableSlots && hasBookedSlots ? "bg-gradient-to-r from-green-100 to-purple-100" : ""}
          ${isSelectedDay ? "bg-blue-200 hover:bg-blue-300 font-semibold" : ""}
          ${isToday ? "border-2 border-blue-500" : ""}
          ${isPastDay ? "opacity-50" : ""}
        `}
        onClick={() => handleDayClick(day, formattedDate)}
      >
        {day}
        <div className="flex justify-center mt-1 space-x-1">
          {hasAvailableSlots && (
            <div className="h-1 w-1 bg-green-500 rounded-full"></div>
          )}
          {hasBookedSlots && (
            <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
          )}
        </div>
      </div>
    );
  }

  // Add a manual refresh function
  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    // Just changing versionKey in parent component would trigger refresh
    // but we can also force a refetch here directly
    setLoading(true);
    // This will trigger the useEffect to re-run due to dependency on loading state
    setTimeout(() => setLoading(false), 100);
  };

  if (loading && availabilitySlots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mb-2" />
        <p>Loading availability calendar...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" /> {currentMonthName}{" "}
          {currentYear}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            {"<"}
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            {">"}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors flex items-center"
            title="Refresh availability"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map((day) => (
          <div key={day} className="p-2 font-semibold text-gray-700 bg-gray-50">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>

      {/* Display time slots for the selected day */}
      {selectedDaySlots.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <FaClock className="mr-2 text-blue-500" />
            Slots for{" "}
            {new Date(selectedDaySlots[0].date).toLocaleDateString()}
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedDaySlots.map((slot) => (
              <li
                key={slot.id}
                className={`p-3 rounded transition-all flex items-center justify-center
                  ${
                    slot.isBooked
                      ? "bg-purple-100 text-purple-800 cursor-not-allowed"
                      : selectedSlotId === slot.id
                      ? "bg-blue-500 text-white font-medium shadow-md cursor-pointer"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                  }`}
                onClick={() => !slot.isBooked && handleSlotClick(slot)}
              >
                {slot.isBooked && <FaLock className="mr-2 text-xs" />}
                {!slot.isBooked && selectedSlotId === slot.id && <FaCheck className="mr-2 text-xs" />}
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDaySlots.length === 0 && selectedDay && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md text-gray-600 flex items-center justify-center">
          <FaExclamationTriangle className="mr-2 text-yellow-500" />
          No slots available for{" "}
          {new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDay
          ).toLocaleDateString()}
        </div>
      )}

      {/* Debug Section - Only visible in development mode */}
      {window.location.hostname === 'localhost' && (
        <div className="mt-4 border-t pt-4">
          <button 
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
          
          {showDebug && (
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <div>
                <strong>MentorId:</strong> {mentorId}
              </div>
              <div>
                <strong>Version Key:</strong> {versionKey}
              </div>
              <div>
                <strong>Current Month/Year:</strong> {currentMonthName} {currentYear}
              </div>
              <div>
                <strong>Available Slots:</strong> {availabilitySlots.length}
              </div>
              <div>
                <strong>Booked Slots:</strong> {bookedSlots.length}
              </div>
              <div className="mt-2">
                <strong>All Available Slots (Raw Data):</strong>
                <ul className="mt-1 space-y-1">
                  {availabilitySlots.map(slot => (
                    <li key={slot.id} className="p-1 hover:bg-blue-50">
                      {slot.date} | {slot.startTime}-{slot.endTime} | ID: {slot.id.substring(0, 8)}...
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
