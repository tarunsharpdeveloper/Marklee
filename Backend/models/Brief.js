const { pool: db } = require('../config/database');

class Brief {
    constructor(data) {
        this.id = data.id;
        this.projectName = data.projectName;
        this.purpose = data.purpose;
        this.mainMessage = data.mainMessage;
        this.specialFeatures = data.specialFeatures;
        this.beneficiaries = data.beneficiaries;
        this.benefits = data.benefits;
        this.callToAction = data.callToAction;
        this.importance = data.importance;
        this.additionalInfo = data.additionalInfo;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static async create(briefData) {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO briefs 
                (project_id, project_name, purpose, main_message, special_features, beneficiaries, 
                benefits, call_to_action, importance, additional_info) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    briefData.projectId,      
                    briefData.projectName,      
                    briefData.purpose,
                    briefData.mainMessage,
                    briefData.specialFeatures,
                    briefData.beneficiaries,
                    briefData.benefits,
                    briefData.callToAction,
                    briefData.importance,
                    briefData.additionalInfo
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error in Brief.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM briefs WHERE id = ?',
                [id]
            );
            return rows[0] ? new Brief(rows[0]) : null;
        } catch (error) {
            console.error('Error in Brief.findById:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findByProject(projectName) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM briefs WHERE project_name = ?',
                [projectName]
            );
            return rows.map(row => new Brief(row));
        } catch (error) {
            console.error('Error in Brief.findByProject:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Brief; 