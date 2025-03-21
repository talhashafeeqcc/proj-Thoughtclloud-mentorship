import React, { useState } from 'react';

    interface BookingModalProps {
      show: boolean;
      onClose: () => void;
      onBook: (date: string, startTime: string, endTime: string) => void;
      mentorName: string;
    }

    const BookingModal: React.FC<BookingModalProps> = ({ show, onClose, onBook, mentorName }) => {
      const [date, setDate] = useState('');
      const [startTime, setStartTime] = useState('');
      const [endTime, setEndTime] = useState('');
      const [error, setError] = useState<string | null>(null);

      const handleBook = () => {
        // Basic validation
        if (!date || !startTime || !endTime) {
          setError('Please fill in all fields.');
          return;
        }

        // Simple date/time validation (you'd want more robust validation in a real app)
        const startDate = new Date(`${date}T${startTime}`);
        const endDate = new Date(`${date}T${endTime}`);

        if (endDate <= startDate) {
          setError('End time must be after start time.');
          return;
        }

        setError(null);
        onBook(date, startTime, endTime);
      };

      if (!show) {
        return null;
      }

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Book Session with {mentorName}</h2>
            <div className="mb-4">
              <label htmlFor="date" className="block text-gray-700">Date:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="startTime" className="block text-gray-700">Start Time:</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="endTime" className="block text-gray-700">End Time:</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border rounded w-full p-2"
              />
            </div>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="flex justify-end">
              <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">Cancel</button>
              <button onClick={handleBook} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Book</button>
            </div>
          </div>
        </div>
      );
    };

    export default BookingModal;
