import { pool as db } from '../config/database.js';


class UserOnboarding {
  static async create({
    userId,
    data,
    coreMessage = null
  }) {
    try {
      console.log('=== USER ONBOARDING CREATE ===');
      console.log('User ID:', userId);
      console.log('Data length:', data ? data.length : 0);
      console.log('Data preview:', data ? data.substring(0, 200) + '...' : 'null');
      console.log('Core message:', coreMessage);

      const query = `
        INSERT INTO user_onboarding (
          user_id, data, core_message
        ) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data = VALUES(data),
          core_message = VALUES(core_message)
      `;

      console.log('SQL Query:', query);
      console.log('Query parameters:', [userId, data ? data.substring(0, 100) + '...' : 'null', coreMessage]);

      const [result] = await db.execute(query, [
        userId,
        data,
        coreMessage
      ]);

      console.log('Database result:', result);

      return {
        id: result.insertId,
        userId,
        data,
        coreMessage
      };
    } catch (error) {
      console.error('Error in UserOnboarding.create:', error);
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

  static async markCoreMessageSeen(userId) {
    try {
      const query = `
        UPDATE user_onboarding 
        SET core_message_seen = TRUE
        WHERE user_id = ?
      `;

      await db.execute(query, [userId]);
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