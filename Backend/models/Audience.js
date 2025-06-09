const { pool: db } = require('../config/database');

class Audience {
    constructor(data) {
        this.id = data.id;
        this.briefId = data.briefId;
        this.segment = data.segment;
        this.insights = data.insights;
        this.messagingAngle = data.messagingAngle;
        this.supportPoints = data.supportPoints;
        this.tone = data.tone;
        this.personaProfile = data.personaProfile;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static async create(audienceData) {
        try {
            const [result] = await db.execute(
                `INSERT INTO audiences 
                (brief_id, segment, insights, messaging_angle, support_points, 
                tone, persona_profile) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    audienceData.briefId,
                    audienceData.segment,
                    audienceData.insights,
                    audienceData.messagingAngle,
                    audienceData.supportPoints,
                    audienceData.tone,
                    audienceData.personaProfile
                ]
            );
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating audience:', error);
            throw error;
        }
    }

    static async findByBriefId(briefId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM audiences WHERE brief_id = ?',
                [briefId]
            );
            return rows.map(row => new Audience(row));
        }
        catch (error) {
            console.error('Error fetching audience by brief ID:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM audiences WHERE id = ?',
                [id]
            );
            return rows[0] ? new Audience(rows[0]) : null;
        }
        catch (error) {
            console.error('Error fetching audience by ID:', error);
            throw error;
        }
    }
}

module.exports = Audience; 