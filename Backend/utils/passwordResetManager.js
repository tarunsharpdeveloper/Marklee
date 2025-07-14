    import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool as db } from '../config/database.js';

// In-memory storage for password reset tokens
const passwordResetTokens = new Map();

export const createResetToken = async (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiryTime = Date.now() + 3600000; // 1 hour expiry

  passwordResetTokens.set(token, {
    email,
    expiryTime
  });

  return token;
};

export const verifyAndResetPassword = async (token, newPassword) => {
  const tokenData = passwordResetTokens.get(token);
  
  if (!tokenData || Date.now() > tokenData.expiryTime) {
    return false;
  }

  const { email } = tokenData;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const query = 'UPDATE users SET password = $1 WHERE email = $2';
  await db.query(query, [hashedPassword, email]);

  // Remove the used token
  passwordResetTokens.delete(token);
  return true;
}; 