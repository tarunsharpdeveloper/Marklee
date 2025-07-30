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

    static async deleteMany(briefId, audienceIds) {
        const placeholders = audienceIds.map(() => '?').join(',');
        const query = `DELETE FROM audiences WHERE brief_id = ? AND id IN (${placeholders})`;
        
        await db.execute(query, [briefId, ...audienceIds]);
        return true;
    }

    // Find audiences by project ID (via briefs)
    static async findByProjectId(projectId) {
        try {
            const [rows] = await db.execute(
                `SELECT a.* FROM audiences a
                 INNER JOIN briefs b ON a.brief_id = b.id
                 WHERE b.project_id = ?`,
                [projectId]
            );
            return rows.map(row => new Audience(row));
        } catch (error) {
            console.error('Error fetching audiences by project ID:', error);
            throw error;
        }
    }

    // Find audiences by project ID with additional details
    static async findByProjectIdWithDetails(projectId) {
        try {
            const [rows] = await db.execute(
                `SELECT a.*, b.project_id, b.project_name 
                 FROM audiences a
                 INNER JOIN briefs b ON a.brief_id = b.id
                 WHERE b.project_id = ?
                 ORDER BY a.created_at DESC`,
                [projectId]
            );
            return rows.map(row => new Audience(row));
        } catch (error) {
            console.error('Error fetching audiences by project ID with details:', error);
            throw error;
        }
    }

    // Delete all audiences for a project
    static async deleteByProjectId(projectId) {
        try {
            const [result] = await db.execute(
                `DELETE a FROM audiences a
                 INNER JOIN briefs b ON a.brief_id = b.id
                 WHERE b.project_id = ?`,
                [projectId]
            );
            return result;
        } catch (error) {
            console.error('Error deleting audiences by project ID:', error);
            throw error;
        }
    }

    // Update audience details
    static async update(id, updateData) {
        try {
            const [result] = await db.execute(
                `UPDATE audiences 
                 SET segment = ?, 
                     insights = ?, 
                     messaging_angle = ?, 
                     support_points = ?, 
                     tone = ?, 
                     persona_profile = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    updateData.segment,
                    updateData.insights,
                    updateData.messagingAngle,
                    updateData.supportPoints,
                    updateData.tone,
                    updateData.personaProfile,
                    id
                ]
            );
            return result;
        } catch (error) {
            console.error('Error updating audience:', error);
            throw error;
        }
    }
}

export default Audience; 