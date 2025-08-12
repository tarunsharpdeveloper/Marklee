import { pool as db } from '../config/database.js';

class Brand {
    static async create(brandData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO brands (user_id, brand_name, industry, short_description, website_link) VALUES (?, ?, ?, ?, ?)',
                [
                    brandData.userId,
                    brandData.brandName,
                    brandData.industry,
                    brandData.shortDescription,
                    brandData.websiteLink || null
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating brand:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM brands WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching brand by ID:', error);
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await db.execute('SELECT * FROM brands WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            return rows;
        } catch (error) {
            console.error('Error fetching brands by user ID:', error);
            throw error;
        }
    }

    static async findByName(brandName, userId) {
        try {
            const [rows] = await db.execute('SELECT * FROM brands WHERE brand_name = ? AND user_id = ?', [brandName, userId]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching brand by name:', error);
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const [result] = await db.execute(
                'UPDATE brands SET brand_name = ?, industry = ?, short_description = ?, website_link = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [
                    updateData.brandName,
                    updateData.industry,
                    updateData.shortDescription,
                    updateData.websiteLink || null,
                    id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.execute('DELETE FROM brands WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    }

    static async findWithProjects(userId) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    b.id as brand_id,
                    b.brand_name,
                    b.industry,
                    b.short_description,
                    b.website_link,
                    b.status as brand_status,
                    b.created_at as brand_created_at,
                    p.id as project_id,
                    p.project_name,
                    p.status as project_status,
                    p.created_at as project_created_at
                FROM brands b
                LEFT JOIN projects p ON b.id = p.brand_id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC, p.created_at DESC
            `, [userId]);

            // Group projects by brand
            const brandMap = {};
            rows.forEach(row => {
                if (!brandMap[row.brand_id]) {
                    brandMap[row.brand_id] = {
                        id: row.brand_id,
                        brandName: row.brand_name,
                        industry: row.industry,
                        shortDescription: row.short_description,
                        websiteLink: row.website_link,
                        status: row.brand_status,
                        createdAt: row.brand_created_at,
                        projects: []
                    };
                }
                
                if (row.project_id) {
                    brandMap[row.brand_id].projects.push({
                        id: row.project_id,
                        projectName: row.project_name,
                        status: row.project_status,
                        createdAt: row.project_created_at
                    });
                }
            });

            return Object.values(brandMap);
        } catch (error) {
            console.error('Error fetching brands with projects:', error);
            throw error;
        }
    }
}

export default Brand; 