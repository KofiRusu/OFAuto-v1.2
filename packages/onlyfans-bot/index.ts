/**
 * OnlyFans Automation Module
 * 
 * Provides browser-based automation for OnlyFans using Puppeteer.
 * Handles session management, post creation, and DM interactions.
 */

import loginAndSaveSession from './loginAndSaveSession';
import { createPost, PostConfig, PostResult } from './onlyfansAutomation';
import { handleDMs, ChatConfig, ChatResult } from './chatAutomation';
import {
  validateSession,
  sessionExists,
  isSessionExpired,
  loadSession,
  saveSession,
  OnlyFansSession
} from './utils/session';

/**
 * OnlyFans automation task configuration
 */
export interface OnlyFansTaskConfig {
  accountId?: string;
  taskType: 'post' | 'chat';
  postConfig?: PostConfig;
  chatConfig?: ChatConfig;
}

/**
 * OnlyFans task execution result
 */
export interface OnlyFansTaskResult {
  success: boolean;
  error?: string;
  taskType: 'post' | 'chat';
  postResult?: PostResult;
  chatResult?: ChatResult;
}

/**
 * Login to OnlyFans and save session
 * @param accountId Optional account ID for multi-account support
 */
export async function login(accountId?: string): Promise<boolean> {
  try {
    await loginAndSaveSession(accountId);
    return true;
  } catch (error) {
    console.error('Failed to login to OnlyFans:', error);
    return false;
  }
}

/**
 * Check if a valid session exists
 * @param accountId Optional account ID
 */
export async function hasValidSession(accountId?: string): Promise<boolean> {
  try {
    // First check if session file exists
    const exists = await sessionExists(accountId);
    if (!exists) return false;
    
    // If it exists, validate the session
    return await validateSession(accountId);
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Create a post on OnlyFans
 * @param config Post configuration
 */
export async function createOnlyFansPost(config: PostConfig): Promise<PostResult> {
  return createPost(config);
}

/**
 * Handle OnlyFans DMs
 * @param config Chat automation configuration
 */
export async function handleOnlyFansDMs(config: ChatConfig = {}): Promise<ChatResult> {
  return handleDMs(config);
}

/**
 * Execute OnlyFans task based on task config
 * This is the main entry point for OFAuto integration
 */
export async function executeTask(
  taskConfig: OnlyFansTaskConfig
): Promise<OnlyFansTaskResult> {
  try {
    // Check if session is valid
    const isValid = await hasValidSession(taskConfig.accountId);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid or expired session. Please run login() first.',
        taskType: taskConfig.taskType
      };
    }
    
    // Execute the specific task
    if (taskConfig.taskType === 'post' && taskConfig.postConfig) {
      const postResult = await createOnlyFansPost({
        ...taskConfig.postConfig,
        accountId: taskConfig.accountId
      });
      
      return {
        success: postResult.success,
        error: postResult.error,
        taskType: 'post',
        postResult
      };
    } else if (taskConfig.taskType === 'chat') {
      const chatResult = await handleOnlyFansDMs({
        ...taskConfig.chatConfig,
        accountId: taskConfig.accountId
      });
      
      return {
        success: chatResult.success,
        error: chatResult.error,
        taskType: 'chat',
        chatResult
      };
    } else {
      return {
        success: false,
        error: 'Invalid task type or missing configuration',
        taskType: taskConfig.taskType
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Task execution failed: ${error.message}`,
      taskType: taskConfig.taskType
    };
  }
}

// Export the relevant types and functions
export {
  // Main functionality
  loginAndSaveSession,
  createPost,
  handleDMs,
  
  // Types
  PostConfig,
  PostResult,
  ChatConfig,
  ChatResult,
  OnlyFansSession,
  
  // Session utilities
  validateSession,
  sessionExists,
  isSessionExpired,
  loadSession,
  saveSession
};

// Default export for convenience
export default {
  login,
  hasValidSession,
  createPost: createOnlyFansPost,
  handleDMs: handleOnlyFansDMs,
  executeTask
}; 