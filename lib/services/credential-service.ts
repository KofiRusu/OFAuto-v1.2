import * as crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PlatformType } from '@prisma/client';

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Service for securely managing platform credentials
 */
export class CredentialService {
  /**
   * Store credentials for a platform
   */
  static async storeCredential(
    platformId: string,
    data: Record<string, any>
  ): Promise<void> {
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }

    // Convert data to string
    const dataString = JSON.stringify(data);
    
    // Create initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Encrypt data
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag for storage
    const encryptedData = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    
    // Store or update in database
    await prisma.platformCredential.upsert({
      where: {
        platformId,
      },
      update: {
        encryptedData,
        updatedAt: new Date(),
      },
      create: {
        platformId,
        encryptedData,
      },
    });
  }

  /**
   * Retrieve credentials for a platform
   */
  static async getCredential(
    platformId: string
  ): Promise<Record<string, any> | null> {
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }
    
    // Retrieve from database
    const credential = await prisma.platformCredential.findUnique({
      where: {
        platformId,
      },
    });
    
    if (!credential) {
      return null;
    }
    
    try {
      // Split stored data into components
      const [ivHex, authTagHex, encryptedHex] = credential.encryptedData.split(':');
      
      // Convert components to buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
      );
      
      // Set auth tag
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse and return decrypted data
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting credential:', error);
      return null;
    }
  }

  /**
   * Delete credentials for a platform
   */
  static async deleteCredential(platformId: string): Promise<void> {
    await prisma.platformCredential.delete({
      where: {
        platformId,
      },
    });
  }

  /**
   * Validate that required fields are present in credentials for the given platform type
   */
  static validateCredentialFields(
    platformType: PlatformType,
    data: Record<string, any>
  ): boolean {
    switch (platformType) {
      case 'ONLYFANS':
        return !!data.sessionId && !!data.userAgent;
      case 'FANSLY':
        return !!data.apiKey && !!data.username;
      case 'INSTAGRAM':
        return !!data.accessToken && !!data.refreshToken;
      case 'TWITTER':
        return !!data.apiKey && !!data.apiSecret && !!data.accessToken && !!data.accessTokenSecret;
      case 'KOFI':
        return !!data.apiKey;
      case 'PATREON':
        return !!data.accessToken && !!data.refreshToken;
      case 'GUMROAD':
        return !!data.apiKey;
      default:
        return false;
    }
  }
} 