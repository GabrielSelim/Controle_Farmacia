import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive a key from the master key using PBKDF2
 */
function getKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} masterKey - Master key from environment
 * @returns {string} - Encrypted text (base64)
 */
export function encrypt(text, masterKey) {
  if (!text || !masterKey) {
    throw new Error('Text and master key are required for encryption');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Concatenate salt + iv + tag + encrypted data
  const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
  
  return result.toString('base64');
}

/**
 * Decrypt a string using AES-256-GCM
 * @param {string} encryptedText - Encrypted text (base64)
 * @param {string} masterKey - Master key from environment
 * @returns {string} - Decrypted text
 */
export function decrypt(encryptedText, masterKey) {
  if (!encryptedText || !masterKey) {
    throw new Error('Encrypted text and master key are required for decryption');
  }

  const buffer = Buffer.from(encryptedText, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = getKey(masterKey, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
