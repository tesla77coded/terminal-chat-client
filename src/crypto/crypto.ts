import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ... (key generation and loading functions remain the same) ...
const keyDirectory = path.join(os.homedir(), '.terminal-chat');
const privateKeyPath = path.join(keyDirectory, 'private_key.pem');
const publicKeyPath = path.join(keyDirectory, 'public_key.pem');
interface KeyPair { publicKey: string; privateKey: string; }
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
// -----------------------------------------------------------------

export interface HybridEncrypted {
  iv: string;
  encryptedKey: string;
  encryptedMessage: string;
  authTag: string;
}

export function hybridEncrypt(message: string, publicKey: string): HybridEncrypted {
  const symmetricKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey, iv);
  const encryptedMessage = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // The public key is now the full, correct PEM format
  const encryptedKey = crypto.publicEncrypt({
    key: publicKey,
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
