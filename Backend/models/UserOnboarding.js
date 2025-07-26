import { pool as db } from '../config/database.js';


class UserOnboarding {
  static async create({
    userId,
    projectId = null,
    data,
    coreMessage = null
  }) {
    try {
      console.log('=== USER ONBOARDING CREATE ===');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);
      console.log('Data length:', data ? data.length : 0);
      console.log('Data preview:', data ? data.substring(0, 200) + '...' : 'null');
      console.log('Core message:', coreMessage);

      const query = `
        INSERT INTO user_onboarding (
          user_id, project_id, data, core_message
        ) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          data = VALUES(data),
          core_message = VALUES(core_message)
      `;

      console.log('SQL Query:', query);
      console.log('Query parameters:', [userId, projectId, data ? data.substring(0, 100) + '...' : 'null', coreMessage]);

      const [result] = await db.execute(query, [
        userId,
        projectId,
        data,
        coreMessage
      ]);

      console.log('Database result:', result);

      return {
        id: result.insertId,
        userId,
        projectId,
        data,
        coreMessage
      };
    } catch (error) {
      console.error('Error in UserOnboarding.create:', error);
      throw error;
    }
  }

  static async updateProjectData(userId, projectId, data, coreMessage) {
    try {
      console.log('=== UPDATING PROJECT DATA ===');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);
      console.log('Data length:', data ? data.length : 0);
      console.log('Core message:', coreMessage);

      // First check if record exists
      const existingRecord = await this.findByUserIdAndProject(userId, projectId);
      
      if (existingRecord) {
        // Update existing record
        const query = `
          UPDATE user_onboarding 
          SET data = ?, core_message = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND project_id = ?
        `;

        const [result] = await db.execute(query, [data, coreMessage, userId, projectId]);
        console.log('Updated existing record:', result.affectedRows > 0);
        
        return {
          id: existingRecord.id,
          userId,
          projectId,
          data,
          coreMessage
        };
      } else {
        // Create new record
        const query = `
          INSERT INTO user_onboarding (
            user_id, project_id, data, core_message
          ) VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [userId, projectId, data, coreMessage]);
        console.log('Created new record:', result.insertId);
        
        return {
          id: result.insertId,
          userId,
          projectId,
          data,
          coreMessage
        };
      }
    } catch (error) {
      console.error('Error in UserOnboarding.updateProjectData:', error);
      throw error;
    }
  }

  static async updateProjectCoreMessage(userId, projectId, coreMessage) {
    try {
      console.log('=== UPDATING PROJECT CORE MESSAGE ===');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);
      console.log('Core message:', coreMessage);

      // First check if record exists
      const existingRecord = await this.findByUserIdAndProject(userId, projectId);
      
      if (existingRecord) {
        // Update existing record
        const query = `
          UPDATE user_onboarding 
          SET core_message = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND project_id = ?
        `;

        const [result] = await db.execute(query, [coreMessage, userId, projectId]);
        console.log('Updated core message for existing record:', result.affectedRows > 0);
        
        return true;
      } else {
        console.log('No existing record found for project, cannot update core message');
        return false;
      }
    } catch (error) {
      console.error('Error in UserOnboarding.updateProjectCoreMessage:', error);
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

  static async findByUserIdAndProject(userId, projectId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user_onboarding WHERE user_id = ? AND project_id = ?',
        [userId, projectId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error in UserOnboarding.findByUserIdAndProject:', error);
      throw error;
    }
  }

  static async updateCurrentFormStep(userId, projectId, currentStep) {
    try {
      console.log('=== UPDATING CURRENT FORM STEP ===');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);
      console.log('Current step:', currentStep);

      const query = `
        UPDATE user_onboarding 
        SET current_form_step = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND project_id = ?
      `;

      const [result] = await db.execute(query, [currentStep, userId, projectId]);
      console.log('Updated current form step:', result.affectedRows > 0);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in UserOnboarding.updateCurrentFormStep:', error);
      throw error;
    }
  }

  static async getCurrentFormStep(userId, projectId) {
    try {
      console.log('=== GETTING CURRENT FORM STEP ===');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);

      const query = `
        SELECT current_form_step 
        FROM user_onboarding 
        WHERE user_id = ? AND project_id = ?
      `;

      const [rows] = await db.execute(query, [userId, projectId]);
      console.log('Current form step result:', rows);
      
      return rows.length > 0 ? rows[0].current_form_step : 1; // Default to step 1
    } catch (error) {
      console.error('Error in UserOnboarding.getCurrentFormStep:', error);
      return 1; // Default to step 1 on error
    }
  }

}

export default UserOnboarding; 