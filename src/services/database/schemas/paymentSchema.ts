export const paymentSchema = {
  title: "Payment Schema",
  version: 0,
  description: "Schema for payment records",
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
    amount: {
      type: "number",
      minimum: 0,
    },
    status: {
      type: "string",
      enum: ["pending", "completed", "refunded"],
      default: "pending",
      maxLength: 20,
    },
    date: {
      type: "string",
      maxLength: 50,
    },
    transactionId: {
      type: "string",
      maxLength: 100,
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
    "amount",
    "status",
    "date",
    "transactionId",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    ["sessionId", "id"],
    ["mentorId", "id"],
    ["menteeId", "id"],
    ["status", "id"],
  ],
};
