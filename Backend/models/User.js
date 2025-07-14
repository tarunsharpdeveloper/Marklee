import { pool as db } from '../config/database.js';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

class User {
  static async create({ email, password, name }) {
    try {
      console.log('Creating new user:', email);
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      
      console.log('Generated OTP:', otp, 'Expiry:', otpExpiry);
      
      const query = `
        INSERT INTO users (email, password, name, otp, otp_expiry, is_verified)
        VALUES (?, ?, ?, ?, ?, false)
      `;
      
      console.log('Executing database query...');
      const [result] = await db.execute(query, [email, hashedPassword, name, otp, otpExpiry]);
      console.log('User created in database, ID:', result.insertId);
      
      return { userId: result.insertId, otp };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async verifyOTP(email, otp) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE email = ? AND otp = ? AND otp_expiry > NOW() AND is_verified = false
      `;
      
      const [users] = await db.execute(query, [email, otp]);
      
      if (users.length === 0) {
        return false;
      }

      // Update user verification status
      await db.execute(
        'UPDATE users SET is_verified = true, otp = NULL, otp_expiry = NULL WHERE email = ?',
        [email]
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return users[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async regenerateOTP(email) {
    try {
      console.log('Regenerating OTP for:', email);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      console.log('New OTP generated:', otp, 'Expiry:', otpExpiry);
      
      await db.execute(
        'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?',
        [otp, otpExpiry, email]
      );
      console.log('OTP updated in database');

      return otp;
    } catch (error) {
      console.error('Error regenerating OTP:', error);
      throw error;
    }
  }

  static async findById(id) {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return users[0];
  }

  async save() {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);

      const [result] = await db.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [this.username, this.email, this.password]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll(offset, limit) {
    try {
      // Convert to numbers and ensure they're valid
      const offsetNum = Math.max(0, parseInt(offset) || 0);
      const limitNum = Math.max(1, parseInt(limit) || 10);

      // First get total count
      const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
      const totalUsersCount = totalUsers[0].count;
      
      // Then get paginated users
      const query = `
        SELECT id, name, email, role, is_verified, status, created_at 
        FROM users 
        WHERE role = "user" 
        ORDER BY created_at ASC 
        LIMIT ${limitNum} 
        OFFSET ${offsetNum}
      `;
      const [users] = await db.query(query);
      
      const totalPages = Math.ceil(totalUsersCount / limitNum);
      
      return { 
        users, 
        totalUsers: totalUsersCount, 
        totalPages,
        currentPage: Math.floor(offsetNum / limitNum) + 1
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const [result] = await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
      if(result.affectedRows > 0){
        return true;
      }
      throw new Error('User not found');
    } catch (error) {
      throw error;
    }
  }

  static async createPasswordResetToken(email) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiryTime = new Date(Date.now() + 3600000); // 1 hour expiry

      // Store token in database
      await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
        [token, expiryTime, email]
      );

      return token;
    } catch (error) {
      console.error('Error creating reset token:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      // Find user with valid token
      const [users] = await db.execute(
        'SELECT email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
        [token]
      );

      if (users.length === 0) {
        console.log('Invalid or expired token:', token);
        return false;
      }

      const { email } = users[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await db.execute(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
        [hashedPassword, email]
      );

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}

export default User; 