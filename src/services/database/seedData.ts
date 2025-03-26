import { v4 as uuidv4 } from "uuid";
import type { ThoughtclloudDatabase } from "./db";

// Simple password hashing function
// In a real app, you should use a proper hashing library like bcrypt
const hashPassword = (password: string): string => {
  // This is NOT a secure hash - use only for demo
  return `hashed_${password}_${Date.now()}`;
};

export const seedDatabase = async (db: ThoughtclloudDatabase) => {
  const now = Date.now();

  console.log("Seeding database with initial data");

  // Create users with fixed IDs for debugging
  const johnUser = {
    id: uuidv4(),
    email: "john.mentor@example.com",
    name: "John Mentor",
    role: "mentor" as const,
    password: hashPassword("password123"),
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    createdAt: now,
    updatedAt: now,
  };

  // Use fixed ID for Alice to match the one in the error message
  const aliceUser = {
    id: uuidv4(),
    email: "alice.mentor@example.com",
    name: "Alice Mentor",
    role: "mentor" as const,
    password: hashPassword("password123"),
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    createdAt: now,
    updatedAt: now,
  };

  const janeUser = {
    id: uuidv4(),
    email: "jane.mentee@example.com",
    name: "Jane Mentee",
    role: "mentee" as const,
    password: hashPassword("password123"),
    profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
    createdAt: now,
    updatedAt: now,
  };

  const tomUser = {
    id: uuidv4(),
    email: "tom.mentee@example.com",
    name: "Tom Mentee",
    role: "mentee" as const,
    password: hashPassword("password123"),
    profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
    createdAt: now,
    updatedAt: now,
  };

  // Admin user
  const adminUser = {
    id: uuidv4(),
    email: "admin@thoughtclloud.com",
    name: "Admin User",
    role: "admin" as const,
    password: hashPassword("admin123"),
    profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
    createdAt: now,
    updatedAt: now,
  };

  // Insert users
  await db.users.bulkInsert([
    johnUser,
    aliceUser,
    janeUser,
    tomUser,
    adminUser,
  ]);

  // Create mentor profiles with fixed IDs for debugging
  // Using the mentorId from the error message for debugging
  const johnMentor = {
    id: "cdbbf668-c542-4b50-a0b6-4b2dd3015496", // Fixed ID matching the error message
    userId: johnUser.id,
    expertise: ["React", "JavaScript", "Node.js"],
    bio: "Senior developer with 10+ years of experience in web development.",
    sessionPrice: 75,
    yearsOfExperience: 10,
    portfolio: [
      {
        id: uuidv4(),
        title: "E-commerce Platform",
        description:
          "Built a full-stack e-commerce platform using React and Node.js",
        link: "https://example.com/project1",
        image: "https://via.placeholder.com/300",
      },
    ],
    certifications: [
      {
        id: uuidv4(),
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        date: "2022-01-15",
        expiryDate: "2025-01-15",
        link: "https://example.com/certification1",
      },
    ],
    education: [
      {
        id: uuidv4(),
        institution: "Stanford University",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2010-09-01",
        endDate: "2014-06-01",
      },
    ],
    workExperience: [
      {
        id: uuidv4(),
        company: "Tech Solutions Inc.",
        position: "Senior Developer",
        startDate: "2019-03-01",
        description:
          "Leading development of web applications for enterprise clients.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const aliceMentor = {
    id: uuidv4(),
    userId: aliceUser.id,
    expertise: ["Python", "Data Science", "Machine Learning"],
    bio: "Data scientist with expertise in machine learning and AI.",
    sessionPrice: 90,
    yearsOfExperience: 8,
    portfolio: [
      {
        id: uuidv4(),
        title: "Predictive Analytics Tool",
        description:
          "Developed a predictive analytics tool for healthcare industry",
        link: "https://example.com/project2",
        image: "https://via.placeholder.com/300",
      },
    ],
    certifications: [
      {
        id: uuidv4(),
        name: "TensorFlow Developer Certificate",
        issuer: "Google",
        date: "2023-03-20",
        link: "https://example.com/certification2",
      },
    ],
    education: [
      {
        id: uuidv4(),
        institution: "MIT",
        degree: "Master of Science",
        field: "Artificial Intelligence",
        startDate: "2014-09-01",
        endDate: "2016-06-01",
      },
    ],
    workExperience: [
      {
        id: uuidv4(),
        company: "AI Innovations",
        position: "Lead Data Scientist",
        startDate: "2020-05-01",
        description:
          "Leading a team of data scientists developing ML models for various applications.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  // Insert mentor profiles
  await db.mentors.bulkInsert([johnMentor, aliceMentor]);

  // Create mentee profiles with fixed IDs for debugging
  const janeMentee = {
    id: uuidv4(),
    userId: janeUser.id,
    interests: ["Web Development", "Machine Learning"],
    bio: "Junior developer looking to improve my skills.",
    goals: ["Learn React", "Become a full-stack developer"],
    currentPosition: "Junior Frontend Developer",
    createdAt: now,
    updatedAt: now,
  };

  // Using the menteeId from the error message for debugging
  const tomMentee = {
    id: "3eda177b-df37-46f2-91fe-034c4c822265", // Fixed ID matching the error message
    userId: tomUser.id,
    interests: ["Data Science", "AI", "Python"],
    bio: "Computer science graduate interested in machine learning.",
    goals: ["Learn data analysis", "Build ML models"],
    currentPosition: "Data Analyst Intern",
    createdAt: now,
    updatedAt: now,
  };

  // Insert mentee profiles
  await db.mentees.bulkInsert([janeMentee, tomMentee]);

  // Create availability slots for John - current date and upcoming days
  const today = new Date();
  const formatDate = (date: Date): string => {
    // Format date as YYYY-MM-DD for consistency with schema
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDate = formatDate(today);

  // Tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDate = formatDate(tomorrow);

  // Day after tomorrow's date
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);
  const dayAfterTomorrowDate = formatDate(dayAfterTomorrow);

  // Past date (7 days ago)
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 7);
  const sevenDaysAgo = formatDate(pastDate);

  // Helper function to format time
  const formatTime = (hours: number, minutes: number): string => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const johnAvailabilitySlot1 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: currentDate,
    startTime: formatTime(10, 0),
    endTime: formatTime(10, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const johnAvailabilitySlot2 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: currentDate,
    startTime: formatTime(11, 0),
    endTime: formatTime(11, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const johnAvailabilitySlot3 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: tomorrowDate,
    startTime: formatTime(14, 0),
    endTime: formatTime(14, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const johnAvailabilitySlot4 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: tomorrowDate,
    startTime: formatTime(15, 0),
    endTime: formatTime(15, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const johnAvailabilitySlot5 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: sevenDaysAgo,
    startTime: formatTime(9, 0),
    endTime: formatTime(9, 45),
    isBooked: true,
    createdAt: now,
    updatedAt: now,
  };

  const johnAvailabilitySlot6 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    date: dayAfterTomorrowDate,
    startTime: formatTime(11, 0),
    endTime: formatTime(11, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  // Create availability slots for Alice with proper formatting
  const aliceAvailabilitySlot1 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: currentDate,
    startTime: formatTime(13, 0),
    endTime: formatTime(13, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const aliceAvailabilitySlot2 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: currentDate,
    startTime: formatTime(14, 0),
    endTime: formatTime(14, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const aliceAvailabilitySlot3 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: tomorrowDate,
    startTime: formatTime(10, 0),
    endTime: formatTime(10, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const aliceAvailabilitySlot4 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: tomorrowDate,
    startTime: formatTime(11, 0),
    endTime: formatTime(11, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  const aliceAvailabilitySlot5 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: sevenDaysAgo,
    startTime: formatTime(13, 0),
    endTime: formatTime(13, 45),
    isBooked: true,
    createdAt: now,
    updatedAt: now,
  };

  const aliceAvailabilitySlot6 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    date: dayAfterTomorrowDate,
    startTime: formatTime(14, 0),
    endTime: formatTime(14, 45),
    isBooked: false,
    createdAt: now,
    updatedAt: now,
  };

  // Insert all availability slots
  const availabilitySlots = [
    johnAvailabilitySlot1,
    johnAvailabilitySlot2,
    johnAvailabilitySlot3,
    johnAvailabilitySlot4,
    johnAvailabilitySlot5,
    johnAvailabilitySlot6,
    aliceAvailabilitySlot1,
    aliceAvailabilitySlot2,
    aliceAvailabilitySlot3,
    aliceAvailabilitySlot4,
    aliceAvailabilitySlot5,
    aliceAvailabilitySlot6,
  ];

  await db.availability.bulkInsert(availabilitySlots);

  // Create sample completed sessions with proper date formatting
  const completedSession1 = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    menteeId: janeMentee.id,
    date: sevenDaysAgo,
    startTime: formatTime(9, 0),
    endTime: formatTime(9, 45),
    status: "completed",
    paymentStatus: "completed",
    paymentAmount: johnMentor.sessionPrice,
    notes: "React fundamentals session",
    meetingLink: "https://meet.example.com/abc123",
    availabilityId: johnAvailabilitySlot5.id,
    createdAt: now - 1000000,
    updatedAt: now - 500000,
  };

  const completedSession2 = {
    id: uuidv4(),
    mentorId: aliceMentor.id,
    menteeId: tomMentee.id,
    date: sevenDaysAgo,
    startTime: formatTime(13, 0),
    endTime: formatTime(13, 45),
    status: "completed",
    paymentStatus: "completed",
    paymentAmount: aliceMentor.sessionPrice,
    notes: "Introduction to machine learning",
    meetingLink: "https://meet.example.com/def456",
    availabilityId: aliceAvailabilitySlot5.id,
    createdAt: now - 1000000,
    updatedAt: now - 500000,
  };

  // Add a pending session with proper date formatting
  const pendingSession = {
    id: uuidv4(),
    mentorId: johnMentor.id,
    menteeId: tomMentee.id,
    date: tomorrowDate,
    startTime: formatTime(16, 0),
    endTime: formatTime(16, 45),
    status: "scheduled",
    paymentStatus: "pending",
    paymentAmount: johnMentor.sessionPrice,
    notes: "Discuss advanced React concepts",
    meetingLink: "https://meet.example.com/abc123",
    availabilityId: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  // Insert sessions
  await db.sessions.bulkInsert([
    completedSession1,
    completedSession2,
    pendingSession,
  ]);

  // Create sample payments for the completed sessions
  const payment1 = {
    id: uuidv4(),
    sessionId: completedSession1.id,
    mentorId: johnMentor.id,
    menteeId: janeMentee.id,
    amount: johnMentor.sessionPrice,
    status: "completed",
    date: sevenDaysAgo,
    transactionId: `tx_${Math.random().toString(36).substring(2, 15)}`,
    createdAt: now - 995000,
    updatedAt: now - 995000,
  };

  const payment2 = {
    id: uuidv4(),
    sessionId: completedSession2.id,
    mentorId: aliceMentor.id,
    menteeId: tomMentee.id,
    amount: aliceMentor.sessionPrice,
    status: "completed",
    date: sevenDaysAgo,
    transactionId: `tx_${Math.random().toString(36).substring(2, 15)}`,
    createdAt: now - 995000,
    updatedAt: now - 995000,
  };

  // Insert payments
  await db.payments.bulkInsert([payment1, payment2]);

  // Create sample ratings
  const rating1 = {
    id: uuidv4(),
    sessionId: completedSession1.id,
    mentorId: johnMentor.id,
    menteeId: janeMentee.id,
    score: 5,
    review:
      "Great session! John explained React concepts clearly and provided practical examples.",
    date: sevenDaysAgo,
    createdAt: now - 490000,
    updatedAt: now - 490000,
  };

  const rating2 = {
    id: uuidv4(),
    sessionId: completedSession2.id,
    mentorId: aliceMentor.id,
    menteeId: tomMentee.id,
    score: 4,
    review:
      "Alice is very knowledgeable about machine learning. Would recommend!",
    date: sevenDaysAgo,
    createdAt: now - 490000,
    updatedAt: now - 490000,
  };

  // Insert ratings
  await db.ratings.bulkInsert([rating1, rating2]);

  console.log("Database seeded successfully!");
};
