
const { pool: db } = require('../config/database');
const fs = require('fs').promises;

class Project {
    static async create(projectData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO projects (user_id, project_name, status) VALUES (?, ?, ?)',
                [projectData.userId, projectData.projectName, 'active']
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

    static async findByUserWithBriefs(userId) {
        try {
            const [rows] = await db.execute(`
                    SELECT 
                        projects.id AS project_id,
                        projects.project_name,
                        projects.user_id,
                        projects.status,
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
}

module.exports = Project; 