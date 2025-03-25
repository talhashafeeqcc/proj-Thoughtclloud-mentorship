export const sessionSchema = {
  title: "Session Schema",
  version: 0,
  description: "Schema for mentoring sessions",
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
    menteeId: {
      type: "string",
      maxLength: 100,
      ref: "mentees",
    },
    availabilityId: {
      type: "string",
      maxLength: 100,
      ref: "availability",
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
    status: {
      type: "string",
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      maxLength: 20,
    },
    paymentStatus: {
      type: "string",
      enum: ["pending", "completed", "refunded"],
      default: "pending",
      maxLength: 20,
    },
    paymentAmount: {
      type: "number",
      default: 0,
    },
    notes: {
      type: "string",
      maxLength: 1000,
      default: "",
    },
    meetingLink: {
      type: "string",
      maxLength: 500,
      default: "",
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
    "menteeId",
    "date",
    "startTime",
    "endTime",
    "status",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    ["mentorId", "id"],
    ["menteeId", "id"],
    ["date", "id"],
    ["status", "id"],
  ],
};
