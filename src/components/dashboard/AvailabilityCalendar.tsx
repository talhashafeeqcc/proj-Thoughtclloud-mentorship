import React, { useState, useEffect } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { getMentorProfileById } from '../../services/userService'; // Import userService functions
import { AvailabilitySlot } from '../../types';

interface AvailabilityCalendarProps {
  mentorId: string;
  onSlotSelect: (slot: AvailabilitySlot | null) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ mentorId, onSlotSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDaySlots, setSelectedDaySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // Track selected day

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getMentorProfileById(mentorId);
        if (profile && profile.availabilitySlots) {
          // Filter slots for the currently selected month and year
          const filteredSlots = profile.availabilitySlots.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate.getMonth() === selectedDate.getMonth() &&
                   slotDate.getFullYear() === selectedDate.getFullYear();
          });
          setAvailabilitySlots(filteredSlots);
        } else {
          setAvailabilitySlots([]); // No slots or profile found, set to empty array
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [mentorId, selectedDate]); // Refetch slots when mentorId or selectedDate changes


  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
    setSelectedDay(null); // Reset selected day when month changes
    setSelectedDaySlots([]); // Clear displayed slots
    onSlotSelect(null); // Clear selected slot
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
    setSelectedDay(null); // Reset selected day when month changes
    setSelectedDaySlots([]); // Clear displayed slots
    onSlotSelect(null); // Clear selected slot
  };

  const currentMonthName = selectedDate.toLocaleString('default', { month: 'long' });
  const currentYear = selectedDate.getFullYear();
  const days = daysInMonth(selectedDate);
  const startDay = firstDayOfMonth(selectedDate);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2 border text-gray-300"></div>);
  }

  const handleDayClick = (day: number, hasSlots: boolean, formattedDate: string) => {
    setSelectedDay(day);
    setSelectedDaySlots([]); // Clear previously selected slots
    onSlotSelect(null); // Clear any previously selected slot

    if (hasSlots) {
      const slotsForDay = availabilitySlots.filter(slot => slot.date === formattedDate);
      setSelectedDaySlots(slotsForDay);
    }
  };

  const handleSlotClick = (slot: AvailabilitySlot) => {
    onSlotSelect(slot); // Pass the selected slot to the parent component
  };


  // Add days of the month
  for (let day = 1; day <= days; day++) {
    const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if there are slots for this day
    const hasSlots = availabilitySlots.some(slot => slot.date === formattedDate);
    const isSelectedDay = day === selectedDay;


    calendarDays.push(
      <div
        key={`day-${day}`}
        className={`p-2 border hover:bg-gray-100 cursor-pointer ${hasSlots ? 'bg-green-100' : ''} ${isSelectedDay ? 'bg-blue-200' : ''}`}
        onClick={() => handleDayClick(day, hasSlots, formattedDate)}
      >
        {day}
      </div>
    );
  }

  if (loading) {
    return <div>Loading availability...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading availability: {error}</div>;
  }


  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FaCalendarAlt className="mr-2" /> {currentMonthName} {currentYear}
        </h2>
        <div className="space-x-2">
          <button onClick={prevMonth} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"><</button>
          <button onClick={nextMonth} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded">></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map(day => <div key={day} className="p-2 font-semibold">{day}</div>)}
        {calendarDays}
      </div>

      {/* Display time slots for the selected day */}
      {selectedDaySlots.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Available Slots for {selectedDate.toLocaleDateString()}</h3>
          <ul className="grid grid-cols-2 gap-2">
            {selectedDaySlots.map(slot => (
              <li
                key={slot.id}
                className="bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
                onClick={() => handleSlotClick(slot)} // Handle slot click
              >
                {slot.startTime} - {slot.endTime}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDaySlots.length === 0 && selectedDay && (
        <div className="mt-4 text-gray-500">
          No slots available for {selectedDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
