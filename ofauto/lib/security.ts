import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES-GCM, IV is typically 12 or 16 bytes. Nodejs default is 12, but 16 is also common.
const AUTH_TAG_LENGTH = 16; // AES-GCM auth tag is typically 16 bytes.

const getKey = (): Buffer => {
  const key = process.env.PLATFORM_CREDENTIAL_SECRET;
  if (!key || Buffer.from(key, 'hex').length !== 32) {
    throw new Error('PLATFORM_CREDENTIAL_SECRET must be a 32-byte hex-encoded string.');
  }
  return Buffer.from(key, 'hex');
};

export function encrypt(text: string): { iv: string; encryptedData: string; authTag: string } {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(encryptedData: string, ivHex: string, authTagHex: string): string {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
} 