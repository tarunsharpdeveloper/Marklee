const { pool: db } = require('../config/database');

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
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
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
        } finally {
            await connection.end();
        }
    }

    static async findByBriefId(briefId) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM generated_content WHERE brief_id = ?',
                [briefId]
            );
            return rows.map(row => new GeneratedContent(row));
        } finally {
            await connection.end();
        }
    }

    static async findById(id) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM generated_content WHERE id = ?',
                [id]
            );
            return rows[0] ? new GeneratedContent(rows[0]) : null;
        } finally {
            await connection.end();
        }
    }

    static async update(id, contentData) {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                `UPDATE generated_content 
                SET content = ?
                WHERE id = ?`,
                [contentData.content, id]
            );
            return true;
        } finally {
            await connection.end();
        }
    }
}

module.exports = GeneratedContent; 