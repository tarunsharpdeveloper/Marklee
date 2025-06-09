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
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
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
        } finally {
            await connection.end();
        }
    }

    static async findByBriefId(briefId) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM audiences WHERE brief_id = ?',
                [briefId]
            );
            return rows.map(row => new Audience(row));
        } finally {
            await connection.end();
        }
    }

    static async findById(id) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM audiences WHERE id = ?',
                [id]
            );
            return rows[0] ? new Audience(rows[0]) : null;
        } finally {
            await connection.end();
        }
    }
}

module.exports = Audience; 