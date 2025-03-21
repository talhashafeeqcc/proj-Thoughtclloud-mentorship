export const mentorSchema = {
  title: "Mentor Schema",
  version: 0,
  description: "Schema for mentor profiles",
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
    expertise: {
      type: "array",
      items: {
        type: "string",
        maxLength: 50,
      },
      default: [],
    },
    bio: {
      type: "string",
      maxLength: 2000,
      default: "",
    },
    sessionPrice: {
      type: "number",
      default: 0,
    },
    yearsOfExperience: {
      type: "number",
      default: 0,
    },
    portfolio: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 100,
          },
          title: {
            type: "string",
            maxLength: 200,
          },
          description: {
            type: "string",
            maxLength: 1000,
          },
          link: {
            type: "string",
            maxLength: 500,
          },
          image: {
            type: "string",
            maxLength: 500,
          },
        },
      },
      default: [],
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 100,
          },
          name: {
            type: "string",
            maxLength: 200,
          },
          issuer: {
            type: "string",
            maxLength: 200,
          },
          date: {
            type: "string",
            maxLength: 50,
          },
          expiryDate: {
            type: "string",
            maxLength: 50,
          },
          link: {
            type: "string",
            maxLength: 500,
          },
        },
      },
      default: [],
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 100,
          },
          institution: {
            type: "string",
            maxLength: 200,
          },
          degree: {
            type: "string",
            maxLength: 200,
          },
          field: {
            type: "string",
            maxLength: 200,
          },
          startDate: {
            type: "string",
            maxLength: 50,
          },
          endDate: {
            type: "string",
            maxLength: 50,
          },
        },
      },
      default: [],
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 100,
          },
          company: {
            type: "string",
            maxLength: 200,
          },
          position: {
            type: "string",
            maxLength: 200,
          },
          startDate: {
            type: "string",
            maxLength: 50,
          },
          endDate: {
            type: "string",
            maxLength: 50,
          },
          description: {
            type: "string",
            maxLength: 1000,
          },
        },
      },
      default: [],
    },
    createdAt: {
      type: "number",
    },
    updatedAt: {
      type: "number",
    },
  },
  required: ["id", "userId", "createdAt", "updatedAt"],
  indexes: [["userId", "id"]],
};
