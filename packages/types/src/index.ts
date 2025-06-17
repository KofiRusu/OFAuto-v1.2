// Shared TypeScript types for OFAuto platform

// ============================================================================
// Database Models (based on Prisma schema)
// ============================================================================

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  clients?: Client[];
  posts?: Post[];
  campaigns?: Campaign[];
  integrations?: Integration[];
  automations?: Automation[];
}

export interface Client {
  id: string;
  name: string;
  platform: string;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
  posts?: Post[];
  comments?: Comment[];
}

export interface Post {
  id: string;
  content: string;
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  userId: string;
  user?: User;
  clientId: string;
  client?: Client;
  createdAt: Date;
  updatedAt: Date;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  clientId: string;
  client?: Client;
  postId?: string;
  post?: Post;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  config: Record<string, any>;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  metrics?: Record<string, any>;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Automation {
  id: string;
  name: string;
  workflow: Record<string, any>;
  status: AutomationStatus;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Enums
// ============================================================================

export enum PostStatus {
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum AutomationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused'
}

export enum IntegrationType {
  ONLYFANS = 'onlyfans',
  FANSLY = 'fansly',
  CUSTOM = 'custom'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface UserDto extends Omit<User, 'password'> {
  // Exclude password from DTOs
}

export interface CreateClientRequest {
  name: string;
  platform: string;
}

export interface CreatePostRequest {
  content: string;
  clientId: string;
  scheduledFor?: Date;
}

export interface CreateCampaignRequest {
  name: string;
  metrics?: Record<string, any>;
}

export interface CreateAutomationRequest {
  name: string;
  workflow: Record<string, any>;
}

export interface CreateIntegrationRequest {
  name: string;
  type: IntegrationType;
  config: Record<string, any>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type WithoutId<T> = Omit<T, 'id'>;
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;
export type CreateDto<T> = WithoutId<WithoutTimestamps<T>>;

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// Event Types
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  source: string;
}

export interface AutomationEvent {
  id: string;
  automationId: string;
  type: 'triggered' | 'completed' | 'failed';
  data: Record<string, any>;
  timestamp: string;
} 