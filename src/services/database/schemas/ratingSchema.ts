export const ratingSchema = {
  title: "Rating Schema",
  version: 0,
  description: "Schema for mentor ratings and reviews",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    sessionId: {
      type: "string",
      maxLength: 100,
      ref: "sessions",
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
    score: {
      type: "number",
      minimum: 1,
      maximum: 5,
    },
    review: {
      type: "string",
      maxLength: 1000,
      default: "",
    },
    date: {
      type: "string",
      maxLength: 50,
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
    "sessionId",
    "mentorId",
    "menteeId",
    "score",
    "date",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    ["mentorId", "id"],
    ["menteeId", "id"],
    ["sessionId", "id"],
  ],
};
