import { pool as db } from '../config/database.js';

class GeneratedContent {
    constructor(data) {
        this.id = data.id;
        this.briefId = data.briefId;
        this.audienceId = data.audienceId;
        this.assetType = data.assetType;
        this.content = data.content;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static async create(contentData) {
        try {
            const [result] = await db.execute(
                `INSERT INTO generated_content 
                (brief_id, audience_id, asset_type, content) 
                VALUES (?, ?, ?, ?)`,
                [
                    contentData.briefId,
                    contentData.audienceId,
                    contentData.assetType,
                    contentData.content
                ]
            );
            return result.insertId;
        }
        catch (error) {
            console.error('Error creating generated content:', error);
            throw error;
        }
    }

    static async findByBriefId(briefId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM generated_content WHERE brief_id = ?',
                [briefId]
            );
            return rows.map(row => new GeneratedContent(row));
        }
        catch (error) {
            console.error('Error fetching generated content by brief ID:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM generated_content WHERE id = ?',
                [id]
            );
            return rows[0] ? new GeneratedContent(rows[0]) : null;
        }
        catch (error) {
            console.error('Error fetching generated content by ID:', error);
            throw error;
        }
    }

    static async update(id, contentData) {
        try {
            await db.execute(
                `UPDATE generated_content 
                SET content = ?
                WHERE id = ?`,
                [contentData.content, id]
            );
            return true;
        }
        catch (error) {
            console.error('Error updating generated content:', error);
            throw error;
        }
    }
}

export default GeneratedContent; 