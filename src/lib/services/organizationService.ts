import { DEFAULT_ORG_SETTINGS } from '../schemas/organization';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';

/**
 * Organization Service
 * 
 * Handles organization-related functionality such as:
 * - Generating and validating referral codes
 * - Managing organization settings
 */
class OrganizationService {
  /**
   * Generate a unique referral code for a client
   * @param clientId The client ID to generate a code for
   * @param prisma Prisma client instance
   * @returns The generated referral code
   */
  async createReferralCode(clientId: string, prisma: PrismaClient): Promise<string> {
    // Get client to include in code prefix
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true }
    });
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Create a prefix based on the client name (first 3 chars)
    const namePrefix = client.name
      .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric chars
      .substring(0, 3)              // Take first 3 chars
      .toUpperCase();               // Uppercase for consistency
    
    // Generate a 6-character unique ID using nanoid
    const uniqueId = nanoid(6);
    
    // Combine to make a readable but unique code
    const referralCode = `${namePrefix}-${uniqueId}`;
    
    // Check if this code already exists (very unlikely but possible)
    const existingClient = await prisma.client.findUnique({
      where: { referralCode },
    });
    
    // If code exists, recursively try again
    if (existingClient) {
      return this.createReferralCode(clientId, prisma);
    }
    
    // Update the client with the new referral code
    await prisma.client.update({
      where: { id: clientId },
      data: { referralCode },
    });
    
    return referralCode;
  }
  
  /**
   * Merge default settings with existing settings
   * @param existingSettings Current organization settings
   * @returns Merged settings with defaults
   */
  mergeWithDefaultSettings(existingSettings: Record<string, any> | null): Record<string, any> {
    if (!existingSettings) {
      return DEFAULT_ORG_SETTINGS;
    }
    
    // Deep merge the existing settings with defaults
    return this.deepMerge(DEFAULT_ORG_SETTINGS, existingSettings);
  }
  
  /**
   * Deep merge two objects
   * @param target Target object
   * @param source Source object to merge in
   * @returns Merged object
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  /**
   * Check if value is an object
   * @param item Value to check
   * @returns Whether the value is an object
   */
  private isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  /**
   * Validate a referral code
   * @param referralCode Referral code to validate
   * @param prisma Prisma client instance
   * @returns Client ID if code is valid, null otherwise
   */
  async validateReferralCode(referralCode: string, prisma: PrismaClient): Promise<string | null> {
    const client = await prisma.client.findUnique({
      where: { referralCode },
      select: { id: true }
    });
    
    return client ? client.id : null;
  }
}

// Export a singleton instance
export const organizationService = new OrganizationService(); 