export const availabilitySchema = {
  title: "Availability Schema",
  version: 0,
  description: "Schema for mentor availability slots",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    mentorId: {
      type: "string",
      maxLength: 100,
      ref: "mentors",
    },
    date: {
      type: "string",
      maxLength: 50,
    },
    startTime: {
      type: "string",
      maxLength: 50,
    },
    endTime: {
      type: "string",
      maxLength: 50,
    },
    isBooked: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "number",
    },
    updatedAt: {
      type: "number",
    },
  },
  required: [
    "id",
    "mentorId",
    "date",
    "startTime",
    "endTime",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    ["mentorId", "id"],
    ["date", "id"],
  ],
};
