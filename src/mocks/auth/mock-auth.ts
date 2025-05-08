/**
 * Mock auth implementation for OFAuto development
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

// Define types
export interface MockUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  role: UserRole;
  image?: string;
}

// Mock users
const mockUsers: MockUser[] = [
  {
    id: 'mock-admin-id',
    clerkId: 'test_admin_clerk_id',
    email: 'admin@test.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    image: 'https://via.placeholder.com/150'
  },
  {
    id: 'mock-manager-id',
    clerkId: 'test_manager_clerk_id',
    email: 'manager@test.com',
    name: 'Manager User',
    role: UserRole.MANAGER,
    image: 'https://via.placeholder.com/150'
  },
  {
    id: 'mock-user-id',
    clerkId: 'test_user_clerk_id',
    email: 'user@test.com',
    name: 'Regular User',
    role: UserRole.USER,
    image: 'https://via.placeholder.com/150'
  }
];

// Current mock user - default to regular user
let currentMockUser: MockUser = mockUsers[2];

/**
 * Get the current mock user
 */
export function getCurrentMockUser(): MockUser {
  return currentMockUser;
}

/**
 * Set the current mock user by role
 */
export function setMockUserByRole(role: UserRole): MockUser {
  const user = mockUsers.find(u => u.role === role);
  if (user) {
    currentMockUser = user;
    console.log(`[Mock Auth] Switched to ${role} user:`, user);
    return user;
  }
  
  console.error(`[Mock Auth] No user found with role ${role}`);
  return currentMockUser;
}

/**
 * Set the current mock user by ID
 */
export function setMockUserById(id: string): MockUser {
  const user = mockUsers.find(u => u.id === id || u.clerkId === id);
  if (user) {
    currentMockUser = user;
    console.log(`[Mock Auth] Switched to user:`, user);
    return user;
  }
  
  console.error(`[Mock Auth] No user found with ID ${id}`);
  return currentMockUser;
}

/**
 * Mock login
 */
export function mockLogin(email: string, password: string): MockUser | null {
  // In a real app we would validate the password
  // For mock purposes, any password works
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    currentMockUser = user;
    console.log(`[Mock Auth] Logged in as:`, user);
    return user;
  }
  
  console.error(`[Mock Auth] No user found with email ${email}`);
  return null;
}

/**
 * Mock logout
 */
export function mockLogout(): void {
  // Just reset to the default user
  currentMockUser = mockUsers[2];
  console.log(`[Mock Auth] Logged out`);
}

/**
 * Get all available mock users
 */
export function getAllMockUsers(): MockUser[] {
  return [...mockUsers];
} 