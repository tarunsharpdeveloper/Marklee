import { pool as db } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

class UserMetadata {
  static async create({
    userId,
    name,
    role,
    organizationType,
    organizationName,
    supportType,
    productDescription,
    businessModel,
    revenueModel
  }) {
    try {
      const query = `
        INSERT INTO user_metadata (
          user_id, name, role, organization_type, organization_name,
          support_type, product_description, business_model,
          revenue_model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        userId,
        name,
        role,
        organizationType,
        organizationName,
        supportType,
        productDescription,
        businessModel,
        revenueModel
      ]);

      return {
        id: result.insertId,
        userId,
        name,
        role,
        organizationType,
        organizationName,
        supportType,
        productDescription,
        businessModel,
        revenueModel
      };
    } catch (error) {
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [metadata] = await db.execute(
        'SELECT * FROM user_metadata WHERE user_id = ?',
        [userId]
      );
      return metadata[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

export default UserMetadata; 