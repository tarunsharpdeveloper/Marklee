import { pool as db } from '../config/database.js';
import fs from 'fs/promises';

class Project {
    static async create(projectData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO projects (user_id, project_name, brand_id, status) VALUES (?, ?, ?, ?)',
                [projectData.userId, projectData.projectName, projectData.brandId || null, 'active']
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }   

    static async findByName(name , userId) {
        try {
            const [rows] = await db.execute('SELECT * FROM projects WHERE project_name = ? AND user_id = ?', [name, userId]);
            return rows[0];
        }   
        catch (error) {
            console.error('Error fetching project by name:', error);
            throw error;
        }
    }
    static async findById(id) {
        try {   
            const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching project by ID:', error);
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const [result] = await db.execute(
                'UPDATE projects SET project_name = ?, brand_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [updateData.projectName, updateData.brandId || null, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    static async findByUserWithBriefs(userId) {
        try {
            const [rows] = await db.execute(`
                    SELECT 
                        projects.id AS project_id,
                        projects.project_name,
                        projects.user_id,
                        projects.status,
                        projects.brand_id,
                        briefs.id AS brief_id,
                        briefs.purpose AS brief_title
                    FROM projects 
                    LEFT JOIN briefs ON projects.id = briefs.project_id 
                    WHERE projects.user_id = ?`, 
                    [userId]
                );
                const projectMap = {};

                for (const row of rows) {
                    const projectId = row.project_id;
        
                    if (!projectMap[projectId]) {
                        projectMap[projectId] = {
                            id: projectId,
                            name: row.project_name,
                            user_id: row.user_id,
                            status: row.status,
                            brand_id: row.brand_id,
                            briefs: []
                        };
                    }
        
                    if (row.brief_id) {
                        projectMap[projectId].briefs.push({
                            id: row.brief_id,
                            title: row.brief_title
                        });
                    }
                }
        
             return Object.values(projectMap);
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    static async findByBrandId(brandId) {
        try {
            const [rows] = await db.execute('SELECT * FROM projects WHERE brand_id = ? ORDER BY created_at DESC', [brandId]);
            return rows;
        } catch (error) {
            console.error('Error fetching projects by brand ID:', error);
            throw error;
        }
    }
}   

export default Project; 