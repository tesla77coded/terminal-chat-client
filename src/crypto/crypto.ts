import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const keyDirectory = path.join(os.homedir(), '.terminal-chat');
const privateKeyPath = path.join(keyDirectory, 'private_key.pem');
const publicKeyPath = path.join(keyDirectory, 'public_key.pem');

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// --- HELPER FUNCTIONS ---
// Strips PEM headers/footers and newlines to get the raw Base64 key
export function stripPem(key: string): string {
  return key
    .replace(/-----BEGIN (PUBLIC|PRIVATE) KEY-----/, '')
    .replace(/-----END (PUBLIC|PRIVATE) KEY-----/, '')
    .replace(/\s/g, '');
}

// Re-adds PEM formatting so the crypto module can use the key
function formatAsPem(key: string, type: 'PUBLIC' | 'PRIVATE'): string {
  const header = `-----BEGIN ${type} KEY-----\n`;
  const footer = `\n-----END ${type} KEY-----`;
  const body = key.match(/.{1,64}/g)?.join('\n') || '';
  return header + body + footer;
}
// ----------------------------

function generateKeys(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

function saveKeys(keys: KeyPair) {
  if (!fs.existsSync(keyDirectory)) { fs.mkdirSync(keyDirectory); }
  fs.writeFileSync(publicKeyPath, keys.publicKey);
  fs.writeFileSync(privateKeyPath, keys.privateKey);
}

export function loadKeys(): KeyPair | null {
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
    return { publicKey, privateKey };
  }
  return null;
}

export function initializeKeys(): KeyPair {
  let keys = loadKeys();
  if (!keys) {
    keys = generateKeys();
    saveKeys(keys);
  }
  return keys;
}

// --- NEW HYBRID ENCRYPTION LOGIC ---

export interface HybridEncrypted {
  iv: string;
  encryptedKey: string;
  encryptedMessage: string;
  authTag: string;
}

export function hybridEncrypt(message: string, rawPublicKey: string): HybridEncrypted {
  const symmetricKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey, iv);
  const encryptedMessage = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedKey = crypto.publicEncrypt({
    key: formatAsPem(rawPublicKey, 'PUBLIC'),
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, symmetricKey);

  return {
    iv: iv.toString('base64'),
    encryptedKey: encryptedKey.toString('base64'),
    encryptedMessage: encryptedMessage.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function hybridDecrypt(encryptedPackage: HybridEncrypted, privateKey: string): string {
  const symmetricKey = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, Buffer.from(encryptedPackage.encryptedKey, 'base64'));

  const iv = Buffer.from(encryptedPackage.iv, 'base64');
  const encryptedMessage = Buffer.from(encryptedPackage.encryptedMessage, 'base64');
  const authTag = Buffer.from(encryptedPackage.authTag, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey, iv);
  decipher.setAuthTag(authTag);
  const decryptedMessage = Buffer.concat([decipher.update(encryptedMessage), decipher.final()]);

  return decryptedMessage.toString('utf8');
}
