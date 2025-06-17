import { pool as db } from '../config/database.js';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

class User {
  static async create({ email, password, name }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      
      const query = `
        INSERT INTO users (email, password, name, otp, otp_expiry, is_verified)
        VALUES (?, ?, ?, ?, ?, false)
      `;
      
      const [result] = await db.execute(query, [email, hashedPassword, name, otp, otpExpiry]);
      return { userId: result.insertId, otp };
    } catch (error) {
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
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      await db.execute(
        'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?',
        [otp, otpExpiry, email]
      );

      return otp;
    } catch (error) {
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
      const [users] = await db.execute('SELECT id, name, email, role, is_verified, status , created_at FROM users WHERE role = "user" ORDER BY status ASC LIMIT ? OFFSET ?', [limit, offset]);
      const [totalUsers] = await db.execute('SELECT COUNT(*) FROM users WHERE role = "user"');
      const totalUsersCount = totalUsers[0]['COUNT(*)'];
      const totalPages = Math.ceil(totalUsersCount / limit);
      return { users, totalUsers: totalUsersCount, totalPages };
    } catch (error) {
      console.log(error);
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
}

export default User; 