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
        try {
            const [result] = await db.execute(
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
            console.error('Error creating brief:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM briefs WHERE id = ?',
                [id]
            );
            return rows[0] ? new Brief(rows[0]) : null;
        } catch (error) {
            console.error('Error fetching brief:', error);
            throw error;
        }
    }

    static async findByProject(projectName) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM briefs WHERE project_name = ?',
                [projectName]
            );
            return rows.map(row => new Brief(row));
        } catch (error) {
            console.error('Error fetching briefs:', error);
            throw error;
        }
    }
}

module.exports = Brief; 