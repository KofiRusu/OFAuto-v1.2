import { prisma } from "@/lib/prisma";
import { PlatformType } from "./types";
import * as crypto from "crypto";

/**
 * Service for securely managing platform credentials
 */
export class CredentialService {
  private static instance: CredentialService;
  private encryptionKey: Buffer;
  private algorithm = "aes-256-gcm";

  private constructor() {
    // Generate encryption key from environment variable
    // In production, this should be a secure, stable key
    const secret = process.env.CREDENTIAL_ENCRYPTION_KEY || "default-encryption-key-for-development-only";
    this.encryptionKey = crypto.scryptSync(secret, "salt", 32);
  }

  public static getInstance(): CredentialService {
    if (!CredentialService.instance) {
      CredentialService.instance = new CredentialService();
    }
    return CredentialService.instance;
  }

  /**
   * Encrypt a credential value
   */
  private encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      authTag,
    };
  }

  /**
   * Decrypt a credential value
   */
  private decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, "hex")
    ) as crypto.DecipherGCM;
    
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  /**
   * Store credentials for a platform
   */
  public async storeCredentials(
    platformId: string,
    credentials: Record<string, string>
  ): Promise<boolean> {
    try {
      // Get the platform to ensure it exists
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
      });

      if (!platform) {
        throw new Error(`Platform with ID ${platformId} not found`);
      }

      // Store each credential
      for (const [key, value] of Object.entries(credentials)) {
        // Encrypt the credential
        const { encryptedData, iv, authTag } = this.encrypt(value);

        // Store in database
        await prisma.platformCredential.upsert({
          where: {
            platformId_key: {
              platformId,
              key,
            },
          },
          update: {
            value: encryptedData,
            iv,
            authTag,
            updatedAt: new Date(),
          },
          create: {
            platformId,
            key,
            value: encryptedData,
            iv,
            authTag,
          },
        });
      }

      return true;
    } catch (error) {
      console.error("Error storing credentials:", error);
      return false;
    }
  }

  /**
   * Get credentials for a platform
   */
  public async getCredentials(platformId: string): Promise<Record<string, string>> {
    try {
      // Get credentials from database
      const platformCredentials = await prisma.platformCredential.findMany({
        where: { platformId },
      });

      const credentials: Record<string, string> = {};

      // Decrypt each credential
      for (const credential of platformCredentials) {
        try {
          const decrypted = this.decrypt(
            credential.value,
            credential.iv,
            credential.authTag
          );
          credentials[credential.key] = decrypted;
        } catch (error) {
          console.error(`Error decrypting credential ${credential.key}:`, error);
          // Skip this credential
        }
      }

      return credentials;
    } catch (error) {
      console.error("Error getting credentials:", error);
      return {};
    }
  }

  /**
   * Get required credentials for a platform type
   */
  public getRequiredCredentials(platformType: PlatformType): string[] {
    switch (platformType) {
      case "TELEGRAM":
        return ["botToken"];
      case "INSTAGRAM":
        return ["accessToken", "appId", "appSecret"];
      case "TWITTER":
        return ["apiKey", "apiSecret", "accessToken", "accessSecret"];
      case "ONLYFANS":
        return ["username", "password", "userAgent"];
      case "EMAIL":
        return ["smtpHost", "smtpPort", "username", "password"];
      default:
        return [];
    }
  }

  /**
   * Delete credentials for a platform
   */
  public async deleteCredentials(platformId: string): Promise<boolean> {
    try {
      await prisma.platformCredential.deleteMany({
        where: { platformId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting credentials:", error);
      return false;
    }
  }

  /**
   * Validate credentials for a platform type
   */
  public validateCredentialSet(
    platformType: PlatformType,
    credentials: Record<string, string>
  ): string[] {
    const required = this.getRequiredCredentials(platformType);
    const missing = required.filter(key => !credentials[key]);
    return missing;
  }
} 