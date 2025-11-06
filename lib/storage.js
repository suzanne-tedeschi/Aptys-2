const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function _getKeyFromEnv() {
  const env = process.env.STORAGE_KEY || process.env.NEXT_PUBLIC_STORAGE_KEY;
  if (!env) throw new Error('STORAGE_KEY not set. See .env.example');
  // accept base64: prefix
  const b = env.startsWith('base64:') ? env.slice(7) : env;
  return Buffer.from(b, 'base64');
}

function encryptBuffer(buf) {
  const key = _getKeyFromEnv();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function decryptBuffer(buf) {
  const key = _getKeyFromEnv();
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const data = buf.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

function saveEncryptedFile(relPath, buffer) {
  const full = path.join(DATA_DIR, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const enc = encryptBuffer(buffer);
  fs.writeFileSync(full, enc);
}

function readEncryptedFile(relPath) {
  const full = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(full)) return null;
  const enc = fs.readFileSync(full);
  return decryptBuffer(enc);
}

function deleteFile(relPath) {
  const full = path.join(DATA_DIR, relPath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

module.exports = { saveEncryptedFile, readEncryptedFile, deleteFile };
