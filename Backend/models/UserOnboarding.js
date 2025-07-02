import { pool as db } from '../config/database.js';


class UserOnboarding {
  static async create({
    userId,
    data,
    coreMessage = null
  }) {
    try {
      const query = `
        INSERT INTO user_onboarding (
          user_id, data, core_message
        ) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data = VALUES(data),
          core_message = VALUES(core_message)
      `;

      const [result] = await db.execute(query, [
        userId,
        data,
        coreMessage
      ]);

      return {
        id: result.insertId,
        userId,
        data,
        coreMessage
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateCoreMessage(userId, coreMessage) {
    try {
      const query = `
        UPDATE user_onboarding 
        SET core_message = ?
        WHERE user_id = ?
      `;

      await db.execute(query, [coreMessage, userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [metadata] = await db.execute(
        'SELECT * FROM user_onboarding WHERE user_id = ?',
        [userId]
      );
      return metadata[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

export default UserOnboarding; 