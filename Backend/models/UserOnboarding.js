import { pool as db } from '../config/database.js';


class UserOnboarding {
  static async create({
    userId,
    data
  }) {
    try {
      const query = `
        INSERT INTO user_onboarding (
          user_id, data
        ) VALUES (?, ?)
      `;

      const [result] = await db.execute(query, [
        userId,
        data
      ]);

      return {
        id: result.insertId,
        userId,
        data
      };
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