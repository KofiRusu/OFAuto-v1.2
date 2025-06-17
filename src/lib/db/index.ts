// Stubbed DB module to satisfy imports during testing
export const dbStub = {
  query: async () => ({}),
  close: async () => {},
};

// Stubbed prisma export to satisfy imports
export const prisma = {
  client: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  // Add other prisma methods as needed
};

// Stubbed db export for drizzle
export const db = dbStub;

// Stubbed schema export
export const schema = {};

export default dbStub; 