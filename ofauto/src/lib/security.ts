import crypto from 'crypto';

// Ensure this secret is at least 32 bytes (256 bits) and stored securely in ENV
const ENCRYPTION_KEY = process.env.PLATFORM_CREDENTIAL_SECRET;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, IV is typically 12 bytes, but 16 is common standard
const AUTH_TAG_LENGTH = 16;

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  // In production, throw a fatal error or log extensively. Avoid default keys.
  console.error('FATAL ERROR: PLATFORM_CREDENTIAL_SECRET is missing or not 32 bytes hex encoded.');
  // For development/testing only, you might use a default, but NEVER in production:
  // if (process.env.NODE_ENV !== 'production') {
  //   ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex'); 
  //   console.warn('Using DEVELOPMENT default encryption key.');
  // } else {
  //    throw new Error('Missing PLATFORM_CREDENTIAL_SECRET in production');
  // }
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns An object containing the iv, authTag, and encrypted content (all hex encoded), or null on error.
 */
export function encryptCredential(text: string): { iv: string; encrypted: string; authTag: string } | null {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encrypted: encrypted,
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    // Consider using a more robust logging mechanism like the Pino logger
    // logger.error({ err: error }, 'Encryption failed');
    return null;
  }
}

/**
 * Decrypts AES-256-GCM encrypted text.
 * @param encryptedData An object containing the hex-encoded iv, encrypted content, and authTag.
 * @returns The original plaintext string, or null if decryption fails (e.g., bad key, tampered data).
 */
export function decryptCredential(encryptedData: { iv: string; encrypted: string; authTag: string }): string | null {
  try {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set the auth tag before final() to verify integrity
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // logger.error({ err: error }, 'Decryption failed - likely bad key or tampered data');
    return null;
  }
} 