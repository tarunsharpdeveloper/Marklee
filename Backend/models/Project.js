
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

    static async findById(id) {
        try {   
            const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching project by ID:', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await db.execute('SELECT * FROM projects');
            return rows;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }   
}

module.exports = Project; 