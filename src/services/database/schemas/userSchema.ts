export const userSchema = {
  title: "User Schema",
  version: 0,
  description: "Schema for users in the system",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    email: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
      maxLength: 100,
    },
    role: {
      type: "string",
      enum: ["mentor", "mentee", "admin"],
      maxLength: 20,
    },
    password: {
      type: "string",
      maxLength: 200, // Allow for hashed passwords which are longer
    },
    profilePicture: {
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
    "email",
    "name",
    "role",
    "password",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    ["email", "id"],
    ["role", "id"],
  ],
};
