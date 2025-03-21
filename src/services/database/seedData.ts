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

  // Create users
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

  // Insert users
  await db.users.bulkInsert([johnUser, aliceUser, janeUser]);

  // Create mentor profiles
  const johnMentor = {
    id: uuidv4(),
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

  // Create mentee profile
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

  // Insert mentee profile
  await db.mentees.bulkInsert([janeMentee]);

  // Create availability slots for John
  const johnAvailability = [
    {
      id: uuidv4(),
      mentorId: johnMentor.id,
      date: "2023-06-15",
      startTime: "10:00",
      endTime: "10:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: johnMentor.id,
      date: "2023-06-15",
      startTime: "11:00",
      endTime: "11:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: johnMentor.id,
      date: "2023-06-16",
      startTime: "14:00",
      endTime: "14:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: johnMentor.id,
      date: "2023-06-16",
      startTime: "15:00",
      endTime: "15:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Create availability slots for Alice
  const aliceAvailability = [
    {
      id: uuidv4(),
      mentorId: aliceMentor.id,
      date: "2023-06-15",
      startTime: "13:00",
      endTime: "13:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: aliceMentor.id,
      date: "2023-06-15",
      startTime: "14:00",
      endTime: "14:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: aliceMentor.id,
      date: "2023-06-16",
      startTime: "10:00",
      endTime: "10:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      mentorId: aliceMentor.id,
      date: "2023-06-16",
      startTime: "11:00",
      endTime: "11:45",
      isBooked: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Insert availability slots
  await db.availability.bulkInsert([...johnAvailability, ...aliceAvailability]);

  console.log("Database seeded successfully!");
};
