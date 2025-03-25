import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaLock,
  FaCheck,
} from "react-icons/fa";
import { AvailabilitySlot } from "../../types";
import { getDatabase } from "../../services/database/db";
import { useSession } from "../../context/SessionContext";

interface AvailabilityCalendarProps {
  mentorId: string;
  onSlotSelect: (slot: AvailabilitySlot | null) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  mentorId,
  onSlotSelect,
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

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching availability for calendar, mentorId:", mentorId);

        // Get availability from the dedicated availability collection
        const db = await getDatabase();
        const availabilityDocs = await db.availability
          .find({
            selector: {
              mentorId: mentorId,
            },
          })
          .exec();

        if (availabilityDocs.length === 0) {
          console.log("No availability slots found for mentor:", mentorId);
          setAvailabilitySlots([]);
          return;
        }

        // Map to AvailabilitySlot type with proper type handling
        const slots = availabilityDocs.map(doc => {
          const data = doc.toJSON();
          return {
            id: data.id,
            date: data.date || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            isBooked: !!data.isBooked,
            mentorId: data.mentorId
          } as AvailabilitySlot;
        });

        console.log("All availability slots:", slots.length);

        // Separate available and booked slots
        const booked = slots.filter(slot => slot.isBooked);
        const available = slots.filter(slot => !slot.isBooked);

        // Filter available slots for the currently selected month and year
        const filteredAvailableSlots = available.filter((slot) => {
          const slotDate = new Date(slot.date);
          return (
            slotDate.getMonth() === selectedDate.getMonth() &&
            slotDate.getFullYear() === selectedDate.getFullYear()
          );
        });

        // Filter booked slots for the currently selected month and year
        const filteredBookedSlots = booked.filter((slot) => {
          const slotDate = new Date(slot.date);
          return (
            slotDate.getMonth() === selectedDate.getMonth() &&
            slotDate.getFullYear() === selectedDate.getFullYear()
          );
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
  }, [mentorId, selectedDate, sessions]); // Refetch when sessions change too

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

    const slotsForDay = availabilitySlots.filter(
      (slot) => slot.date === formattedDate
    );
    
    // Include booked slots in the display but make them unselectable
    const bookedSlotsForDay = bookedSlots.filter(
      (slot) => slot.date === formattedDate
    );
    
    // Combine available and booked slots for display
    const allSlotsForDay = [...slotsForDay, ...bookedSlotsForDay];
    
    if (allSlotsForDay.length > 0) {
      console.log("All slots for selected day:", formattedDate, allSlotsForDay);
      setSelectedDaySlots(allSlotsForDay);
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

    // Format as YYYY-MM-DD
    const formattedDate = currentDate.toISOString().split("T")[0];

    // Check if there are available or booked slots for this day
    const hasAvailableSlots = availabilitySlots.some(
      (slot) => slot.date === formattedDate
    );
    
    const hasBookedSlots = bookedSlots.some(
      (slot) => slot.date === formattedDate
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
        <div className="space-x-2">
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
    </div>
  );
};

export default AvailabilityCalendar;
