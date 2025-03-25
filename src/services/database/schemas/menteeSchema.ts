export const menteeSchema = {
  title: "Mentee Schema",
  version: 0,
  description: "Schema for mentee profiles",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    userId: {
      type: "string",
      maxLength: 100,
      ref: "users",
    },
    interests: {
      type: "array",
      items: {
        type: "string",
        maxLength: 50,
      },
      default: [],
    },
    bio: {
      type: "string",
      maxLength: 1000,
      default: "",
    },
    goals: {
      type: "array",
      items: {
        type: "string",
        maxLength: 200,
      },
      default: [],
    },
    currentPosition: {
      type: "string",
      maxLength: 200,
      default: "",
    },
    createdAt: {
      type: "number",
    },
    updatedAt: {
      type: "number",
    },
  },
  required: ["id", "userId", "createdAt", "updatedAt"],
  indexes: [
    ["userId", "id"]
  ],
};
