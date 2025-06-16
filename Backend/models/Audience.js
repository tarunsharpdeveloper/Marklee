import { pool as db } from '../config/database.js';

class Audience {
    constructor(data) {
        this.id = data.id;
        this.briefId = data.brief_id;
        this.segment = data.segment;
        this.insights = data.insights;
        this.messagingAngle = data.messaging_angle;
        this.supportPoints = data.support_points ? 
            (typeof data.support_points === 'string' ? 
                JSON.parse(data.support_points) : 
                data.support_points) : 
            null;
        this.tone = data.tone;
        this.personaProfile = data.persona_profile;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    static async create(audienceArray) {
        try {
            if (!Array.isArray(audienceArray) || audienceArray.length === 0) {
                throw new Error("audienceData must be a non-empty array");
            }
    
            const placeholders = audienceArray.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
            const values = [];
    
            for (const item of audienceArray) {
                values.push(
                    item.briefId,
                    item.segment,
                    item.insights,
                    item.messagingAngle,
                    item.supportPoints,
                    item.tone,
                    item.personaProfile
                );
            }
    
            const [result] = await db.execute(
                `INSERT INTO audiences 
                (brief_id, segment, insights, messaging_angle, support_points, tone, persona_profile)
                VALUES ${placeholders}`,
                values
            );
    
            return result;
        } catch (error) {
            console.error('Bulk insert error:', error);
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

export default Audience; 